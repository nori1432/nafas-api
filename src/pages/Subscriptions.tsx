import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const PLAN_COLORS: Record<string, string> = {
  premium: '#C0392B', standard: '#2980B9', basic: '#27AE60', trial: '#F39C12',
}
const STATUS_COLORS: Record<string, string> = {
  active: '#27AE60', expired: '#E74C3C', cancelled: '#888', trial: '#F39C12',
}

export default function Subscriptions() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState({ status: '', plan: '' })
  const [editing, setEditing] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter.status) params.set('status', filter.status)
      if (filter.plan) params.set('plan', filter.plan)
      return (await api.get(`/admin/subscriptions?${params}`)).data.data as any[]
    },
  })

  const updateMut = useMutation({
    mutationFn: (payload: any) => api.put(`/admin/subscriptions/${payload.id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); setEditing(null) },
  })

  const rows = data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="field" style={{ flex: 1, minWidth: 140 }}>
          <span>Status</span>
          <select className="input" value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            {['active','trial','expired','cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 140 }}>
          <span>Plan</span>
          <select className="input" value={filter.plan} onChange={(e) => setFilter((f) => ({ ...f, plan: e.target.value }))}>
            <option value="">All</option>
            {['basic','standard','premium'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {isLoading ? <p>Loading…</p> : (
          <table className="nfs">
            <thead><tr>
              <th>Hospital</th><th>Plan</th><th>Status</th><th>Price/mo (DZD)</th>
              <th>Start</th><th>End</th><th></th>
            </tr></thead>
            <tbody>
              {rows.map((s: any) => (
                <tr key={s.id}>
                  <td>{s.hospital_name || `#${s.hospital_id}`}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, background: PLAN_COLORS[s.plan] || '#888', color: '#fff', fontSize: 12 }}>{s.plan}</span></td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, background: STATUS_COLORS[s.status] || '#888', color: '#fff', fontSize: 12 }}>{s.status}</span></td>
                  <td>{Number(s.price_monthly).toLocaleString()}</td>
                  <td>{s.start_date?.slice(0, 10)}</td>
                  <td>{s.end_date?.slice(0, 10)}</td>
                  <td><button className="btn" onClick={() => setEditing(s)}>Edit</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No subscriptions found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 400, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Edit Subscription #{editing.id}</h3>
            <label className="field"><span>Plan</span>
              <select className="input" value={editing.plan} onChange={(e) => setEditing((s: any) => ({ ...s, plan: e.target.value }))}>
                {['basic','standard','premium'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="field"><span>Status</span>
              <select className="input" value={editing.status} onChange={(e) => setEditing((s: any) => ({ ...s, status: e.target.value }))}>
                {['active','trial','expired','cancelled'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field"><span>Price/month (DZD)</span>
              <input className="input" type="number" value={editing.price_monthly} onChange={(e) => setEditing((s: any) => ({ ...s, price_monthly: e.target.value }))} />
            </label>
            <label className="field"><span>End date</span>
              <input className="input" type="date" value={editing.end_date?.slice(0, 10)} onChange={(e) => setEditing((s: any) => ({ ...s, end_date: e.target.value }))} />
            </label>
            <label className="field"><span>Notes</span>
              <input className="input" value={editing.notes || ''} onChange={(e) => setEditing((s: any) => ({ ...s, notes: e.target.value }))} />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => updateMut.mutate(editing)} disabled={updateMut.isPending}>
                {updateMut.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
