import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Staff() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['hosp-staff'],
    queryFn: async () => (await api.get('/hospital-portal/staff')).data.data as any[],
  })

  const updateMut = useMutation({
    mutationFn: (u: any) => api.put(`/hospital-portal/staff/${u.id}`, u),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hosp-staff'] }); setEditing(null) },
  })

  const rows = data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ overflowX: 'auto' }}>
        {isLoading ? <p>Loading…</p> : (
          <table className="nfs">
            <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((u: any) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td>{u.phone_number}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, background: u.role === 'doctor' ? '#2980B9' : '#888', color: '#fff', fontSize: 12 }}>{u.role}</span></td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 6, background: u.is_active ? '#27AE60' : '#E74C3C', color: '#fff', fontSize: 12 }}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td><button className="btn" onClick={() => setEditing(u)}>Edit</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No staff found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 360, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>{editing.full_name}</h3>
            <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={!!editing.is_active}
                onChange={(e) => setEditing((s: any) => ({ ...s, is_active: e.target.checked }))} />
              <span>Active</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => updateMut.mutate(editing)} disabled={updateMut.isPending}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
