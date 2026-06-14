import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const URGENCY_COLORS: Record<string, string> = {
  critical: '#C0392B', high: '#E67E22', medium: '#F1C40F', low: '#27AE60',
}

export default function BrowseNeeds() {
  const qc = useQueryClient()
  const [offering, setOffering] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [msg, setMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['company-needs'],
    queryFn: async () => (await api.get('/companies/needs')).data.data as any[],
  })

  const offerMut = useMutation({
    mutationFn: ({ nid, payload }: any) => api.post(`/companies/needs/${nid}/offers`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-needs'] }); setOffering(null); setForm({}); setMsg('Offer submitted!') },
  })

  const rows = data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {msg && <div style={{ background: '#e6f9ee', border: '1px solid #27AE60', borderRadius: 8, padding: '0.75rem 1rem', color: '#1a7a47' }}>{msg}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        {isLoading ? <p>Loading…</p> : (
          <table className="nfs">
            <thead><tr>
              <th>Hospital</th><th>Title</th><th>Urgency</th><th>Budget (DZD)</th><th>Deadline</th><th></th>
            </tr></thead>
            <tbody>
              {rows.map((n: any) => (
                <tr key={n.id}>
                  <td style={{ color: '#666', fontSize: 13 }}>#{n.hospital_id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{n.description?.slice(0, 60)}{n.description?.length > 60 ? '…' : ''}</div>
                  </td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, background: URGENCY_COLORS[n.urgency] || '#888', color: '#fff', fontSize: 12 }}>{n.urgency}</span></td>
                  <td>{n.budget_min?.toLocaleString()} – {n.budget_max?.toLocaleString()}</td>
                  <td>{n.deadline?.slice(0, 10)}</td>
                  <td>
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={() => { setOffering(n); setForm({}) }}>
                      Submit Offer
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No open needs available</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {offering && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 460, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Submit Offer</h3>
            <div style={{ background: '#f5f5f3', borderRadius: 8, padding: '0.75rem', fontSize: 13 }}>
              <strong>{offering.title}</strong>
              <div style={{ color: '#666', marginTop: 4 }}>{offering.description}</div>
            </div>
            <label className="field"><span>Description of your offer</span>
              <textarea className="input" rows={3} value={form.description || ''}
                onChange={(e) => setForm((s: any) => ({ ...s, description: e.target.value }))} />
            </label>
            <label className="field"><span>Price (DZD)</span>
              <input className="input" type="number" value={form.price || ''}
                onChange={(e) => setForm((s: any) => ({ ...s, price: e.target.value }))} />
            </label>
            <label className="field"><span>Duration (days)</span>
              <input className="input" type="number" value={form.duration_days || ''}
                onChange={(e) => setForm((s: any) => ({ ...s, duration_days: e.target.value }))} />
            </label>
            <label className="field"><span>Warranty (months)</span>
              <input className="input" type="number" value={form.warranty_months || ''}
                onChange={(e) => setForm((s: any) => ({ ...s, warranty_months: e.target.value }))} />
            </label>
            <label className="field"><span>Notes</span>
              <input className="input" value={form.notes || ''} onChange={(e) => setForm((s: any) => ({ ...s, notes: e.target.value }))} />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setOffering(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={offerMut.isPending}
                onClick={() => offerMut.mutate({ nid: offering.id, payload: form })}>
                {offerMut.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
