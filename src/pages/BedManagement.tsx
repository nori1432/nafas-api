import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useT } from '../store/lang'

export default function BedManagement() {
  const qc = useQueryClient()
  const t = useT()
  const { data } = useQuery({
    queryKey: ['hospitals-beds'],
    queryFn: async () => (await api.get('/hospitals', { params: { per_page: 200 } })).data.data as any[],
  })
  const upd = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) =>
      (await api.put(`/hospitals/${id}/beds`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitals-beds'] }),
  })

  return (
    <div className="table-wrap">
      <table className="nfs">
        <thead>
          <tr>
            <th>{t('Hospital', 'المستشفى')}</th>
            <th>{t('Wilaya', 'الولاية')}</th>
            <th>{t('Total', 'الإجمالي')}</th>
            <th>{t('Available', 'المتاح')}</th>
            <th>{t('Status', 'الحالة')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((h: any) => <Row key={h.id} h={h} onSave={(b) => upd.mutate({ id: h.id, body: b })} />)}
          {!data?.length && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 30 }}>{t('No hospitals', 'لا توجد مستشفيات')}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Row({ h, onSave }: { h: any; onSave: (b: any) => void }) {
  const [edit, setEdit] = useState(false)
  const [available, setAvailable] = useState(h.available_beds)
  const [total, setTotal] = useState(h.total_beds)
  const pct = h.total_beds ? h.available_beds / h.total_beds : 0
  const cls = h.available_beds === 0 ? 'badge-red' : pct < 0.1 ? 'badge-red' : pct < 0.3 ? 'badge-amber' : 'badge-green'
  return (
    <tr style={{ background: pct < 0.1 ? '#fdebe9' : pct < 0.3 ? '#fef4e2' : undefined }}>
      <td>{h.name_ar}</td>
      <td>{h.wilaya_id}</td>
      <td>
        {edit ? <input className="input" type="number" value={total} onChange={(e) => setTotal(+e.target.value)} style={{ width: 100 }} /> : h.total_beds}
      </td>
      <td>
        {edit ? <input className="input" type="number" value={available} onChange={(e) => setAvailable(+e.target.value)} style={{ width: 100 }} /> : h.available_beds}
      </td>
      <td><span className={`badge ${cls}`}>{Math.round(pct * 100)}%</span></td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {edit ? (
          <>
            <button className="btn btn-primary" onClick={() => { onSave({ available_beds: available, total_beds: total }); setEdit(false) }}>Save</button>{' '}
            <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancel</button>
          </>
        ) : (
          <button className="btn btn-ghost" onClick={() => setEdit(true)}>Edit</button>
        )}
      </td>
    </tr>
  )
}
