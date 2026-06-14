/**
 * Public subscription page for hospitals and maintenance companies.
 * No authentication required — accessible at /subscribe.
 */
import { useState } from 'react'
import { api } from '../lib/api'

type OrgType = 'hospital' | 'maintenance_company'

interface FormData {
  org_type: OrgType
  org_name: string
  wilaya: string
  address: string
  contact_name: string
  contact_phone: string
  contact_email: string
  website: string
  description: string
  agreed: boolean
}

const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار',
  'البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر',
  'الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة',
  'قسنطينة','المدية','مستغانم','مسيلة','معسكر','ورقلة','وهران','البيض',
  'إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي',
  'خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت',
  'غرداية','غليزان','تيميمون','برج باجي مختار','أولاد جلال','بني عباس',
  'عين صالح','عين قزام','تقرت','جانت','المغير','المنيعة',
]

const EMPTY: FormData = {
  org_type: 'hospital',
  org_name: '',
  wilaya: '',
  address: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  website: '',
  description: '',
  agreed: false,
}

export default function Subscribe() {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState('')

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.org_name.trim()) e.org_name = 'الاسم مطلوب'
    if (!form.wilaya) e.wilaya = 'الولاية مطلوبة'
    if (!form.address.trim()) e.address = 'العنوان مطلوب'
    if (!form.contact_name.trim()) e.contact_name = 'اسم المسؤول مطلوب'
    if (!/^0[567]\d{8}$/.test(form.contact_phone.trim()))
      e.contact_phone = 'رقم الهاتف غير صحيح'
    if (form.contact_email && !/\S+@\S+\.\S+/.test(form.contact_email))
      e.contact_email = 'البريد الإلكتروني غير صحيح'
    if (!form.agreed) e.agreed = 'يجب الموافقة على الشروط'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await api.post('/subscriptions/request', {
        org_type: form.org_type,
        org_name: form.org_name.trim(),
        wilaya: form.wilaya,
        address: form.address.trim(),
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
        contact_email: form.contact_email.trim() || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
      })
      setStep('success')
    } catch (e: any) {
      setServerError(
        e.response?.data?.message ||
          'حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={{ ...styles.cardTitle, textAlign: 'center' }}>
            تم إرسال طلبكم بنجاح
          </h2>
          <p style={{ color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 1.7 }}>
            سيتواصل معكم فريق نَفَس خلال <strong>2–5 أيام عمل</strong> لاستكمال
            إجراءات الانضمام إلى المنصة الوطنية للرعاية الصحية.
          </p>
          <button
            style={{ ...styles.btn, marginTop: 32, width: '100%' }}
            onClick={() => { setForm(EMPTY); setStep('form') }}
          >
            تقديم طلب آخر
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.shell} dir="rtl">
      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div style={styles.hero}>
        <img src="/logo.png" alt="NAFAS" style={styles.heroLogo} />
        <h1 style={styles.heroTitle}>انضم إلى منصة نَفَس الصحية</h1>
        <p style={styles.heroSub}>
          منصة وطنية جزائرية لربط المستشفيات وشركات الصيانة بالمرضى وأصحاب القرار
        </p>
        {/* Feature badges */}
        <div style={styles.badges}>
          {['إدارة الأسرّة والمرافق', 'إشعارات فورية للمرضى', 'لوحة تحكم متكاملة',
            'إدارة الكوادر الطبية', 'دعم فني مستمر'].map((b) => (
            <span key={b} style={styles.badge}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── Form card ────────────────────────────────────────────────── */}
      <div style={styles.formWrap}>
        <form style={styles.card} onSubmit={submit} noValidate>
          <h2 style={styles.cardTitle}>طلب الانضمام</h2>
          <p style={styles.cardSub}>يُرجى تعبئة البيانات التالية بدقة لمعالجة طلبكم</p>

          {/* Org type toggle */}
          <div style={{ marginBottom: 24 }}>
            <label style={styles.fieldLabel}>نوع الجهة</label>
            <div style={styles.toggle}>
              {([
                ['hospital', '🏥  مستشفى / مركز صحي'],
                ['maintenance_company', '🔧  شركة صيانة طبية'],
              ] as [OrgType, string][]).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  style={{
                    ...styles.toggleBtn,
                    ...(form.org_type === val ? styles.toggleActive : {}),
                  }}
                  onClick={() => set('org_type', val)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Row: org name + wilaya */}
          <div style={styles.row}>
            <Field label="اسم الجهة *" error={errors.org_name}>
              <input
                style={inp(!!errors.org_name)}
                value={form.org_name}
                onChange={(e) => set('org_name', e.target.value)}
                placeholder={form.org_type === 'hospital' ? 'مستشفى الوطني — باتنة' : 'شركة المعدات الطبية'}
              />
            </Field>
            <Field label="الولاية *" error={errors.wilaya}>
              <select
                style={inp(!!errors.wilaya)}
                value={form.wilaya}
                onChange={(e) => set('wilaya', e.target.value)}
              >
                <option value="">اختر الولاية</option>
                {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
          </div>

          {/* Address */}
          <Field label="العنوان الكامل *" error={errors.address}>
            <input
              style={inp(!!errors.address)}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="الشارع، الحي، المدينة"
            />
          </Field>

          <div style={styles.divider} />
          <p style={{ ...styles.cardSub, marginBottom: 16 }}>معلومات المسؤول عن الملف</p>

          {/* Row: contact name + phone */}
          <div style={styles.row}>
            <Field label="اسم المسؤول *" error={errors.contact_name}>
              <input
                style={inp(!!errors.contact_name)}
                value={form.contact_name}
                onChange={(e) => set('contact_name', e.target.value)}
                placeholder="الاسم الكامل"
              />
            </Field>
            <Field label="رقم الهاتف *" error={errors.contact_phone}>
              <input
                style={inp(!!errors.contact_phone)}
                value={form.contact_phone}
                onChange={(e) => set('contact_phone', e.target.value)}
                placeholder="0670000000"
                type="tel"
              />
            </Field>
          </div>

          {/* Row: email + website */}
          <div style={styles.row}>
            <Field label="البريد الإلكتروني" error={errors.contact_email}>
              <input
                style={inp(!!errors.contact_email)}
                value={form.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
                placeholder="exemple@hopital.dz"
                type="email"
              />
            </Field>
            <Field label="الموقع الإلكتروني" error={undefined}>
              <input
                style={inp(false)}
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://example.dz"
                type="url"
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="نبذة عن الجهة (اختياري)" error={undefined}>
            <textarea
              style={{ ...inp(false), minHeight: 90, resize: 'vertical' }}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="اذكر خدماتكم، طاقتكم الاستيعابية، أو أي معلومة مفيدة…"
            />
          </Field>

          {/* Agreement */}
          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={form.agreed}
              onChange={(e) => set('agreed', e.target.checked)}
              style={{ accentColor: '#F16722', width: 17, height: 17, cursor: 'pointer' }}
            />
            <span style={{ color: errors.agreed ? '#DC2626' : '#374151', fontSize: 14 }}>
              أوافق على شروط استخدام المنصة وسياسة الخصوصية
            </span>
          </label>
          {errors.agreed && <p style={styles.errText}>{errors.agreed}</p>}

          {serverError && (
            <div style={styles.serverErr}>{serverError}</div>
          )}

          <button style={{ ...styles.btn, width: '100%', marginTop: 8 }} type="submit" disabled={loading}>
            {loading ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
            لديكم حساب مسبق؟{' '}
            <a href="/login" style={{ color: '#F16722', fontWeight: 600 }}>تسجيل الدخول</a>
          </p>
        </form>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={styles.footer}>
        <p>© {new Date().getFullYear()} منصة نَفَس — الجمهورية الجزائرية الديمقراطية الشعبية</p>
      </div>
    </div>
  )
}

/* ── Field wrapper ──────────────────────────────────────────────────── */
function Field({
  label,
  error,
  children,
}: {
  label: string
  error: string | undefined
  children: React.ReactNode
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
      {error && <p style={styles.errText}>{error}</p>}
    </div>
  )
}

function inp(hasErr: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1.5px solid ${hasErr ? '#DC2626' : '#E5E7EB'}`,
    fontSize: 14,
    color: '#111',
    background: '#FAFAFA',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    background: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    background: 'linear-gradient(135deg, #F16722 0%, #D9541A 100%)',
    padding: '60px 24px 48px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroLogo: {
    height: 72,
    objectFit: 'contain',
    marginBottom: 20,
    filter: 'brightness(0) invert(1)',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 800,
    margin: '0 0 10px',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    maxWidth: 520,
    lineHeight: 1.7,
    margin: '0 0 24px',
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  badge: {
    background: 'rgba(255,255,255,0.18)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: '5px 14px',
    fontSize: 13,
    fontWeight: 500,
  },
  formWrap: {
    width: '100%',
    maxWidth: 760,
    padding: '32px 16px 0',
  },
  card: {
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    padding: '36px 32px',
    border: '1px solid #F3F4F6',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111',
    margin: '0 0 6px',
  },
  cardSub: {
    color: '#6B7280',
    fontSize: 14,
    margin: '0 0 24px',
  },
  divider: {
    borderTop: '1px solid #F3F4F6',
    margin: '24px 0 20px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  row: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap' as const,
  },
  toggle: {
    display: 'flex',
    borderRadius: 12,
    border: '1.5px solid #E5E7EB',
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    padding: '11px 16px',
    border: 'none',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    transition: 'background 0.15s, color 0.15s',
    fontFamily: 'inherit',
  },
  toggleActive: {
    background: '#FFF0E8',
    color: '#F16722',
    fontWeight: 700,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '18px 0 4px',
    cursor: 'pointer',
  },
  btn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#F16722',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    fontFamily: 'inherit',
  },
  serverErr: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 14,
    marginTop: 12,
  },
  errText: {
    color: '#DC2626',
    fontSize: 12,
    margin: '4px 0 0',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#DCFCE7',
    color: '#16A34A',
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontWeight: 700,
  },
  footer: {
    marginTop: 48,
    padding: '24px 16px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
}
