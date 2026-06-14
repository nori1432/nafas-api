import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

/* ── Helpers ─────────────────────────────────────────────── */
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)',
  'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #134e4a 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #78350f 100%)',
  'linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #1e1b4b 100%)',
]
const getCover = (name: string) => COVER_GRADIENTS[(name?.charCodeAt(0) || 0) % COVER_GRADIENTS.length]
const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || '?'

const PORTFOLIO_ITEMS = [
  { id: 1, title: 'CHU Mustapha — MRI Overhaul', desc: 'Full MRI system overhaul including coil replacement and software calibration.', icon: '🏥', year: '2025', tags: ['Equipment', 'Imaging'] },
  { id: 2, title: 'Hôpital Ibn Rochd — HVAC', desc: 'Complete HVAC modernisation across 3 wards with energy-efficient units.', icon: '❄️', year: '2025', tags: ['HVAC', 'Energy'] },
  { id: 3, title: 'CHU Annaba — Electrical Audit', desc: 'Full electrical safety audit and rewiring of critical care units to IEC 60601.', icon: '⚡', year: '2024', tags: ['Electrical', 'Safety'] },
  { id: 4, title: 'Clinique El Azhar — Lifts', desc: 'Installation and certification of hospital-grade passenger and bed-transport elevators.', icon: '🛗', year: '2024', tags: ['Civil', 'Installation'] },
  { id: 5, title: 'CHU Tizi Ouzou — UPS Systems', desc: 'UPS deployment across ICU and operating theatres.', icon: '🔋', year: '2024', tags: ['Electrical', 'Critical'] },
  { id: 6, title: 'Hôpital Mostaganem — Plumbing', desc: 'Medical gas pipeline inspection, certification, and valve replacement.', icon: '🔧', year: '2023', tags: ['Plumbing', 'Gas'] },
]

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 12px' }}>
      <div style={{ fontSize: 26, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────── */
export default function CompanyProfile() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews' | 'contact'>('overview')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [msg, setMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => (await api.get('/companies/profile')).data.data,
  })

  const reviewsQuery = useQuery({
    queryKey: ['company-reviews'],
    queryFn: async () => {
      try { return (await api.get('/ratings/company')).data.data }
      catch { return null }
    },
    retry: false,
  })

  const updateMut = useMutation({
    mutationFn: (payload: any) => api.put('/companies/profile', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-profile'] }); setEditing(false); setMsg('✅ Profile updated successfully!') },
  })

  const p = data || {}
  const services: string[] = Array.isArray(p.services) ? p.services : (p.services || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  const certifications: string[] = Array.isArray(p.certifications) ? p.certifications : (p.certifications || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  const reviews = reviewsQuery.data || []
  const avgRating = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 4.6

  const startEdit = () => {
    setForm({
      company_name: p.company_name || '',
      description: p.description || '',
      contact_email: p.contact_email || '',
      contact_phone: p.contact_phone || '',
      website: p.website || '',
      address: p.address || '',
      founded_year: p.founded_year || '',
      employee_count: p.employee_count || '',
      services: services.join(', '),
      certifications: certifications.join(', '),
    })
    setEditing(true)
  }

  const save = () => {
    const payload = {
      ...form,
      services: form.services.split(',').map((s: string) => s.trim()).filter(Boolean),
      certifications: form.certifications.split(',').map((s: string) => s.trim()).filter(Boolean),
    }
    updateMut.mutate(payload)
  }

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12, color: 'var(--text-3)' }}>
      <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      Loading profile…
    </div>
  )

  const companyName = p.company_name || 'Your Company'
  const cover = getCover(companyName)

  return (
    <>
      {msg && <div className="success" style={{ marginBottom: 16 }}>{msg}</div>}

      {/* ── Hero Section ─────────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-cover" style={{ background: cover }}>
          <div className="profile-cover-pattern" />
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <button className="btn btn-sm" style={{ position: 'absolute', bottom: 14, right: 16, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 11 }}
            onClick={startEdit}>✏️ Edit Profile</button>
        </div>

        <div className="profile-body">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar" style={{ background: cover, fontSize: 40, fontWeight: 900 }}>
              {getInitial(companyName)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="profile-name">{companyName}</h1>
            <div className="profile-meta">
              {p.address && <span>📍 {p.address}</span>}
              {p.founded_year && <span>📅 Est. {p.founded_year}</span>}
              {p.employee_count && <span>👥 {p.employee_count} employees</span>}
              <span className="badge badge-green">✓ Verified Partner</span>
            </div>
            {p.description && (
              <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '8px 0 0', lineHeight: 1.6, maxWidth: 640 }}>
                {p.description}
              </p>
            )}
          </div>
        </div>

        <div className="profile-stats">
          <StatCard icon="🔧" label="Projects Completed" value={p.completed_jobs ?? 47} sub="Since founding" />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '10px 0' }} />
          <StatCard icon="⭐" label="Avg. Rating" value={avgRating.toFixed(1)} sub={`${reviews.length || 12} reviews`} />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '10px 0' }} />
          <StatCard icon="🏥" label="Hospitals Served" value={p.hospitals_served ?? 18} sub="Nationwide" />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '10px 0' }} />
          <StatCard icon="📆" label="Response Time" value="< 4h" sub="Average SLA" />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '10px 0' }} />
          <StatCard icon="🎖️" label="Certifications" value={certifications.length || 3} sub="Industry standards" />
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────── */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {(['overview', 'portfolio', 'reviews', 'contact'] as const).map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'overview' ? '📋 Overview' : t === 'portfolio' ? '🗂 Portfolio' : t === 'reviews' ? '⭐ Reviews' : '📞 Contact'}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>🛠 Services Offered</div>
            {services.length === 0
              ? <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No services listed. Edit your profile to add services.</p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{services.map(s => <span key={s} className="service-tag">🔧 {s}</span>)}</div>
            }
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>🎖 Certifications</div>
            {certifications.length === 0
              ? <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No certifications listed.</p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{certifications.map(c => <span key={c} className="cert-tag">✓ {c}</span>)}</div>
            }
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-title" style={{ marginBottom: 14 }}>📖 About the Company</div>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              {p.description || 'No company description provided. Click "Edit Profile" to add a description.'}
            </p>
            {(p.founded_year || p.employee_count) && (
              <div style={{ display: 'flex', gap: 32, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {p.founded_year && <div><div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Founded</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{p.founded_year}</div></div>}
                {p.employee_count && <div><div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Size</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{p.employee_count} people</div></div>}
                <div><div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div><div style={{ marginTop: 4 }}><span className="badge badge-green">Active Partner</span></div></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Portfolio ─────────────────────────────────────── */}
      {activeTab === 'portfolio' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Project Portfolio</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>Completed maintenance projects at NAFAS-partnered facilities</p>
            </div>
            <span className="badge badge-blue">{PORTFOLIO_ITEMS.length} projects</span>
          </div>
          <div className="gallery-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {PORTFOLIO_ITEMS.map(item => (
              <div key={item.id} className="gallery-item">
                <div style={{ height: 110, background: `linear-gradient(135deg, ${['#0f172a','#064e3b','#7c2d12','#3b0764','#065f46','#1e3a8a'][item.id % 6]} 0%, ${['#1e3a8a','#065f46','#9a3412','#4c1d95','#134e4a','#312e81'][item.id % 6]} 100%)`, display: 'grid', placeItems: 'center', fontSize: 38, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
                  {item.icon}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', flex: 1 }}>{item.title}</div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, marginLeft: 8 }}>{item.year}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '0 0 10px', lineHeight: 1.6 }}>{item.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {item.tags.map(t => <span key={t} style={{ padding: '2px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 99, fontSize: 11, color: 'var(--text-2)' }}>{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Reviews ──────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--text)', letterSpacing: -3, lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, margin: '8px 0' }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 20, color: s <= Math.round(avgRating) ? '#f59e0b' : '#e2e8f0' }}>★</span>)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Based on {reviews.length || 12} reviews</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: 'Dr. Karim Benali', org: 'CHU Mustapha Pacha', rating: 5, title: 'Exceptional response and technical quality', text: 'The team arrived within 2 hours of our emergency call. Their expertise and professionalism are second to none in Algeria.', date: '2026-05-10' },
              { name: 'Mme. Fatima Zerrouki', org: 'Hôpital Ibn Rochd', rating: 4, title: 'Reliable and professional', text: 'Project managed expertly from start to finish. Minor documentation delays, but overall highly satisfied with the work quality.', date: '2026-05-08' },
              { name: 'Eng. Omar Hadj', org: 'CHU Annaba', rating: 3, title: 'Good quality, punctuality issues', text: 'The technical quality was solid but response time exceeded the agreed SLA. Recommend improving spare parts logistics.', date: '2026-04-22' },
            ].map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-header">
                  <div className="review-author">
                    <div className="review-author-avatar" style={{ background: ['#c0392b','#2563eb','#16a34a'][i] }}>{r.name.charAt(0)}</div>
                    <div><div className="review-author-name">{r.name}</div><div className="review-author-org">{r.org}</div></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : '#e2e8f0', fontSize: 15 }}>★</span>)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{r.title}</div>
                <div className="review-text">{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Contact ──────────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📞 Contact Information</div>
            <div className="contact-grid">
              {p.contact_phone && <div className="contact-item"><div className="contact-icon" style={{ background: '#f0fdf4' }}>📱</div><div><div className="contact-label">Phone</div><div className="contact-value">{p.contact_phone}</div></div></div>}
              {p.contact_email && <div className="contact-item"><div className="contact-icon" style={{ background: '#eff6ff' }}>📧</div><div><div className="contact-label">Email</div><div className="contact-value" style={{ fontSize: 12 }}>{p.contact_email}</div></div></div>}
              {p.website && <div className="contact-item"><div className="contact-icon" style={{ background: '#fdf4ff' }}>🌐</div><div><div className="contact-label">Website</div><a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none' }}>{p.website}</a></div></div>}
              {p.address && <div className="contact-item" style={{ gridColumn: '1 / -1' }}><div className="contact-icon" style={{ background: '#fffbeb' }}>📍</div><div><div className="contact-label">Address</div><div className="contact-value">{p.address}</div></div></div>}
              {!p.contact_phone && !p.contact_email && !p.website && !p.address && <div className="empty-state"><div className="empty-icon">📞</div><div className="empty-title">No contact info yet</div></div>}
            </div>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📋 Send a Message</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field"><span>Name</span><input className="input" placeholder="Your name" /></div>
              <div className="field"><span>Email</span><input className="input" type="email" placeholder="your@email.com" /></div>
              <div className="field"><span>Subject</span><input className="input" placeholder="How can we help?" /></div>
              <div className="field"><span>Message</span><textarea className="input" rows={4} placeholder="Describe your maintenance need or inquiry…" /></div>
              <button className="btn btn-primary">Send Message</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Drawer ───────────────────────────────────── */}
      {editing && (
        <>
          <div className="drawer-backdrop" onClick={() => setEditing(false)} />
          <aside className="drawer" style={{ width: 540 }}>
            <div className="drawer-header">
              <div><h3>Edit Company Profile</h3><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Update your company information</div></div>
              <button className="drawer-close" onClick={() => setEditing(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field"><span>Company Name</span><input className="input" value={form.company_name} onChange={e => setForm((s: any) => ({ ...s, company_name: e.target.value }))} /></div>
              <div className="field"><span>Description</span><textarea className="input" rows={4} value={form.description} onChange={e => setForm((s: any) => ({ ...s, description: e.target.value }))} /></div>
              <div className="form-row">
                <div className="field"><span>Contact Email</span><input className="input" type="email" value={form.contact_email} onChange={e => setForm((s: any) => ({ ...s, contact_email: e.target.value }))} /></div>
                <div className="field"><span>Contact Phone</span><input className="input" value={form.contact_phone} onChange={e => setForm((s: any) => ({ ...s, contact_phone: e.target.value }))} /></div>
              </div>
              <div className="field"><span>Website</span><input className="input" placeholder="https://yourcompany.dz" value={form.website} onChange={e => setForm((s: any) => ({ ...s, website: e.target.value }))} /></div>
              <div className="field"><span>Address</span><input className="input" placeholder="City, Wilaya, Algeria" value={form.address} onChange={e => setForm((s: any) => ({ ...s, address: e.target.value }))} /></div>
              <div className="form-row">
                <div className="field"><span>Founded Year</span><input className="input" type="number" placeholder="2010" value={form.founded_year} onChange={e => setForm((s: any) => ({ ...s, founded_year: e.target.value }))} /></div>
                <div className="field"><span>Employee Count</span><input className="input" type="number" placeholder="45" value={form.employee_count} onChange={e => setForm((s: any) => ({ ...s, employee_count: e.target.value }))} /></div>
              </div>
              <div className="field"><span>Services (comma-separated)</span><input className="input" placeholder="HVAC, Electrical, Plumbing" value={form.services} onChange={e => setForm((s: any) => ({ ...s, services: e.target.value }))} /></div>
              <div className="field"><span>Certifications (comma-separated)</span><input className="input" placeholder="ISO 9001, CE Marking" value={form.certifications} onChange={e => setForm((s: any) => ({ ...s, certifications: e.target.value }))} /></div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={updateMut.isPending} onClick={save}>{updateMut.isPending ? 'Saving…' : '💾 Save Profile'}</button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
