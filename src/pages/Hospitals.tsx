import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import Drawer from '../components/Drawer'
import { useT, useLang } from '../store/lang'
import { IcoHospital, IcoCheck, IcoBadge, IcoBed, IcoPencil, IcoTrash, IcoPlus } from '../components/Icon'

interface Hospital {
  id: number
  name_ar: string
  name_en: string
  wilaya_id: number
  type: string
  total_beds: number
  available_beds: number
  is_active: boolean
  phone?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
}

export default function Hospitals() {
  const qc = useQueryClient()
  const t = useT()
  const { lang } = useLang()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Hospital | null>(null)

  const { data } = useQuery({
    queryKey: ['hospitals', search],
    queryFn: async () => {
      const r = await api.get('/admin/hospitals', { params: { per_page: 100 } })
      return r.data.data as Hospital[]
    },
  })

  const all = data || []
  const list = all.filter(
    (h) =>
      (!search || h.name_ar.includes(search) || h.name_en.toLowerCase().includes(search.toLowerCase())) &&
      (!filterType || h.type === filterType) &&
      (!filterStatus || (filterStatus === 'active' ? h.is_active : !h.is_active)),
  )

  const types = [...new Set(all.map(h => h.type).filter(Boolean))]
  const critical = all.filter(h => h.total_beds > 0 && (h.available_beds / h.total_beds) < 0.1).length
  const available = all.filter(h => h.total_beds > 0 && (h.available_beds / h.total_beds) >= 0.3).length

  const save = useMutation({
    mutationFn: async (payload: Partial<Hospital>) => {
      if (editing?.id) {
        return (await api.put(`/admin/hospitals/${editing.id}`, payload)).data
      }
      return (await api.post('/admin/hospitals', payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospitals'] })
      setOpen(false); setEditing(null)
    },
  })

  const del = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/admin/hospitals/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitals'] }),
  })

  return (
    <>
      {/* ── KPI summary ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { icon: '🏥', label: 'Total', value: all.length, color: '' },
          { icon: '✅', label: 'Active', value: all.filter(h => h.is_active).length, color: 'green' },
          { icon: '🚨', label: 'Critical', value: critical, color: 'accent' },
          { icon: '🛏', label: 'Healthy', value: available, color: 'green' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`} style={{ padding: '14px 16px' }}>
            <div className="kpi-icon" style={{ fontSize: 20, width: 36, height: 36 }}>{k.icon}</div>
            <div>
              <div className="label">{k.label}</div>
              <div className="value" style={{ fontSize: 22 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <input className="input input-search" placeholder={t('Search hospitals…', 'بحث عن مستشفى...')} value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">{t('All Types', 'جميع الأنواع')}</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="">{t('All Status', 'جميع الحالات')}</option>
          <option value="active">{t('Active', 'نشط')}</option>
          <option value="inactive">{t('Inactive', 'غير نشط')}</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{list.length} {t('of', 'من')} {all.length}</span>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true) }}>
          <IcoPlus size={14} /> {t('Add Hospital', 'إضافة مستشفى')}
        </button>
      </div>

      <div className="table-wrap">
        <table className="nfs">
          <thead>
            <tr>
              <th>{t('Hospital', 'المستشفى')}</th>
              <th>{t('Wilaya', 'الولاية')}</th>
              <th>{t('Type', 'النوع')}</th>
              <th>{t('Bed Capacity', 'طاقة الأسرة')}</th>
              <th>{t('Availability', 'التوفر')}</th>
              <th>{t('Status', 'الحالة')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((h) => {
              const pct = h.total_beds ? h.available_beds / h.total_beds : 0
              const cls = pct < 0.1 ? 'badge-red' : pct < 0.3 ? 'badge-amber' : 'badge-green'
              const barColor = pct < 0.1 ? '#dc2626' : pct < 0.3 ? '#d97706' : '#16a34a'
              const occPct = h.total_beds ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0
              return (
                <tr key={h.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{lang === 'ar' ? h.name_ar : h.name_en}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{lang === 'ar' ? h.name_en : h.name_ar}</div>
                    {h.address && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{h.address}</div>}
                  </td>
                  <td style={{ fontWeight: 500 }}>W{h.wilaya_id}</td>
                  <td><span className="badge badge-ink">{h.type || '—'}</span></td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{h.total_beds}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('total beds', 'إجمالي الأسرة')}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${occPct}%`, background: barColor, borderRadius: 99 }} />
                      </div>
                      <span className={`badge ${cls}`} style={{ fontSize: 11, padding: '2px 7px' }}>
                        {h.available_beds}/{h.total_beds}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: barColor, fontWeight: 600, marginTop: 2 }}>{occPct}% {t('occupied', 'مشغول')}</div>
                  </td>
                  <td>
                    <span className={`badge ${h.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {h.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(h); setOpen(true) }}>
                      <IcoPencil size={12} /> {t('Edit', 'تعديل')}
                    </button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => del.mutate(h.id)}>{t('Deactivate', 'تعطيل')}</button>
                  </td>
                </tr>
              )
            })}
            {!list.length && (
              <tr><td colSpan={7}>
                <div className="empty-state"><div className="empty-icon">🏥</div><div className="empty-title">No hospitals found</div><div className="empty-sub">Try adjusting your filters</div></div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={open} title={editing ? 'Edit hospital' : 'Add hospital'} onClose={() => { setOpen(false); setEditing(null) }}>
        <HospitalForm initial={editing} onSubmit={(p) => save.mutate(p)} loading={save.isPending} />
      </Drawer>
    </>
  )
}

const WILAYAS: { id: number; name: string }[] = [
  { id: 1, name: '01 - Adrar' }, { id: 2, name: '02 - Chlef' }, { id: 3, name: '03 - Laghouat' },
  { id: 4, name: '04 - Oum El Bouaghi' }, { id: 5, name: '05 - Batna' }, { id: 6, name: '06 - Béjaïa' },
  { id: 7, name: '07 - Biskra' }, { id: 8, name: '08 - Béchar' }, { id: 9, name: '09 - Blida' },
  { id: 10, name: '10 - Bouira' }, { id: 11, name: '11 - Tamanrasset' }, { id: 12, name: '12 - Tébessa' },
  { id: 13, name: '13 - Tlemcen' }, { id: 14, name: '14 - Tiaret' }, { id: 15, name: '15 - Tizi Ouzou' },
  { id: 16, name: '16 - Alger' }, { id: 17, name: '17 - Djelfa' }, { id: 18, name: '18 - Jijel' },
  { id: 19, name: '19 - Sétif' }, { id: 20, name: '20 - Saïda' }, { id: 21, name: '21 - Skikda' },
  { id: 22, name: '22 - Sidi Bel Abbès' }, { id: 23, name: '23 - Annaba' }, { id: 24, name: '24 - Guelma' },
  { id: 25, name: '25 - Constantine' }, { id: 26, name: '26 - Médéa' }, { id: 27, name: '27 - Mostaganem' },
  { id: 28, name: '28 - M\'Sila' }, { id: 29, name: '29 - Mascara' }, { id: 30, name: '30 - Ouargla' },
  { id: 31, name: '31 - Oran' }, { id: 32, name: '32 - El Bayadh' }, { id: 33, name: '33 - Illizi' },
  { id: 34, name: '34 - Bordj Bou Arréridj' }, { id: 35, name: '35 - Boumerdès' }, { id: 36, name: '36 - El Tarf' },
  { id: 37, name: '37 - Tindouf' }, { id: 38, name: '38 - Tissemsilt' }, { id: 39, name: '39 - El Oued' },
  { id: 40, name: '40 - Khenchela' }, { id: 41, name: '41 - Souk Ahras' }, { id: 42, name: '42 - Tipaza' },
  { id: 43, name: '43 - Mila' }, { id: 44, name: '44 - Aïn Defla' }, { id: 45, name: '45 - Naâma' },
  { id: 46, name: '46 - Aïn Témouchent' }, { id: 47, name: '47 - Ghardaïa' }, { id: 48, name: '48 - Relizane' },
  { id: 49, name: '49 - Timimoun' }, { id: 50, name: '50 - Bordj Badji Mokhtar' }, { id: 51, name: '51 - Ouled Djellal' },
  { id: 52, name: '52 - Béni Abbès' }, { id: 53, name: '53 - In Salah' }, { id: 54, name: '54 - In Guezzam' },
  { id: 55, name: '55 - Touggourt' }, { id: 56, name: '56 - Djanet' }, { id: 57, name: '57 - El M\'Ghair' },
  { id: 58, name: '58 - El Menia' },
]

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    road?: string
    suburb?: string
    city?: string
    state?: string
    country?: string
  }
}

function LocationSearch({
  onPick,
}: {
  onPick: (lat: number, lon: number, address: string, wilayaId?: number) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=dz&format=json&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'fr,ar' } },
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  function pick(r: NominatimResult) {
    const addr = [r.address.road, r.address.suburb, r.address.city, r.address.state]
      .filter(Boolean).join(', ')
    // Try to guess wilaya from the state name
    const stateLower = (r.address.state || '').toLowerCase()
    const matched = WILAYAS.find((w) =>
      stateLower.includes(w.name.split(' - ')[1].toLowerCase().split(' ')[0])
    )
    onPick(+r.lat, +r.lon, addr || r.display_name, matched?.id)
    setPicked(r.display_name)
    setResults([])
    setQuery('')
  }

  return (
    <div className="field" style={{ position: 'relative' }}>
      <span>Search location on map</span>
      {picked && (
        <div style={{
          padding: '6px 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 6, fontSize: 13, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {picked}</span>
          <button type="button" className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 12 }}
            onClick={() => setPicked(null)}>Change</button>
        </div>
      )}
      {!picked && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="input"
              placeholder="e.g. CHU Mustapha Bacha Alger"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-primary" onClick={search} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? '…' : 'Search'}
            </button>
          </div>
          {results.length > 0 && (
            <div style={{
              position: 'absolute', zIndex: 100, left: 0, right: 0,
              background: '#fff', border: '1px solid var(--color-border)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)', marginTop: 2,
            }}>
              {results.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => pick(r)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 12px', background: 'none', border: 'none',
                    borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                    fontSize: 13, lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  📍 {r.display_name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function HospitalForm({
  initial, onSubmit, loading,
}: { initial: Hospital | null; onSubmit: (p: any) => void; loading: boolean }) {
  const [form, setForm] = useState({
    name_ar: initial?.name_ar || '',
    name_en: initial?.name_en || '',
    wilaya_id: initial?.wilaya_id || 16,
    type: initial?.type || 'public',
    total_beds: initial?.total_beds || 0,
    available_beds: initial?.available_beds || 0,
    address: initial?.address || '',
    phone: initial?.phone || '',
    latitude: initial?.latitude ?? null as number | null,
    longitude: initial?.longitude ?? null as number | null,
  })

  function handleLocationPick(lat: number, lon: number, address: string, wilayaId?: number) {
    setForm((f) => ({
      ...f,
      latitude: lat,
      longitude: lon,
      address: address || f.address,
      ...(wilayaId ? { wilaya_id: wilayaId } : {}),
    }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}>
      <label className="field"><span>Name (Arabic)</span>
        <input className="input" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required />
      </label>
      <label className="field"><span>Name (English)</span>
        <input className="input" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
      </label>

      <LocationSearch onPick={handleLocationPick} />

      {form.latitude != null && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '6px 10px', background: 'var(--color-surface)',
          border: '1px solid var(--color-border)', borderRadius: 6,
          fontSize: 12, color: 'var(--color-muted)', marginBottom: 10,
        }}>
          <span>🗺️ {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}</span>
          <button type="button" className="btn btn-ghost"
            style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: 12 }}
            onClick={() => setForm({ ...form, latitude: null, longitude: null })}>
            Clear
          </button>
        </div>
      )}

      <div className="row">
        <label className="field flex-1"><span>Wilaya</span>
          <select className="input" value={form.wilaya_id} onChange={(e) => setForm({ ...form, wilaya_id: +e.target.value })}>
            {WILAYAS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>
        <label className="field flex-1"><span>Type</span>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="clinic">Clinic</option>
            <option value="CHU">CHU</option>
          </select>
        </label>
      </div>
      <div className="row">
        <label className="field flex-1"><span>Total beds</span>
          <input className="input" type="number" value={form.total_beds} onChange={(e) => setForm({ ...form, total_beds: +e.target.value })} />
        </label>
        <label className="field flex-1"><span>Available beds</span>
          <input className="input" type="number" value={form.available_beds} onChange={(e) => setForm({ ...form, available_beds: +e.target.value })} />
        </label>
      </div>
      <label className="field"><span>Address</span>
        <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </label>
      <label className="field"><span>Phone</span>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </label>
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
    </form>
  )
}
