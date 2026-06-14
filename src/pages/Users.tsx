import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useT } from '../store/lang'

const ROLES = ['citizen', 'doctor', 'engineer', 'donor', 'hospital_admin', 'national_admin']

export default function Users() {
  const qc = useQueryClient()
  const t = useT()
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')

  const { data } = useQuery({
    queryKey: ['users', role, search],
    queryFn: async () => {
      const r = await api.get('/admin/users', { params: { role: role || undefined, search: search || undefined, per_page: 50 } })
      return r.data.data as any[]
    },
  })

  const upd = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) =>
      (await api.put(`/admin/users/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <>
      <div className="toolbar">
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">{t('All roles', 'جميع الأدوار')}</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input className="input" placeholder={t('Search name or phone…', 'بحث بالاسم أو الهاتف...')} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>
      <div className="table-wrap">
        <table className="nfs">
          <thead>
            <tr>
              <th>{t('Name', 'الاسم')}</th>
              <th>{t('Phone', 'الهاتف')}</th>
              <th>{t('Role', 'الدور')}</th>
              <th>{t('Wilaya', 'الولاية')}</th>
              <th>{t('Verified', 'موثق')}</th>
              <th>{t('Active', 'نشط')}</th>
              <th>{t('Joined', 'تاريخ الانضمام')}</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((u: any) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.phone_number}</td>
                <td>
                  <select className="input" value={u.role} onChange={(e) => upd.mutate({ id: u.id, body: { role: e.target.value } })}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td>{u.wilaya || '—'}</td>
                <td>
                  <input type="checkbox" checked={u.is_verified} onChange={(e) => upd.mutate({ id: u.id, body: { is_verified: e.target.checked } })} />
                </td>
                <td>
                  <input type="checkbox" checked={u.is_active} onChange={(e) => upd.mutate({ id: u.id, body: { is_active: e.target.checked } })} />
                </td>
                <td className="muted">{(u.created_at || '').slice(0, 10)}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30 }} className="muted">{t('No users', 'لا يوجد مستخدمون')}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
