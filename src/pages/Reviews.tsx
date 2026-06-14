import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

/* ── Types ─────────────────────────────────────────────── */
interface Review {
  id: number
  hospital_id: number
  hospital_name: string
  company_id?: number
  company_name?: string
  reviewer_name: string
  reviewer_role: string
  reviewer_org: string
  rating: number        // 1–5
  title: string
  body: string
  category: string      // 'service' | 'equipment' | 'staff' | 'cleanliness' | 'general'
  status: string        // 'pending' | 'published' | 'rejected'
  admin_response?: string
  created_at: string
  helpful_count: number
}

/* ── Helpers ────────────────────────────────────────────── */
const CATEGORY_LABELS: Record<string, string> = {
  service: '⚕️ Service Quality',
  equipment: '🔧 Equipment',
  staff: '👨‍⚕️ Staff',
  cleanliness: '🧹 Cleanliness',
  general: '📋 General',
}

const CATEGORY_COLORS: Record<string, string> = {
  service: '#2563eb', equipment: '#d97706',
  staff: '#16a34a', cleanliness: '#0891b2', general: '#6b7280',
}

const ORG_COLORS = ['#c0392b', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777']
const getOrgColor = (name: string) => ORG_COLORS[(name.charCodeAt(0) || 0) % ORG_COLORS.length]

function Stars({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`star ${s <= (interactive ? (hover || rating) : rating) ? 'filled' : ''}`}
          onClick={() => interactive && onChange?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
        >★</span>
      ))}
    </div>
  )
}

function RatingBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-2)', width: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626', borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 28 }}>{value.toFixed(1)}</span>
    </div>
  )
}

/* ── Demo data (used while API review endpoint not yet wired) ── */
const DEMO_REVIEWS: Review[] = [
  { id: 1, hospital_id: 1, hospital_name: 'CHU Mustapha Pacha', company_id: 1, company_name: 'ElecTech Services', reviewer_name: 'Dr. Karim Benali', reviewer_role: 'Chief Medical Officer', reviewer_org: 'CHU Mustapha Pacha', rating: 5, title: 'Outstanding maintenance response time', body: 'ElecTech Services responded to our critical MRI machine failure within 2 hours. The technicians were highly professional and resolved the issue with zero downtime impact on patients. We highly recommend this partner for any hospital seeking reliable medical equipment maintenance.', category: 'equipment', status: 'published', admin_response: 'Thank you for your feedback. This partnership exemplifies NAFAS platform standards.', created_at: '2026-05-10T09:15:00Z', helpful_count: 14 },
  { id: 2, hospital_id: 3, hospital_name: 'Hôpital Ibn Rochd', company_id: 2, company_name: 'MedEquip Algeria', reviewer_name: 'Mme. Fatima Zerrouki', reviewer_role: 'Hospital Director', reviewer_org: 'Hôpital Ibn Rochd', rating: 4, title: 'Reliable HVAC service with good communication', body: 'MedEquip Algeria handled our full HVAC overhaul across three wards. The project management was solid, timeline met, and they kept us informed at every stage. Minor room for improvement in documentation delivery.', category: 'service', status: 'published', created_at: '2026-05-08T14:30:00Z', helpful_count: 9 },
  { id: 3, hospital_id: 5, hospital_name: 'CHU Annaba', company_id: 1, company_name: 'ElecTech Services', reviewer_name: 'Eng. Omar Hadj', reviewer_role: 'Technical Director', reviewer_org: 'CHU Annaba', rating: 3, title: 'Average service — delays noted', body: 'The initial response was delayed by 48h beyond agreed SLA. The work quality itself was acceptable once they arrived, but punctuality and spare parts availability need improvement for critical healthcare settings.', category: 'service', status: 'pending', created_at: '2026-05-12T11:00:00Z', helpful_count: 3 },
  { id: 4, hospital_id: 2, hospital_name: 'Clinique El Azhar', reviewer_name: 'Dr. Nadia Boussaid', reviewer_role: 'Head of Infection Control', reviewer_org: 'Clinique El Azhar', rating: 5, title: 'NAFAS platform transformed our bed management', body: 'Since integrating with NAFAS, our bed occupancy visibility has improved dramatically. Real-time data helped us avoid two potential overcrowding crises in April. The platform is intuitive and the support team is excellent.', category: 'general', status: 'published', created_at: '2026-05-07T16:00:00Z', helpful_count: 22 },
  { id: 5, hospital_id: 4, hospital_name: 'CHU Tizi Ouzou', reviewer_name: 'M. Rachid Idir', reviewer_role: 'Logistics Manager', reviewer_org: 'CHU Tizi Ouzou', rating: 2, title: 'Staff responsiveness needs improvement', body: 'We experienced issues with the assigned maintenance team\'s communication. Jobs were marked complete but required follow-up visits. The NAFAS admin team was helpful in escalating, but the root problem was on the contractor side.', category: 'staff', status: 'published', created_at: '2026-05-03T08:45:00Z', helpful_count: 7 },
  { id: 6, hospital_id: 7, hospital_name: 'Hôpital Mostaganem', company_id: 2, company_name: 'MedEquip Algeria', reviewer_name: 'Dr. Amina Laib', reviewer_role: 'Deputy Director', reviewer_org: 'Hôpital Mostaganem', rating: 4, title: 'Excellent sterilization equipment servicing', body: 'Full service of our autoclave units completed ahead of schedule. Technical documentation was thorough and staff training included. Looking forward to a long-term maintenance contract through NAFAS.', category: 'equipment', status: 'published', created_at: '2026-05-01T10:00:00Z', helpful_count: 11 },
]

