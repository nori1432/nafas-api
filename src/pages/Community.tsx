import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useT } from '../store/lang'

type Tab = 'questions' | 'forums'

const SPECIALTY_LABELS: Record<string, string> = {
  neurology_mental_health: 'Neurology & Mental Health',
  mother_child_health:     'Mother & Child Health',
  kidney_dialysis:         'Kidney & Dialysis',
  diabetes_endocrinology:  'Diabetes & Endocrinology',
  chest_respiratory:       'Chest & Respiratory',
  general_medicine:        'General Medicine',
}

const URGENCY_BADGE: Record<string, string> = {
  high:   'badge-red',
  medium: 'badge-amber',
  low:    'badge-gray',
}

const STATUS_BADGE: Record<string, string> = {
  open:     'badge-red',
  answered: 'badge-green',
  closed:   'badge-gray',
}

export default function Community() {
  const [tab, setTab] = useState<Tab>('questions')
  const t = useT()

  return (
    <>
      <div className="toolbar">
        <button
          className={`btn ${tab === 'questions' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('questions')}
        >
          {t('Ask Doctor / Hospital', 'اسأل الطبيب / المستشفى')}
        </button>
        <button
          className={`btn ${tab === 'forums' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('forums')}
        >
          {t('Medical Forums', 'المنتديات الطبية')}
        </button>
      </div>
      {tab === 'questions' && <QuestionsTab />}
      {tab === 'forums'    && <ForumsTab />}
    </>
  )
}

/* ─── Questions Tab ──────────────────────────────────────────────── */

function QuestionsTab() {
  const qc = useQueryClient()
  const t = useT()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<any>(null)
  const [reply, setReply] = useState('')

  const { data: questions } = useQuery({
    queryKey: ['community-questions', status],
    queryFn: async () =>
      (await api.get('/community/questions', { params: { status: status || undefined, per_page: 100 } }))
        .data.data as any[],
  })

  const { data: detail } = useQuery({
    queryKey: ['community-question', open?.id],
    queryFn: async () =>
      (await api.get(`/community/questions/${open.id}`)).data.data,
    enabled: !!open?.id,
  })

  const sendReply = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: string }) =>
      (await api.post(`/community/questions/${id}/reply`, { body })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-questions'] })
      qc.invalidateQueries({ queryKey: ['community-question', open?.id] })
      setReply('')
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      (await api.put(`/community/questions/${id}/status`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-questions'] })
      setOpen(null)
    },
  })

  const all = questions || []
  const list = all.filter((q: any) =>
    !search ||
    (q.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.user_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCount     = all.filter((q: any) => q.status === 'open').length
  const answeredCount = all.filter((q: any) => q.status === 'answered').length

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: t('Total', 'الإجمالي'), value: all.length, color: '' },
          { label: t('Awaiting Reply', 'بانتظار الرد'), value: openCount, color: openCount > 10 ? 'accent' : '' },
          { label: t('Answered', 'تمت الإجابة'), value: answeredCount, color: 'green' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`} style={{ padding: '14px 16px' }}>
            <div className="label">{k.label}</div>
            <div className="value" style={{ fontSize: 22 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <input
          className="input input-search"
          placeholder={t('Search questions…', 'بحث في الأسئلة...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select className="input" value={status} onChange={e => setStatus(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">{t('All Statuses', 'جميع الحالات')}</option>
          <option value="open">{t('Open', 'مفتوح')}</option>
          <option value="answered">{t('Answered', 'تمت الإجابة')}</option>
          <option value="closed">{t('Closed', 'مغلق')}</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{list.length} {t('questions', 'سؤال')}</span>
      </div>

      <div className="table-wrap">
        <table className="nfs">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('Patient', 'المريض')}</th>
              <th>{t('Question', 'السؤال')}</th>
              <th>{t('Specialty', 'التخصص')}</th>
              <th>{t('Urgency', 'الأولوية')}</th>
              <th>{t('Replies', 'الردود')}</th>
              <th>{t('Status', 'الحالة')}</th>
              <th>{t('Date', 'التاريخ')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((q: any) => (
              <tr key={q.id}>
                <td style={{ color: 'var(--text-3)', fontSize: 12 }}>#{q.id}</td>
                <td style={{ fontWeight: 600 }}>{q.user_name || '—'}</td>
                <td style={{ maxWidth: 220 }}>
                  <div style={{ fontSize: 13, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {q.title}
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {q.specialty ? (SPECIALTY_LABELS[q.specialty] || q.specialty) : '—'}
                </td>
                <td>
                  <span className={`badge ${URGENCY_BADGE[q.urgency] || 'badge-gray'}`}>
                    {q.urgency}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>{q.reply_count ?? 0}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[q.status] || 'badge-gray'}`}>
                    {q.status}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {(q.created_at || '').slice(0, 10)}
                </td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setOpen(q); setReply('') }}>
                    {t('Reply', 'رد')}
                  </button>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <div className="empty-title">{t('No questions yet', 'لا توجد أسئلة بعد')}</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Question detail drawer */}
      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(null)} />
          <aside className="drawer" style={{ width: 540 }}>
            <div className="drawer-header">
              <div>
                <h3>{t('Question', 'سؤال')} #{open.id}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {open.user_name} · {open.specialty ? (SPECIALTY_LABELS[open.specialty] || open.specialty) : t('General', 'عام')} · {(open.created_at || '').slice(0, 10)}
                </div>
              </div>
              <button className="drawer-close" onClick={() => setOpen(null)}>✕</button>
            </div>

            {/* Patient info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #c0392b)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {(open.user_name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{open.user_name || t('Anonymous', 'مجهول')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  <span className={`badge ${URGENCY_BADGE[open.urgency] || 'badge-gray'}`} style={{ marginRight: 6 }}>{open.urgency}</span>
                  <span className={`badge ${STATUS_BADGE[open.status] || 'badge-gray'}`}>{open.status}</span>
                </div>
              </div>
            </div>

            {/* Question body */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                {t('Question', 'السؤال')}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{open.title}</div>
              <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
                {open.body}
              </div>
            </div>

            {/* Existing replies */}
            {(detail?.replies?.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                  {t('Replies', 'الردود')} ({detail.replies.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detail.replies.map((r: any) => (
                    <div key={r.id} style={{ padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: r.is_medical_staff ? 'rgba(22,163,74,0.05)' : 'var(--surface-2)', borderColor: r.is_medical_staff ? 'rgba(22,163,74,0.25)' : 'var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.user_name}</span>
                        {r.is_medical_staff && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(22,163,74,0.15)', color: '#16a34a', fontWeight: 600 }}>
                            ✓ {t('Medical Staff', 'طاقم طبي')}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>{(r.created_at || '').slice(0, 10)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply form */}
            <div className="field" style={{ marginBottom: 20 }}>
              <span>{t('Your Reply', 'ردك')}</span>
              <textarea
                className="input" rows={4}
                placeholder={t('Write a professional medical response…', 'اكتب ردًا طبيًا احترافيًا...')}
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
            </div>

            <div className="drawer-footer" style={{ flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button className="btn btn-ghost" onClick={() => setOpen(null)} style={{ flex: 1 }}>{t('Close', 'إغلاق')}</button>
                <button
                  className="btn btn-primary"
                  disabled={sendReply.isPending || !reply.trim()}
                  onClick={() => sendReply.mutate({ id: open.id, body: reply })}
                  style={{ flex: 2 }}
                >
                  {sendReply.isPending ? t('Sending…', 'جارٍ الإرسال...') : t('Send Reply', 'إرسال الرد')}
                </button>
              </div>
              {open.status !== 'closed' && (
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  {open.status === 'open' && (
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--text-3)' }}
                      onClick={() => updateStatus.mutate({ id: open.id, status: 'answered' })}>
                      ✓ {t('Mark Answered', 'تمييز كمُجاب')}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--text-3)' }}
                    onClick={() => updateStatus.mutate({ id: open.id, status: 'closed' })}>
                    ✕ {t('Close Question', 'إغلاق السؤال')}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}

/* ─── Forums Tab ─────────────────────────────────────────────────── */

function ForumsTab() {
  const qc = useQueryClient()
  const t = useT()
  const [specialty, setSpecialty] = useState('neurology_mental_health')
  const [open, setOpen] = useState<any>(null)
  const [reply, setReply] = useState('')

  const { data: posts } = useQuery({
    queryKey: ['forum-posts', specialty],
    queryFn: async () =>
      (await api.get('/community/forums/posts', { params: { specialty, per_page: 100 } }))
        .data.data as any[],
  })

  const { data: detail } = useQuery({
    queryKey: ['forum-post', open?.id],
    queryFn: async () =>
      (await api.get(`/community/forums/posts/${open.id}`)).data.data,
    enabled: !!open?.id,
  })

  const sendReply = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: string }) =>
      (await api.post(`/community/forums/posts/${id}/replies`, { body })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts', specialty] })
      qc.invalidateQueries({ queryKey: ['forum-post', open?.id] })
      setReply('')
    },
  })

  const closePost = useMutation({
    mutationFn: async (id: number) =>
      (await api.put(`/community/forums/posts/${id}/close`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts', specialty] })
      setOpen(null)
    },
  })

  const list = posts || []

  return (
    <>
      {/* Specialty selector */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        {Object.entries(SPECIALTY_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`btn btn-sm ${specialty === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSpecialty(key)}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{list.length} {t('posts', 'منشور')}</span>
      </div>

      <div className="table-wrap">
        <table className="nfs">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('Author', 'الكاتب')}</th>
              <th>{t('Title', 'العنوان')}</th>
              <th>{t('Replies', 'الردود')}</th>
              <th>{t('Status', 'الحالة')}</th>
              <th>{t('Date', 'التاريخ')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p: any) => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-3)', fontSize: 12 }}>#{p.id}</td>
                <td style={{ fontWeight: 600 }}>{p.user_name || '—'}</td>
                <td style={{ maxWidth: 260 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', marginTop: 2 }}>
                    {p.body}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>{p.reply_count ?? 0}</td>
                <td>
                  <span className={p.status === 'active' ? 'badge badge-green' : 'badge badge-gray'}>
                    {p.status}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {(p.created_at || '').slice(0, 10)}
                </td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setOpen(p); setReply('') }}>
                    {t('View', 'عرض')}
                  </button>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-icon">🗨️</div>
                  <div className="empty-title">{t('No posts in this forum yet', 'لا توجد منشورات في هذا المنتدى بعد')}</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Post detail drawer */}
      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(null)} />
          <aside className="drawer" style={{ width: 540 }}>
            <div className="drawer-header">
              <div>
                <h3>{t('Forum Post', 'منشور')} #{open.id}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {SPECIALTY_LABELS[open.specialty] || open.specialty} · {open.user_name} · {(open.created_at || '').slice(0, 10)}
                </div>
              </div>
              <button className="drawer-close" onClick={() => setOpen(null)}>✕</button>
            </div>

            {/* Post body */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{open.title}</div>
              <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
                {open.body}
              </div>
            </div>

            {/* Replies */}
            {(detail?.replies?.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                  {t('Replies', 'الردود')} ({detail.replies.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detail.replies.map((r: any) => (
                    <div key={r.id} style={{ padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: r.is_medical_staff ? 'rgba(22,163,74,0.05)' : 'var(--surface-2)', borderColor: r.is_medical_staff ? 'rgba(22,163,74,0.25)' : 'var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.user_name}</span>
                        {r.is_medical_staff && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(22,163,74,0.15)', color: '#16a34a', fontWeight: 600 }}>
                            ✓ {t('Medical Staff', 'طاقم طبي')}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>{(r.created_at || '').slice(0, 10)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply form */}
            <div className="field" style={{ marginBottom: 20 }}>
              <span>{t('Add Reply', 'أضف ردًا')}</span>
              <textarea
                className="input" rows={4}
                placeholder={t('Write a professional reply…', 'اكتب ردًا احترافيًا...')}
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
            </div>

            <div className="drawer-footer" style={{ flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button className="btn btn-ghost" onClick={() => setOpen(null)} style={{ flex: 1 }}>{t('Cancel', 'إلغاء')}</button>
                <button
                  className="btn btn-primary"
                  disabled={sendReply.isPending || !reply.trim()}
                  onClick={() => sendReply.mutate({ id: open.id, body: reply })}
                  style={{ flex: 2 }}
                >
                  {sendReply.isPending ? t('Sending…', 'جارٍ الإرسال...') : t('Post Reply', 'نشر الرد')}
                </button>
              </div>
              {open.status === 'active' && (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--text-3)' }}
                  disabled={closePost.isPending}
                  onClick={() => closePost.mutate(open.id)}>
                  ✕ {t('Close Post', 'إغلاق المنشور')}
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
