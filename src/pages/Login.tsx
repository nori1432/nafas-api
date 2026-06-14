import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useLang, useT } from '../store/lang'
import { IcoGlobe } from '../components/Icon'

interface DemoAccount {
  labelEn: string; labelAr: string
  subEn: string; subAr: string
  phone: string; password: string
  roleKey: string
  accentColor: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    labelEn: 'National Admin',   labelAr: 'المسؤول الوطني',
    subEn: 'Full platform control', subAr: 'تحكم كامل بالمنصة',
    phone: '0555000000', password: 'Admin@2025', roleKey: 'Admin',
    accentColor: '#c0392b',
  },
  {
    labelEn: 'CHU Mustapha',     labelAr: 'مستشفى مصطفى باشا',
    subEn: 'Hospital Admin · Algiers', subAr: 'مسؤول مستشفى · الجزائر',
    phone: '0560100001', password: 'HospAdmin@2025', roleKey: 'Hospital',
    accentColor: '#1e40af',
  },
  {
    labelEn: 'CHU Ibn Rochd',    labelAr: 'مستشفى ابن رشد',
    subEn: 'Hospital Admin · Oran', subAr: 'مسؤول مستشفى · وهران',
    phone: '0560100002', password: 'HospAdmin@2025', roleKey: 'Hospital',
    accentColor: '#1e40af',
  },
  {
    labelEn: 'ElecTech Services', labelAr: 'إليك تك سيرفيسز',
    subEn: 'Maintenance Company', subAr: 'شركة صيانة',
    phone: '0570200001', password: 'Company@2025', roleKey: 'Company',
    accentColor: '#065f46',
  },
  {
    labelEn: 'MedEquip Algeria', labelAr: 'ميد إيكيب الجزائر',
    subEn: 'Maintenance Company', subAr: 'شركة صيانة',
    phone: '0570200002', password: 'Company@2025', roleKey: 'Company',
    accentColor: '#065f46',
  },
]

const ROLE_BADGE: Record<string, { bg: string; color: string; en: string; ar: string }> = {
  Admin:    { bg: '#fef2f2', color: '#c0392b', en: 'Admin',    ar: 'مسؤول' },
  Hospital: { bg: '#eff6ff', color: '#1e40af', en: 'Hospital', ar: 'مستشفى' },
  Company:  { bg: '#f0fdf4', color: '#16a34a', en: 'Company',  ar: 'شركة' },
}

const ALLOWED_ROLES = ['national_admin', 'hospital_admin', 'maintenance_company']

export default function Login() {
  const [phone, setPhone] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { user, setSession } = useAuth()
  const { lang, toggle } = useLang()
  const t = useT()

  if (user) return <Navigate to="/dashboard" replace />

  async function doLogin(p: string, w: string) {
    setErr(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { phone_number: p, password: w })
      if (!data.success) throw new Error(data.message)
      const u = data.data.user
      if (!ALLOWED_ROLES.includes(u.role)) {
        throw new Error(t(
          'This portal is restricted to administrators and companies.',
          'هذه البوابة مخصصة للمسؤولين والشركات فقط.'
        ))
      }
      setSession(u, data.data.access_token)
      nav('/dashboard')
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message || t('Login failed', 'فشل تسجيل الدخول'))
    } finally { setLoading(false) }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    doLogin(phone, pwd)
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <div className="login-shell" dir={dir}>
      {/* Back to home */}
      <button
        onClick={() => nav('/')}
        style={{
          position: 'absolute', top: 20, [dir === 'rtl' ? 'right' : 'left']: 24, zIndex: 10,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.65)', borderRadius: 'var(--radius)', padding: '6px 12px',
          cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex',
          alignItems: 'center', gap: 5,
        }}
      >
        <span style={{ fontSize: 14 }}>{dir === 'rtl' ? '→' : '←'}</span>
        {t('Home', 'الرئيسية')}
      </button>

      {/* Language toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'absolute', top: 20, [dir === 'rtl' ? 'left' : 'right']: 24, zIndex: 10,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', borderRadius: 'var(--radius)', padding: '6px 12px',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex',
          alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)',
        }}
      >
        <IcoGlobe size={13} />
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="login-layout">
        {/* ── LEFT: Branding ─────────────────────────────── */}
        <div className="login-brand">
          <div className="login-brand-logo">
            <div className="login-brand-mark">N</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, fontFamily: "'Cairo', sans-serif" }}>
                NAFAS
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                {t('Admin Portal', 'بوابة الإدارة')}
              </div>
            </div>
          </div>

          <h1 className="login-headline">
            {lang === 'ar'
              ? <>منصة الرعاية الصحية<br />الوطنية للجزائر</>
              : <>National Healthcare<br />Platform of Algeria</>}
          </h1>
          <p className="login-subtext">
            {t(
              'Manage hospitals, maintenance companies, bed availability, community questions and donations from a single unified platform.',
              'إدارة المستشفيات وشركات الصيانة وتوافر الأسرّة وأسئلة المجتمع والتبرعات من منصة موحّدة.'
            )}
          </p>

          <div className="login-stats">
            {[
              { n: '1,200+', en: 'Hospitals',     ar: 'مستشفى'     },
              { n: '80k+',   en: 'Beds tracked',  ar: 'سرير مُتابَع' },
              { n: '200+',   en: 'Companies',      ar: 'شركة صيانة'  },
            ].map((s) => (
              <div key={s.n} className="login-stat">
                <div className="login-stat-value">{s.n}</div>
                <div className="login-stat-label">{lang === 'ar' ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Login form ───────────────────────────── */}
        <div className="login-form-panel">
          <div style={{ marginBottom: 28 }}>
            <h2 className="login-form-title">
              {t('Sign in to your account', 'تسجيل الدخول إلى حسابك')}
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>
              {t(
                'Enter your credentials or use a demo account below.',
                'أدخل بيانات الاعتماد أو اختر حسابًا تجريبيًا أدناه.'
              )}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div className="field">
              <span>{t('Phone number', 'رقم الهاتف')}</span>
              <input
                className="input"
                placeholder="0555 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="field">
              <span>{t('Password', 'كلمة المرور')}</span>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>
            {err && <div className="err">{err}</div>}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15, fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? t('Signing in...', 'جارٍ تسجيل الدخول...') : t('Sign in', 'تسجيل الدخول')}
            </button>
          </form>

          <div className="login-divider">
            <span>{t('Demo accounts', 'حسابات تجريبية')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const badge = ROLE_BADGE[acc.roleKey]
              return (
                <button
                  key={acc.phone}
                  type="button"
                  disabled={loading}
                  onClick={() => { setPhone(acc.phone); setPwd(acc.password); doLogin(acc.phone, acc.password) }}
                  className="demo-account-btn"
                >
                  <div className="demo-account-icon" style={{ background: acc.accentColor }}>
                    {(lang === 'ar' ? acc.labelAr : acc.labelEn)[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: lang === 'ar' ? 'right' : 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                      {lang === 'ar' ? acc.labelAr : acc.labelEn}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {acc.phone} &middot; {lang === 'ar' ? acc.subAr : acc.subEn}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                    background: badge.bg, color: badge.color, flexShrink: 0,
                  }}>
                    {lang === 'ar' ? badge.ar : badge.en}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


