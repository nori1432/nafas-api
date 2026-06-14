import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function Reports() {
  const beds = useQuery({
    queryKey: ['rep-beds'],
    queryFn: async () => (await api.get('/admin/reports/beds')).data.data as any[],
  })
  const dons = useQuery({
    queryKey: ['rep-dons'],
    queryFn: async () => (await api.get('/admin/reports/donations', { params: { days: 30 } })).data.data,
  })

  function exportCSV() {
    const rows = beds.data || []
    const csv = ['wilaya_id,total_beds,available_beds,hospital_count']
      .concat(rows.map((r: any) => `${r.wilaya_id},${r.total_beds},${r.available_beds},${r.hospital_count}`))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'beds_by_wilaya.csv'; a.click()
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Bed availability by wilaya</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={beds.data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="wilaya_id" />
            <YAxis />
            <Tooltip /><Legend />
            <Bar dataKey="total_beds" fill="#1A1A1A" />
            <Bar dataKey="available_beds" fill="#27AE60" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={exportCSV}>Export CSV</button>{' '}
          <button className="btn btn-ghost" onClick={() => window.print()}>Print PDF</button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Donations (last 30 days)</div>
        <div className="row">
          <div className="kpi flex-1">
            <div className="label">Financial total</div>
            <div className="value">{(dons.data?.financial_total_dzd ?? 0).toLocaleString()} DZD</div>
          </div>
          <div className="kpi flex-1">
            <div className="label">Blood units</div>
            <div className="value">{dons.data?.blood_units_collected ?? 0}</div>
          </div>
          <div className="kpi flex-1">
            <div className="label">Active campaigns</div>
            <div className="value">{dons.data?.active_campaigns ?? 0}</div>
          </div>
        </div>
      </div>
    </>
  )
}
