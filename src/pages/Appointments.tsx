import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useT } from '../store/lang'

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'badge-green',
  pending: 'badge-amber',
  cancelled: 'badge-red',
  completed: 'badge-gray',
}

export default function Appointments() {
  const [status, setStatus] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const t = useT()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', status, hospitalId, dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: '200' }
      if (status)     params.status      = status
      if (hospitalId) params.hospital_id = hospitalId
      if (dateFrom)   params.date_from   = dateFrom
      if (dateTo)     params.date_to     = dateTo
      const r = await api.get('/appointments', { params })
      return r.data.data as any[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, s }: { id: number; s: string }) =>
      api.put(`/appointments/${id}`, { status: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })

  const rows = data || []

  // Summary counts
  const counts = {
    pending:   rows.filter((a) => a.status === 'pending').length,
    confirmed: rows.filter((a) => a.status === 'confirmed').length,
    cancelled: rows.filter((a) => a.status === 'cancelled').length,
    completed: rows.filter((a) => a.status === 'completed').length,
  }

  function exportCSV() {
    const head = ['date', 'patient', 'doctor', 'hospital', 'specialty', 'status', 'notes']
    const csv = [head.join(',')].concat(rows.map((a: any) => [
      a.date_time, a.patient_name, a.doctor_name, a.hospital_name,
      a.specialty || '', a.status, a.notes || '',
    ].map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const el = document.createElement('a')
    el.href = URL.createObjectURL(blob); el.download = 'appointments.csv'; el.click()
  }

  return (
    <>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: t('Pending', 'قيد الانتظار'), count: counts.pending,   color: '#f59e0b' },
          { label: t('Confirmed', 'مؤكدة'),       count: counts.confirmed, color: '#22c55e' },
          { label: t('Completed', 'مكتملة'),      count: counts.completed, color: '#6b7280' },
          { label: t('Cancelled', 'ملغاة'),       count: counts.cancelled, color: '#ef4444' },
        ].map((c) => (
          <div key={c.label} style={{
            background: c.color + '18', border: `1px solid ${c.color}44`,
            borderRadius: 10, padding: '10px 20px', minWidth: 110,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.count}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters toolbar */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">{t('All statuses', 'جميع الحالات')}</option>
          <option>pending</option><option>confirmed</option>
          <option>cancelled</option><option>completed</option>
        </select>
        <input className="input" type="number" placeholder={t('Hospital ID', 'رقم المستشفى')}
          value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} style={{ maxWidth: 140 }} />
        <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          style={{ maxWidth: 150 }} />
        <input className="input" type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}
          style={{ maxWidth: 150 }} />
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={exportCSV}>{t('Export CSV', 'تصدير CSV')}</button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="nfs">
          <thead>
            <tr>
              <th>{t('Date', 'التاريخ')}</th>
              <th>{t('Patient', 'المريض')}</th>
              <th>{t('Doctor', 'الطبيب')}</th>
              <th>{t('Hospital', 'المستشفى')}</th>
              <th>{t('Specialty', 'التخصص')}</th>
              <th>{t('Notes', 'ملاحظات')}</th>
              <th>{t('Status', 'الحالة')}</th>
              <th>{t('Actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="muted" style={{ padding: 30, textAlign: 'center' }}>
                {t('Loading…', 'جارٍ التحميل…')}
              </td></tr>
            )}
            {!isLoading && rows.map((a: any) => (
              <tr key={a.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{(a.date_time || '').replace('T', ' ').slice(0, 16)}</td>
                <td>{a.patient_name || `#${a.patient_id}`}</td>
                <td>{a.doctor_name  || `#${a.doctor_id}`}</td>
                <td>{a.hospital_name || `#${a.hospital_id}`}</td>
                <td>{a.specialty || '—'}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.notes || '—'}
                </td>
                <td>
                  <span className={`badge ${STATUS_COLORS[a.status] ?? 'badge-gray'}`}>{a.status}</span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {a.status === 'pending' && (
                    <button
                      className="btn btn-sm"
                      style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                      onClick={() => updateStatus.mutate({ id: a.id, s: 'confirmed' })}
                    >{t('Confirm', 'تأكيد')}</button>
                  )}
                  {(a.status === 'pending' || a.status === 'confirmed') && (
                    <button
                      className="btn btn-sm"
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                      onClick={() => { if (confirm(t('Cancel this appointment?', 'إلغاء هذا الموعد؟'))) updateStatus.mutate({ id: a.id, s: 'cancelled' }) }}
                    >{t('Cancel', 'إلغاء')}</button>
                  )}
                  {a.status === 'confirmed' && (
                    <button
                      className="btn btn-sm"
                      style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                      onClick={() => updateStatus.mutate({ id: a.id, s: 'completed' })}
                    >{t('Complete', 'إتمام')}</button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !rows.length && (
              <tr><td colSpan={8} className="muted" style={{ padding: 30, textAlign: 'center' }}>
                {t('No appointments found', 'لا توجد مواعيد')}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
