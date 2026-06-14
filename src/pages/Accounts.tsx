import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useT } from '../store/lang'

export default function Accounts() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'list' | 'hospital' | 'company'>('list')
  const [roleFilter, setRoleFilter] = useState('')
  const [form, setForm] = useState<any>({})
  const [hospitals, setHospitals] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-accounts', roleFilter],
    queryFn: async () => {
      const params = roleFilter ? `?role=${roleFilter}` : ''
      return (await api.get(`/admin/accounts${params}`)).data.data as any[]
    },
  })

  const { data: hospData } = useQuery({
    queryKey: ['hospitals-simple'],
    queryFn: async () => (await api.get('/admin/hospitals?per_page=100')).data.data as any[],
  })

  const createHospAdminMut = useMutation({
    mutationFn: (payload: any) => api.post('/admin/accounts/hospital-admin', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-accounts'] }); setMsg('Hospital admin account created!'); setForm({}); setTab('list') },
    onError: (e: any) => setErr(e.response?.data?.message || 'Error'),
  })

  const createCompanyMut = useMutation({
    mutationFn: (payload: any) => api.post('/admin/accounts/company', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-accounts'] }); setMsg('Company account created!'); setForm({}); setTab('list') },
    onError: (e: any) => setErr(e.response?.data?.message || 'Error'),
  })

  const rows = accounts || []
  const tr = useT()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {msg && <div style={{ background: '#e6f9ee', border: '1px solid #27AE60', borderRadius: 8, padding: '0.75rem 1rem', color: '#1a7a47' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {(['list', 'hospital', 'company'] as const).map((tab_item) => (
          <button key={tab_item} className={`btn${tab === tab_item ? ' btn-primary' : ''}`}
            onClick={() => { setTab(tab_item); setMsg(''); setErr('') }}>
            {tab_item === 'list' ? tr('All Accounts', 'جميع الحسابات') : tab_item === 'hospital' ? tr('+ Hospital Admin', '+ مسؤول مستشفى') : tr('+ Company Account', '+ حساب شركة')}
          </button>
        ))}
        {tab === 'list' && (
          <select className="input" style={{ marginLeft: 'auto', width: 180 }} value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">{tr('All roles', 'جميع الأدوار')}</option>
            <option value="hospital_admin">Hospital Admins</option>
            <option value="maintenance_company">Companies</option>
          </select>
        )}
      </div>

      {tab === 'list' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          {isLoading ? <p>Loading…</p> : (
            <table className="nfs">
              <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Hospital/Company</th><th>Active</th></tr></thead>
              <tbody>
                {rows.map((a: any) => (
                  <tr key={a.id}>
                    <td>{a.full_name}</td>
                    <td>{a.phone_number}</td>
                    <td><span style={{ padding: '2px 8px', borderRadius: 6, background: a.role === 'hospital_admin' ? '#2980B9' : '#27AE60', color: '#fff', fontSize: 12 }}>{a.role}</span></td>
                    <td>{a.hospital_id || a.company?.company_name || '—'}</td>
                    <td>{a.is_active ? '✓' : '✗'}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No accounts</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'hospital' && (
        <div className="card" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Create Hospital Admin Account</h3>
          {err && <div className="err">{err}</div>}
          {(['full_name', 'phone_number', 'password'] as const).map((f) => (
            <label key={f} className="field"><span>{f.replace('_', ' ')}</span>
              <input className="input" type={f === 'password' ? 'password' : 'text'}
                value={form[f] || ''} onChange={(e) => setForm((s: any) => ({ ...s, [f]: e.target.value }))} />
            </label>
          ))}
          <label className="field"><span>Hospital</span>
            <select className="input" value={form.hospital_id || ''} onChange={(e) => setForm((s: any) => ({ ...s, hospital_id: e.target.value }))}>
              <option value="">Select hospital…</option>
              {(hospData || []).map((h: any) => <option key={h.id} value={h.id}>{h.name_en}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" disabled={createHospAdminMut.isPending}
            onClick={() => createHospAdminMut.mutate(form)}>
            {createHospAdminMut.isPending ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      )}

      {tab === 'company' && (
        <div className="card" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Create Maintenance Company Account</h3>
          {err && <div className="err">{err}</div>}
          {(['full_name', 'phone_number', 'password', 'company_name', 'contact_email', 'contact_phone'] as const).map((f) => (
            <label key={f} className="field"><span>{f.replace(/_/g, ' ')}</span>
              <input className="input" type={f === 'password' ? 'password' : f === 'contact_email' ? 'email' : 'text'}
                value={form[f] || ''} onChange={(e) => setForm((s: any) => ({ ...s, [f]: e.target.value }))} />
            </label>
          ))}
          <label className="field"><span>Description</span>
            <textarea className="input" rows={3} value={form.description || ''}
              onChange={(e) => setForm((s: any) => ({ ...s, description: e.target.value }))} />
          </label>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={!!form.is_approved}
              onChange={(e) => setForm((s: any) => ({ ...s, is_approved: e.target.checked }))} />
            <span>Approve immediately</span>
          </label>
          <button className="btn btn-primary" disabled={createCompanyMut.isPending}
            onClick={() => createCompanyMut.mutate(form)}>
            {createCompanyMut.isPending ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      )}
    </div>
  )
}
