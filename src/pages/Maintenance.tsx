import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

type Tab = 'equipment' | 'reports' | 'centers'

export default function Maintenance() {
  const [tab, setTab] = useState<Tab>('reports')
  return (
    <>
      <div className="toolbar">
        <button className={`btn ${tab === 'reports' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('reports')}>Reports</button>
        <button className={`btn ${tab === 'equipment' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('equipment')}>Equipment</button>
        <button className={`btn ${tab === 'centers' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('centers')}>Repair Centers</button>
      </div>
      {tab === 'reports' && <ReportsTab />}
      {tab === 'equipment' && <EquipmentTab />}
      {tab === 'centers' && <CentersTab />}
    </>
  )
}

function ReportsTab() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const { data } = useQuery({
    queryKey: ['maint', status],
    queryFn: async () => (await api.get('/admin/maintenance', { params: { status: status || undefined, per_page: 100 } })).data.data as any[],
  })
  const upd = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) => (await api.put(`/maintenance/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maint'] }),
  })

  return (
    <>
      <div className="toolbar">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All</option>
          <option>open</option><option>assigned</option><option>in_progress</option>
          <option>resolved</option><option>closed</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="nfs">
          <thead><tr>
            <th>#</th><th>Equipment</th><th>Severity</th><th>Status</th><th>Reporter</th><th>Repair Center</th><th>Opened</th><th>Update</th>
          </tr></thead>
          <tbody>
            {(data || []).map((r: any) => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.equipment_name}</td>
                <td><span className={`badge ${r.severity === 'critical' ? 'badge-red' : r.severity === 'high' ? 'badge-amber' : 'badge-gray'}`}>{r.severity}</span></td>
                <td><span className="badge badge-ink">{r.status}</span></td>
                <td>{r.reporter_name}</td>
                <td>{r.repair_center_name || '—'}</td>
                <td className="muted">{(r.opened_at || '').slice(0, 10)}</td>
                <td>
                  <select className="input" value={r.status} onChange={(e) => upd.mutate({ id: r.id, body: { status: e.target.value } })}>
                    {['open', 'assigned', 'in_progress', 'resolved', 'closed'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={8} className="muted" style={{ padding: 30, textAlign: 'center' }}>No reports</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

function EquipmentTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => (await api.get('/equipment', { params: { per_page: 100 } })).data.data as any[],
  })
  const create = useMutation({
    mutationFn: async (body: any) => (await api.post('/equipment', body)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); setOpen(false) },
  })

  return (
    <>
      <div className="toolbar">
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Equipment</button>
      </div>
      <div className="table-wrap">
        <table className="nfs">
          <thead><tr>
            <th>Name</th><th>Hospital</th><th>Category</th><th>Serial</th><th>Status</th><th>Last maint.</th>
          </tr></thead>
          <tbody>
            {(data || []).map((e: any) => (
              <tr key={e.id}>
                <td>{e.name_ar}</td>
                <td>{e.hospital_name}</td>
                <td>{e.category || '—'}</td>
                <td className="muted">{e.serial_number || '—'}</td>
                <td><span className="badge badge-ink">{e.status}</span></td>
                <td className="muted">{(e.last_maintenance || '').slice(0, 10) || '—'}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="muted" style={{ padding: 30, textAlign: 'center' }}>No equipment</td></tr>}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="drawer-backdrop" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h3>Add equipment</h3>
            <EquipmentForm onSubmit={(b) => create.mutate(b)} />
          </div>
        </div>
      )}
    </>
  )
}

function EquipmentForm({ onSubmit }: { onSubmit: (b: any) => void }) {
  const [f, setF] = useState({ hospital_id: 1, name_ar: '', name_en: '', category: '', serial_number: '', status: 'operational' })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f) }}>
      <label className="field"><span>Hospital ID</span><input className="input" type="number" value={f.hospital_id} onChange={(e) => setF({ ...f, hospital_id: +e.target.value })} /></label>
      <label className="field"><span>Name (AR)</span><input className="input" value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} required /></label>
      <label className="field"><span>Name (EN)</span><input className="input" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} required /></label>
      <label className="field"><span>Category</span><input className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></label>
      <label className="field"><span>Serial number</span><input className="input" value={f.serial_number} onChange={(e) => setF({ ...f, serial_number: e.target.value })} /></label>
      <label className="field"><span>Status</span>
        <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          {['operational', 'faulty', 'under_repair', 'decommissioned'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <button className="btn btn-primary">Save</button>
    </form>
  )
}

function CentersTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data } = useQuery({
    queryKey: ['repair-centers'],
    queryFn: async () => (await api.get('/repair-centers', { params: { per_page: 100 } })).data.data as any[],
  })
  const create = useMutation({
    mutationFn: async (b: any) => (await api.post('/repair-centers', b)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repair-centers'] }); setOpen(false) },
  })

  return (
    <>
      <div className="toolbar">
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Center</button>
      </div>
      <div className="table-wrap">
        <table className="nfs">
          <thead><tr><th>Name</th><th>Type</th><th>Scope</th><th>Phone</th><th>Approved</th></tr></thead>
          <tbody>
            {(data || []).map((c: any) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.type}</td>
                <td>{c.scope}</td>
                <td>{c.contact_phone || '—'}</td>
                <td>{c.is_approved ? '✓' : '✗'}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="muted" style={{ padding: 30, textAlign: 'center' }}>No centers</td></tr>}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="drawer-backdrop" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h3>Add repair center</h3>
            <CenterForm onSubmit={(b) => create.mutate(b)} />
          </div>
        </div>
      )}
    </>
  )
}

function CenterForm({ onSubmit }: { onSubmit: (b: any) => void }) {
  const [f, setF] = useState({ name: '', type: 'public', scope: 'local', contact_phone: '', contact_email: '', is_approved: true })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f) }}>
      <label className="field"><span>Name</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
      <div className="row">
        <label className="field flex-1"><span>Type</span>
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option>public</option><option>private</option>
          </select>
        </label>
        <label className="field flex-1"><span>Scope</span>
          <select className="input" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}>
            <option>local</option><option>national</option><option>international</option>
          </select>
        </label>
      </div>
      <label className="field"><span>Phone</span><input className="input" value={f.contact_phone} onChange={(e) => setF({ ...f, contact_phone: e.target.value })} /></label>
      <label className="field"><span>Email</span><input className="input" value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} /></label>
      <button className="btn btn-primary">Save</button>
    </form>
  )
}
