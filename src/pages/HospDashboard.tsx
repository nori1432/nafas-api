import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'

export default function HospDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['hosp-dashboard'],
    queryFn: async () => (await api.get('/hospital-portal/dashboard')).data.data,
  })

  const d = data || {}
  const hosp = d.hospital || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, #C0392B 0%, #922b21 100%)', borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Hospital Admin</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginTop: 4 }}>{user?.full_name}</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>{hosp.name_en || `Hospital #${user?.hospital_id}`}</div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi">
          <div className="label">Appointments Today</div>
          <div className="value">{d.appointments_today ?? '—'}</div>
        </div>
        <div className="card kpi">
          <div className="label">Available Beds</div>
          <div className="value">{hosp.available_beds ?? '—'}</div>
          <div className="delta">of {hosp.total_beds ?? 0} total</div>
        </div>
        <div className="card kpi">
          <div className="label">Total Staff</div>
          <div className="value">{d.staff_count ?? '—'}</div>
        </div>
        <div className="card kpi" style={{ borderTop: '3px solid #3B82F6' }}>
          <div className="label">Community Questions</div>
          <div className="value">{d.open_community_questions ?? '—'}</div>
        </div>
        <div className="card kpi">
          <div className="label">Faulty Equipment</div>
          <div className="value" style={{ color: (d.faulty_equipment || 0) > 0 ? '#C0392B' : undefined }}>
            {d.faulty_equipment ?? '—'}
          </div>
        </div>
        <div className="card kpi">
          <div className="label">Open Maintenance Needs</div>
          <div className="value">{d.open_maintenance_needs ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}
