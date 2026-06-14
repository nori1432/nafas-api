import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function CompanyDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['company-dashboard'],
    queryFn: async () => (await api.get('/companies/dashboard')).data.data,
  })

  const d = data || {}
  const co = d.company || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!co.is_approved && (
        <div style={{ background: '#FFF3CD', border: '1px solid #F39C12', borderRadius: 8, padding: '1rem', color: '#856404' }}>
          <strong>Pending Approval</strong> — Your company profile is under review. Once approved, you can submit offers on maintenance needs.
        </div>
      )}
      <div className="kpi-grid">
        <div className="card kpi">
          <div className="label">Pending Offers</div>
          <div className="value">{d.pending_offers ?? '—'}</div>
        </div>
        <div className="card kpi accent">
          <div className="label">Accepted Offers</div>
          <div className="value">{d.accepted_offers ?? '—'}</div>
        </div>
        <div className="card kpi">
          <div className="label">Completed Jobs</div>
          <div className="value">{d.completed_jobs ?? '—'}</div>
        </div>
        <div className="card kpi">
          <div className="label">Rating</div>
          <div className="value">{co.rating ? `⭐ ${Number(co.rating).toFixed(1)}` : '—'}</div>
        </div>
        <div className="card kpi">
          <div className="label">Open Needs Available</div>
          <div className="value">{d.open_needs_market ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}
