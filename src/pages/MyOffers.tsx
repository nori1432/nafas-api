import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const STATUS_COLORS: Record<string, string> = {
  pending: '#2980B9', accepted: '#27AE60', rejected: '#E74C3C',
  withdrawn: '#888', completed: '#8E44AD',
}

export default function MyOffers() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['company-offers'],
    queryFn: async () => (await api.get('/companies/offers')).data.data as any[],
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/companies/offers/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-offers'] }); setEditing(null) },
  })

  const rows = data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ overflowX: 'auto' }}>
        {isLoading ? <p>Loading…</p> : (
          <table className="nfs">
            <thead><tr>
              <th>Need</th><th>Price (DZD)</th><th>Duration</th><th>Warranty</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {rows.map((o: any) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>Need #{o.need_id}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{o.description?.slice(0, 50)}{o.description?.length > 50 ? '…' : ''}</div>
                  </td>
                  <td>{Number(o.price).toLocaleString()}</td>
                  <td>{o.duration_days}d</td>
                  <td>{o.warranty_months}mo</td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12,
                      background: STATUS_COLORS[o.status] || '#888', color: '#fff' }}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    {o.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setEditing(o)}>Edit</button>
                        <button className="btn" style={{ fontSize: 12, padding: '4px 10px', color: '#C0392B' }}
                          onClick={() => updateMut.mutate({ id: o.id, payload: { status: 'withdrawn' } })}>Withdraw</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No offers submitted yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 400, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Edit Offer #{editing.id}</h3>
            <label className="field"><span>Price (DZD)</span>
              <input className="input" type="number" value={editing.price}
                onChange={(e) => setEditing((s: any) => ({ ...s, price: e.target.value }))} />
            </label>
            <label className="field"><span>Duration (days)</span>
              <input className="input" type="number" value={editing.duration_days}
                onChange={(e) => setEditing((s: any) => ({ ...s, duration_days: e.target.value }))} />
            </label>
            <label className="field"><span>Warranty (months)</span>
              <input className="input" type="number" value={editing.warranty_months}
                onChange={(e) => setEditing((s: any) => ({ ...s, warranty_months: e.target.value }))} />
            </label>
            <label className="field"><span>Notes</span>
              <input className="input" value={editing.notes || ''}
                onChange={(e) => setEditing((s: any) => ({ ...s, notes: e.target.value }))} />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={updateMut.isPending}
                onClick={() => updateMut.mutate({ id: editing.id, payload: editing })}>
                {updateMut.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