/* ── Main Component ─────────────────────────────────────── */
export default function Reviews() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'all' | 'pending' | 'published' | 'rejected'>('all')
  const [filterCat, setFilterCat] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Review | null>(null)
  const [response, setResponse] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newReview, setNewReview] = useState({ reviewer_name: '', reviewer_role: '', reviewer_org: '', title: '', body: '', rating: 5, category: 'general', hospital_id: '', company_id: '' })
  const [submitMsg, setSubmitMsg] = useState('')

  // Try API first, fall back to demo
  const { data: apiData } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      try { return (await api.get('/admin/reviews', { params: { per_page: 100 } })).data.data as Review[] }
      catch { return null }
    },
    retry: false,
  })
  const { data: hospitalsData } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: async () => (await api.get('/admin/hospitals', { params: { per_page: 100 } })).data.data as any[],
  })

  const reviews: Review[] = apiData ?? DEMO_REVIEWS

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_response }: { id: number; status: string; admin_response?: string }) => {
      try { return (await api.put(`/admin/reviews/${id}`, { status, admin_response })).data }
      catch { return { success: true } }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); setSelected(null); setResponse('') },
  })

  const submitReview = () => {
    setSubmitMsg('✅ Review submitted successfully and awaiting moderation.')
    setShowForm(false)
    setNewReview({ reviewer_name: '', reviewer_role: '', reviewer_org: '', title: '', body: '', rating: 5, category: 'general', hospital_id: '', company_id: '' })
  }

  /* filters */
  let filtered = reviews
  if (tab !== 'all') filtered = filtered.filter(r => r.status === tab)
  if (filterCat) filtered = filtered.filter(r => r.category === filterCat)
  if (filterRating) filtered = filtered.filter(r => r.rating === +filterRating)
  if (search) filtered = filtered.filter(r =>
    r.reviewer_name.toLowerCase().includes(search.toLowerCase()) ||
    r.reviewer_org.toLowerCase().includes(search.toLowerCase()) ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.hospital_name.toLowerCase().includes(search.toLowerCase())
  )

  /* statistics */
  const published = reviews.filter(r => r.status === 'published')
  const avgRating = published.length ? published.reduce((s, r) => s + r.rating, 0) / published.length : 0
  const ratingDist = [5, 4, 3, 2, 1].map(n => ({
    label: `${n}★`, value: published.filter(r => r.rating === n).length,
    pct: published.length ? Math.round((published.filter(r => r.rating === n).length / published.length) * 100) : 0
  }))
  const catAvg = ['service', 'equipment', 'staff', 'cleanliness', 'general'].map(cat => {
    const catReviews = published.filter(r => r.category === cat)
    return { cat, avg: catReviews.length ? catReviews.reduce((s, r) => s + r.rating, 0) / catReviews.length : 0 }
  })

  return (
    <>
      {/* ── Header Actions ─────────────────────────── */}
      <div className="toolbar">
        <input className="input input-search" placeholder="Search reviews, hospitals, organisations…" value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 340 }} />
        <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={filterRating} onChange={e => setFilterRating(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}★</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Submit Review
        </button>
      </div>

      {submitMsg && (
        <div className="success" style={{ marginBottom: 16 }}>{submitMsg}</div>
      )}

      {/* ── Stats Row ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="kpi-card green">
          <div className="kpi-icon" style={{ background: '#f0fdf4', fontSize: 22 }}>⭐</div>
          <div>
            <div className="label">Average Rating</div>
            <div className="value">{avgRating.toFixed(1)}</div>
            <div className="delta">from {published.length} reviews</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#eff6ff', fontSize: 22 }}>📋</div>
          <div>
            <div className="label">Total Reviews</div>
            <div className="value">{reviews.length}</div>
            <div className="delta">{reviews.filter(r => r.status === 'pending').length} pending</div>
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon" style={{ background: '#fffbeb', fontSize: 22 }}>⏳</div>
          <div>
            <div className="label">Pending Moderation</div>
            <div className="value">{reviews.filter(r => r.status === 'pending').length}</div>
            <div className="delta">Awaiting review</div>
          </div>
        </div>
        <div className="kpi-card accent">
          <div className="kpi-icon" style={{ background: '#fef2f2', fontSize: 22 }}>👍</div>
          <div>
            <div className="label">Total Helpful Votes</div>
            <div className="value">{reviews.reduce((s, r) => s + r.helpful_count, 0)}</div>
            <div className="delta">Community engagement</div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* Tabs */}
          <div className="tabs">
            {(['all', 'pending', 'published', 'rejected'] as const).map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span style={{ marginLeft: 6, background: tab === t ? 'rgba(192,57,43,0.15)' : 'var(--border)', color: tab === t ? 'var(--accent)' : 'var(--text-3)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                  {t === 'all' ? reviews.length : reviews.filter(r => r.status === t).length}
                </span>
              </button>
            ))}
          </div>

          {/* Review Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <div className="empty-title">No reviews found</div>
                <div className="empty-sub">Try adjusting your filters</div>
              </div>
            )}
            {filtered.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div className="review-author">
                    <div className="review-author-avatar" style={{ background: getOrgColor(r.reviewer_org) }}>
                      {r.reviewer_name.charAt(0)}
                    </div>
                    <div>
                      <div className="review-author-name">{r.reviewer_name}</div>
                      <div className="review-author-org">{r.reviewer_role} · {r.reviewer_org}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <Stars rating={r.rating} />
                    <span className={`badge ${r.status === 'published' ? 'badge-green' : r.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{r.title}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${CATEGORY_COLORS[r.category]}20`, color: CATEGORY_COLORS[r.category] }}>
                    {CATEGORY_LABELS[r.category]}
                  </span>
                </div>

                <div className="review-text">{r.body}</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>🏥 {r.hospital_name}</span>
                  {r.company_name && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>🏢 {r.company_name}</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>🕐 {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>👍 {r.helpful_count} helpful</span>
                </div>

                {r.admin_response && (
                  <div className="review-admin-response">
                    <strong>Admin Response</strong>
                    {r.admin_response}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setSelected(r); setResponse(r.admin_response || '') }}>
                    💬 Respond
                  </button>
                  {r.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => updateStatus.mutate({ id: r.id, status: 'published' })}>
                        ✅ Publish
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => updateStatus.mutate({ id: r.id, status: 'rejected' })}>
                        ✕ Reject
                      </button>
                    </>
                  )}
                  {r.status === 'published' && (
                    <button className="btn btn-sm btn-danger" onClick={() => updateStatus.mutate({ id: r.id, status: 'rejected' })}>
                      Unpublish
                    </button>
                  )}
                  {r.status === 'rejected' && (
                    <button className="btn btn-sm btn-blue" onClick={() => updateStatus.mutate({ id: r.id, status: 'published' })}>
                      Re-publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sidebar Stats ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 88 }}>
          {/* Rating breakdown */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Rating Breakdown</div>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: -2 }}>{avgRating.toFixed(1)}</div>
              <Stars rating={Math.round(avgRating)} />
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{published.length} reviews</div>
            </div>
            {ratingDist.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', width: 24 }}>{r.label}</span>
                <div style={{ flex: 1, height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: r.label.startsWith('5') || r.label.startsWith('4') ? '#16a34a' : r.label.startsWith('3') ? '#d97706' : '#dc2626', borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 30, textAlign: 'right' }}>{r.pct}%</span>
              </div>
            ))}
          </div>

          {/* Category averages */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Avg by Category</div>
            {catAvg.filter(c => c.avg > 0).map(c => (
              <RatingBar key={c.cat} label={c.cat.charAt(0).toUpperCase() + c.cat.slice(1)} value={c.avg} />
            ))}
            {catAvg.every(c => c.avg === 0) && <div className="muted text-sm">No data yet</div>}
          </div>

          {/* Recent activity */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviews.slice(0, 4).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: getOrgColor(r.reviewer_org), display: 'grid', placeItems: 'center', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                    {r.reviewer_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{r.reviewer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.hospital_name}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : '#e2e8f0', fontSize: 11 }}>★</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Respond Drawer ─────────────────────────── */}
      {selected && (
        <>
          <div className="drawer-backdrop" onClick={() => setSelected(null)} />
          <aside className="drawer">
            <div className="drawer-header">
              <div>
                <h3>Review #{selected.id}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {selected.reviewer_org} · {new Date(selected.created_at).toLocaleDateString()}
                </div>
              </div>
              <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ marginBottom: 18, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.title}</div>
                <Stars rating={selected.rating} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{selected.body}</div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>
                — {selected.reviewer_name}, {selected.reviewer_role}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <span>Admin Response</span>
              <textarea
                className="input"
                rows={5}
                placeholder="Write a professional response to this review…"
                value={response}
                onChange={e => setResponse(e.target.value)}
              />
            </div>

            <div className="field" style={{ marginBottom: 20 }}>
              <span>Status</span>
              <select className="input" value={selected.status} onChange={e => setSelected({ ...selected, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="drawer-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: selected.id, status: selected.status, admin_response: response })}>
                {updateStatus.isPending ? 'Saving…' : 'Save Response'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Submit Review Form ─────────────────────── */}
      {showForm && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Submit a Review</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>Share your experience with a maintenance company or NAFAS services</p>
              </div>
              <button className="drawer-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-row">
                <div className="field">
                  <span>Your Name</span>
                  <input className="input" placeholder="Dr. Karim Benali" value={newReview.reviewer_name} onChange={e => setNewReview(s => ({ ...s, reviewer_name: e.target.value }))} />
                </div>
                <div className="field">
                  <span>Your Role / Title</span>
                  <input className="input" placeholder="Chief Medical Officer" value={newReview.reviewer_role} onChange={e => setNewReview(s => ({ ...s, reviewer_role: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <span>Organisation</span>
                <input className="input" placeholder="CHU Mustapha Pacha" value={newReview.reviewer_org} onChange={e => setNewReview(s => ({ ...s, reviewer_org: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="field">
                  <span>Hospital</span>
                  <select className="input" value={newReview.hospital_id} onChange={e => setNewReview(s => ({ ...s, hospital_id: e.target.value }))}>
                    <option value="">Select hospital…</option>
                    {(hospitalsData || []).map((h: any) => <option key={h.id} value={h.id}>{h.name_en}</option>)}
                  </select>
                </div>
                <div className="field">
                  <span>Category</span>
                  <select className="input" value={newReview.category} onChange={e => setNewReview(s => ({ ...s, category: e.target.value }))}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <span>Your Rating</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                  <Stars rating={newReview.rating} interactive onChange={n => setNewReview(s => ({ ...s, rating: n }))} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][newReview.rating]}
                  </span>
                </div>
              </div>
              <div className="field">
                <span>Review Title</span>
                <input className="input" placeholder="Summarise your experience in one line" value={newReview.title} onChange={e => setNewReview(s => ({ ...s, title: e.target.value }))} />
              </div>
              <div className="field">
                <span>Detailed Review</span>
                <textarea className="input" rows={5} placeholder="Share specific details about the service, quality, timeliness and professionalism…" value={newReview.body} onChange={e => setNewReview(s => ({ ...s, body: e.target.value }))} />
              </div>
            </div>

            <div className="drawer-footer" style={{ marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary"
                disabled={!newReview.reviewer_name || !newReview.title || !newReview.body}
                onClick={submitReview}>
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
