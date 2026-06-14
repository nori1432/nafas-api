import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const URGENCY_COLORS: Record<string, string> = {
  critical: '#C0392B', high: '#E67E22', medium: '#F1C40F', low: '#27AE60',
}
const STATUS_COLORS: Record<string, string> = {
  open: '#2980B9', reviewing: '#8E44AD', assigned: '#E67E22',
  in_progress: '#F39C12', resolved: '#27AE60', closed: '#888',
}

export default function HospNeeds() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const { data, isLoading } = useQuery({
    queryKey: ['hosp-needs'],
    queryFn: async () => (await api.get('/hospital-portal/needs')).data.data as any[],
  })

  const createMut = useMutation({
    mutationFn: (payload: any) => api.post('/hospital-portal/needs', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hosp-needs'] }); setCreating(false); setForm({}) },
  })

  const offerMut = useMutation({
    mutationFn: ({ nid, oid, action }: any) => api.put(`/hospital-portal/needs/${nid}/offers/${oid}`, { action }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hosp-needs'] }); setSelected(null) },
  })

  const rows = data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ New Maintenance Need</button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {isLoading ? <p>Loading…</p> : (
          <table className="nfs">
            <thead><tr><th>Title</th><th>Urgency</th><th>Status</th><th>Budget (DZD)</th><th>Deadline</th><th>Offers</th><th></th></tr></thead>
            <tbody>
              {rows.map((n: any) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600 }}>{n.title}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, background: URGENCY_COLORS[n.urgency] || '#888', color: '#fff', fontSize: 12 }}>{n.urgency}</span></td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, background: STATUS_COLORS[n.status] || '#888', color: '#fff', fontSize: 12 }}>{n.status}</span></td>
                  <td>{n.budget_min?.toLocaleString()} – {n.budget_max?.toLocaleString()}</td>
                  <td>{n.deadline?.slice(0, 10)}</td>
                  <td>{n.offer_count || 0}</td>
                  <td><button className="btn" onClick={() => setSelected(n)}>View Offers</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No maintenance needs posted yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 480, display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>New Maintenance Need</h3>
            <label className="field"><span>Title</span><input className="input" value={form.title || ''} onChange={(e) => setForm((s: any) => ({ ...s, title: e.target.value }))} /></label>
            <label className="field"><span>Description</span><textarea className="input" rows={3} value={form.description || ''} onChange={(e) => setForm((s: any) => ({ ...s, description: e.target.value }))} /></label>
            <label className="field"><span>Urgency</span>
              <select className="input" value={form.urgency || 'medium'} onChange={(e) => setForm((s: any) => ({ ...s, urgency: e.target.value }))}>
                {['low','medium','high','critical'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </label>
            <label className="field"><span>Budget min (DZD)</span><input className="input" type="number" value={form.budget_min || ''} onChange={(e) => setForm((s: any) => ({ ...s, budget_min: e.target.value }))} /></label>
            <label className="field"><span>Budget max (DZD)</span><input className="input" type="number" value={form.budget_max || ''} onChange={(e) => setForm((s: any) => ({ ...s, budget_max: e.target.value }))} /></label>
            <label className="field"><span>Deadline</span><input className="input" type="date" value={form.deadline || ''} onChange={(e) => setForm((s: any) => ({ ...s, deadline: e.target.value }))} /></label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
                {createMut.isPending ? 'Posting…' : 'Post Need'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>{selected.title}</h3>
            <p style={{ color: '#666', fontSize: 14 }}>{selected.description}</p>
            <h4>Offers ({(selected.offers || []).length})</h4>
            {(selected.offers || []).length === 0 && <p style={{ color: '#888' }}>No offers yet.</p>}
            {(selected.offers || []).map((o: any) => (
              <div key={o.id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>Company #{o.company_id}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{o.description}</div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: 13 }}>
                  <span>Price: <strong>{Number(o.price).toLocaleString()} DZD</strong></span>
                  <span>Duration: <strong>{o.duration_days}d</strong></span>
                  <span>Warranty: <strong>{o.warranty_months}mo</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12,
                    background: o.status === 'accepted' ? '#27AE60' : o.status === 'rejected' ? '#E74C3C' : '#2980B9', color: '#fff' }}>
                    {o.status}
                  </span>
                  {o.status === 'pending' && (
                    <>
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }}
                        onClick={() => offerMut.mutate({ nid: selected.id, oid: o.id, action: 'accept' })}>Accept</button>
                      <button className="btn" style={{ fontSize: 12, padding: '4px 10px' }}
                        onClick={() => offerMut.mutate({ nid: selected.id, oid: o.id, action: 'reject' })}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button className="btn" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
