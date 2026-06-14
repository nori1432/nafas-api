import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useT } from '../store/lang'

export default function Donations() {
  return <BloodTab />
}

function BloodTab() {
  const { data } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get('/blood/campaigns', { params: { per_page: 100 } })).data.data as any[],
  })
  return (
    <div className="table-wrap">
      <table className="nfs">
        <thead><tr><th>Title</th><th>Hospital</th><th>Types</th><th>Progress</th><th>Status</th></tr></thead>
        <tbody>
          {(data || []).map((c: any) => (
            <tr key={c.id}>
              <td>{c.title_ar}</td>
              <td>{c.hospital_name}</td>
              <td>{(c.blood_types_needed || []).join(', ')}</td>
              <td>
                <div style={{ background: '#eee', borderRadius: 6, height: 8, width: 180, overflow: 'hidden' }}>
                  <div style={{ background: 'var(--accent)', width: `${c.progress_percent}%`, height: '100%' }} />
                </div>
                <span className="muted" style={{ fontSize: 12 }}>{c.collected_units}/{c.target_units}</span>
              </td>
              <td><span className="badge badge-ink">{c.status}</span></td>
            </tr>
          ))}
          {!data?.length && <tr><td colSpan={5} className="muted" style={{ padding: 30, textAlign: 'center' }}>No campaigns</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

