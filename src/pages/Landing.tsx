import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang, useT } from '../store/lang'
import {
  IcoDashboard, IcoBed, IcoWrench, IcoCalendar,
  IcoHeart, IcoFlag, IcoChart, IcoBuilding, IcoCommunity,
  IcoShield, IcoGlobe, IcoHospital, IcoSmartphone, IcoDownload,
} from '../components/Icon'

const FEATURES = [
  {
    Icon: IcoBuilding,
    titleEn: 'Hospital Management',
    titleAr: 'إدارة المستشفيات',
    descEn: 'Full visibility into hospital status, staff, equipment, and real-time capacity across the country.',
    descAr: 'رؤية كاملة لحالة المستشفيات والكوادر والمعدات والطاقة الاستيعابية في الوقت الفعلي.',
  },
  {
    Icon: IcoBed,
    titleEn: 'Bed Availability',
    titleAr: 'توفر الأسرّة',
    descEn: 'Live tracking of bed occupancy across all wards and facilities nationwide.',
    descAr: 'تتبع مباشر لإشغال الأسرّة في جميع الأجنحة والمرافق على المستوى الوطني.',
  },
  {
    Icon: IcoWrench,
    titleEn: 'Maintenance & Equipment',
    titleAr: 'الصيانة والتجهيزات',
    descEn: 'Equipment requests matched with certified maintenance companies for fast response.',
    descAr: 'طلبات المعدات تُقابَل مع شركات الصيانة المعتمدة للاستجابة السريعة.',
  },
  {
    Icon: IcoCalendar,
    titleEn: 'Appointment System',
    titleAr: 'نظام المواعيد',
    descEn: 'Centralized scheduling and appointment management for all connected facilities.',
    descAr: 'جدولة مركزية وإدارة المواعيد لجميع المرافق المتصلة.',
  },
  {
    Icon: IcoHeart,
    titleEn: 'Blood Donations',
    titleAr: 'التبرع بالدم',
    descEn: 'National donor registry connecting citizens with hospitals in urgent need.',
    descAr: 'سجل وطني للمتبرعين يربط المواطنين بالمستشفيات في حالات الاستعجال.',
  },
  {
    Icon: IcoCommunity,
    titleEn: 'Nafas Community',
    titleAr: 'مجتمع نَفَس',
    descEn: 'Ask doctors directly and join specialty medical forums for peer support.',
    descAr: 'اطرح أسئلتك على الأطباء مباشرةً وانضم إلى منتديات طبية متخصصة.',
  },
]

const STATS = [
  { n: '15+',  en: 'Hospitals',    ar: 'مستشفى'      },
  { n: '6.9k', en: 'Beds Tracked', ar: 'سرير مُتابَع' },
  { n: '200+', en: 'Companies',    ar: 'شركة معتمدة'  },
  { n: '100%', en: 'Secure',       ar: 'آمن تماماً'   },
]

const WHO = [
  {
    Icon: IcoChart,
    titleEn: 'National Administrators',
    titleAr: 'المسؤولون الوطنيون',
    descEn: 'Full-platform oversight — manage hospitals, companies, users, reports, and platform-wide settings from one place.',
    descAr: 'إشراف على كامل المنصة — إدارة المستشفيات والشركات والمستخدمين والتقارير من مكان واحد.',
    dark: true,
  },
  {
    Icon: IcoBuilding,
    titleEn: 'Hospital Administrators',
    titleAr: 'مسؤولو المستشفيات',
    descEn: 'Manage beds, staff, appointments, equipment needs, donations, and community questions.',
    descAr: 'إدارة الأسرّة والكوادر والمواعيد واحتياجات المعدات والتبرعات وأسئلة المجتمع.',
    dark: false,
  },
  {
    Icon: IcoWrench,
    titleEn: 'Maintenance Companies',
    titleAr: 'شركات الصيانة',
    descEn: 'Browse hospital equipment requests, submit competitive offers, manage contracts and service history.',
    descAr: 'تصفح طلبات معدات المستشفيات وتقديم العروض التنافسية وإدارة العقود وسجل الخدمة.',
    dark: false,
  },
]

const APP_FEATURES = [
  { Icon: IcoCalendar,  en: 'Book Appointments',      ar: 'حجز المواعيد'          },
  { Icon: IcoHeart,     en: 'Blood Donation',          ar: 'التبرع بالدم'           },
  { Icon: IcoCommunity, en: 'Nafas Community',         ar: 'مجتمع نَفَس'            },
  { Icon: IcoHospital,  en: 'Browse Hospitals',       ar: 'تصفح المستشفيات'       },
]

export default function Landing() {
  const { lang, toggle } = useLang()
  const t = useT()
  const nav = useNavigate()
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const featuresRef = useRef<HTMLElement>(null)
  const mobileRef = useRef<HTMLElement>(null)

  const ff = lang === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif"

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div dir={dir} style={{ fontFamily: ff, background: '#fff', color: 'var(--text)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 clamp(20px, 5vw, 80px)',
        display: 'flex', alignItems: 'center', height: 62, gap: 20,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="NAFAS" style={{ height: 38, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ flex: 1 }} />

        {/* About link */}
        <button onClick={() => nav('/about')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: 'var(--text-2)',
          padding: '6px 12px', borderRadius: 8,
        }}>
          {t('About', 'حول المشروع')}
        </button>

        {/* Lang toggle */}
        <button onClick={toggle} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 13px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'transparent',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
        }}>
          <span style={{ color: 'var(--text-3)' }}><IcoGlobe size={13} /></span>
          {lang === 'en' ? 'العربية' : 'English'}
        </button>

        {/* CTA */}
        <button onClick={() => nav('/login')} style={{
          padding: '7px 18px', borderRadius: 8,
          border: 'none', background: 'var(--accent)',
          cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {t('Admin Portal', 'بوابة الإدارة')}
          <span style={{ fontSize: 15 }}>{lang === 'ar' ? '←' : '→'}</span>
        </button>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 62px)',
        background: 'var(--ink)',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid overlay */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, opacity: 0.035,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Glow */}
        <div aria-hidden style={{
          position: 'absolute',
          top: '15%', [lang === 'ar' ? 'left' : 'right']: '0',
          width: 600, height: 600,
          background: 'radial-gradient(circle at 50% 50%, rgba(234,88,12,0.16) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Second glow */}
        <div aria-hidden style={{
          position: 'absolute', bottom: '-10%',
          [lang === 'ar' ? 'right' : 'left']: '10%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 760, position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 99,
            border: '1px solid rgba(234,88,12,0.35)',
            background: 'rgba(234,88,12,0.07)',
            marginBottom: 30,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ea580c', letterSpacing: lang === 'en' ? '0.4px' : 0 }}>
              {lang === 'ar' ? 'منصة الرعاية الصحية الوطنية · الجزائر' : "Algeria's National Healthcare Platform"}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 76px)',
            fontWeight: 900, color: '#fff',
            lineHeight: 1.07, letterSpacing: -2.5,
            margin: '0 0 22px',
            fontFamily: ff,
          }}>
            {lang === 'ar' ? (
              <>
                إدارة الرعاية<br />
                <span style={{ color: 'var(--accent)' }}>الصحية بذكاء</span><br />
                على المستوى الوطني
              </>
            ) : (
              <>
                Smart Healthcare<br />
                <span style={{ color: 'var(--accent)' }}>Management</span><br />
                at National Scale
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            color: 'rgba(255,255,255,0.48)',
            lineHeight: 1.75, maxWidth: 580, margin: '0 0 44px',
            fontFamily: ff,
          }}>
            {lang === 'ar'
              ? 'منصة موحّدة تربط المستشفيات وشركات الصيانة والمسؤولين الصحيين الوطنيين لتبسيط عمليات الرعاية الصحية في الجزائر.'
              : "A unified platform connecting Algeria's hospitals, maintenance companies, and national health administrators to streamline healthcare operations."}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => scrollTo(featuresRef)}
              style={{
                padding: '13px 30px', borderRadius: 9,
                border: 'none', background: 'var(--accent)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', letterSpacing: 0.2,
              }}>
              {t('Explore Features', 'استكشاف الميزات')}
            </button>
            <button
              onClick={() => nav('/login')}
              style={{
                padding: '13px 30px', borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.82)', fontWeight: 600, fontSize: 14,
                cursor: 'pointer',
              }}>
              {t('Sign In', 'تسجيل الدخول')}
            </button>
            <button
              onClick={() => scrollTo(mobileRef)}
              style={{
                padding: '13px 20px', borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.09)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.48)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
              }}>
              <IcoSmartphone size={14} />
              {t('Mobile App', 'تطبيق الجوال')}
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: clamp('28px', '4vw', '44px'), marginTop: 60,
            paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.07)',
            flexWrap: 'wrap',
          }}>
            {STATS.map(s => (
              <div key={s.n}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>{lang === 'ar' ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section ref={featuresRef} style={{ padding: 'clamp(72px, 9vw, 110px) clamp(20px, 5vw, 80px)', background: '#f8f8f7' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '2.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>
            {t('PLATFORM CAPABILITIES', 'قدرات المنصة')}
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: -1.5, margin: '0 0 14px', color: 'var(--text)', fontFamily: ff }}>
            {lang === 'ar' ? 'كل ما تحتاجه لإدارة الرعاية الصحية' : 'Everything You Need to Manage Healthcare'}
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
            {lang === 'ar' ? 'أدوات مُصمَّمة خصيصاً لكل دور في منظومة الرعاية الصحية.' : 'Purpose-built tools for every role in the healthcare ecosystem.'}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 18, maxWidth: 1120, margin: '0 auto',
        }}>
          {FEATURES.map(({ Icon, titleEn, titleAr, descEn, descAr }) => (
            <div
              key={titleEn}
              style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 14, padding: '26px 24px',
                transition: 'box-shadow 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.07)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--accent-light)', display: 'grid', placeItems: 'center', marginBottom: 18, color: 'var(--accent)' }}>
                <Icon size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{lang === 'ar' ? titleAr : titleEn}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.68 }}>{lang === 'ar' ? descAr : descEn}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────── */}
      <section style={{ padding: 'clamp(72px, 9vw, 110px) clamp(20px, 5vw, 80px)', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '2.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>
            {t("WHO IT'S FOR", 'لمن هذه المنصة')}
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: -1.5, margin: 0, color: 'var(--text)', fontFamily: ff }}>
            {lang === 'ar' ? 'مُصمَّمة لمحترفي الرعاية الصحية' : 'Built for Healthcare Professionals'}
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 18, maxWidth: 1020, margin: '0 auto',
        }}>
          {WHO.map(({ Icon, titleEn, titleAr, descEn, descAr, dark }) => (
            <div
              key={titleEn}
              style={{
                border: dark ? 'none' : '1px solid var(--border)',
                borderRadius: 16, padding: '34px 30px',
                background: dark ? 'var(--ink)' : '#fff',
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: dark ? 'rgba(234,88,12,0.18)' : 'var(--accent-light)',
                display: 'grid', placeItems: 'center', marginBottom: 22,
                color: 'var(--accent)',
              }}>
                <Icon size={22} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: dark ? '#fff' : 'var(--text)' }}>
                {lang === 'ar' ? titleAr : titleEn}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.68, color: dark ? 'rgba(255,255,255,0.48)' : 'var(--text-3)' }}>
                {lang === 'ar' ? descAr : descEn}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MOBILE APP ──────────────────────────────────────── */}
      <section ref={mobileRef} style={{
        padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 80px)',
        background: '#0d0d0b',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute',
          top: '40%', ...(lang === 'ar' ? { right: '5%' } : { left: '5%' }),
          transform: 'translateY(-50%)',
          width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(234,88,12,0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden style={{
          position: 'absolute',
          bottom: 0, ...(lang === 'ar' ? { left: '15%' } : { right: '15%' }),
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          gap: 'clamp(40px, 7vw, 90px)',
          flexWrap: 'wrap',
          flexDirection: lang === 'ar' ? 'row-reverse' : 'row',
          position: 'relative', zIndex: 1,
        }}>

          {/* ── Text side ── */}
          <div style={{ flex: '1 1 380px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 99,
              border: '1px solid rgba(234,88,12,0.35)',
              background: 'rgba(234,88,12,0.08)',
              marginBottom: 28,
            }}>
              <IcoSmartphone size={12} style={{ color: '#ea580c' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {lang === 'ar' ? 'تطبيق الجوال' : 'Mobile App'}
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              fontWeight: 900, color: '#fff',
              lineHeight: 1.08, letterSpacing: -2,
              margin: '0 0 20px', fontFamily: ff,
            }}>
              {lang === 'ar'
                ? <>{lang === 'ar' ? 'نَفَس' : 'NAFAS'}<br /><span style={{ color: 'var(--accent)' }}>{lang === 'ar' ? 'في جيبك' : 'in Your Pocket'}</span></>
                : <>NAFAS<br /><span style={{ color: 'var(--accent)' }}>in Your Pocket</span></>}
            </h2>

            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.78, margin: '0 0 36px', maxWidth: 420, fontFamily: ff,
            }}>
              {lang === 'ar'
                ? 'وصّل المواطنين بالمنظومة الصحية — احجز مواعيدك، تبرّع بالدم، تابع احتياجات المستشفيات، وتفاعل مع مجتمع نَفَس الطبي من هاتفك.'
                : "Connecting citizens to Algeria's healthcare ecosystem — book appointments, donate blood, track hospital needs, and connect with the Nafas medical community, all from your phone."}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 40 }}>
              {APP_FEATURES.map(f => (
                <div key={f.en} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 13px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--accent)',
                }}>
                  <f.Icon size={12} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', fontFamily: ff }}>
                    {lang === 'ar' ? f.ar : f.en}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: lang === 'ar' ? 'flex-end' : 'flex-start', gap: 12 }}>
              <a
                href="/nafas.apk"
                download="NAFAS.apk"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '15px 30px', borderRadius: 13,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  textDecoration: 'none', color: '#fff',
                  fontWeight: 700, fontSize: 15, fontFamily: ff,
                  boxShadow: '0 8px 32px rgba(234,88,12,0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 14px 40px rgba(234,88,12,0.55)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = ''
                  el.style.boxShadow = '0 8px 32px rgba(234,88,12,0.4)'
                }}
              >
                <IcoDownload size={18} />
                {lang === 'ar' ? 'تحميل لأندرويد' : 'Download for Android'}
              </a>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>
                {lang === 'ar' ? 'أندرويد 8.0+  ·  26.9 MB' : 'Android 8.0+  ·  v1.0  ·  26.9 MB'}
              </span>
            </div>
          </div>

          {/* ── Phone mockup ── */}
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div aria-hidden style={{
              position: 'absolute', inset: -40,
              background: 'radial-gradient(ellipse, rgba(234,88,12,0.13) 0%, transparent 65%)',
              filter: 'blur(18px)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: 232, height: 476,
              background: 'linear-gradient(175deg, #1e1e1b 0%, #111110 60%, #0e0e0c 100%)',
              borderRadius: 44,
              border: '1.5px solid rgba(255,255,255,0.1)',
              padding: '0 0 20px',
              boxShadow: '0 70px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Buttons */}
              <div aria-hidden style={{ position: 'absolute', right: -2, top: 110, width: 3, height: 50, background: 'rgba(255,255,255,0.1)', borderRadius: '0 3px 3px 0' }} />
              <div aria-hidden style={{ position: 'absolute', left: -2, top: 100, width: 3, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: '3px 0 0 3px' }} />
              <div aria-hidden style={{ position: 'absolute', left: -2, top: 142, width: 3, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: '3px 0 0 3px' }} />
              {/* Status bar */}
              <div style={{
                height: 44, background: 'rgba(0,0,0,0.25)',
                display: 'flex', alignItems: 'flex-end',
                padding: '0 18px 8px', justifyContent: 'space-between',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 88, height: 22, background: '#0a0a09', borderRadius: 13 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', zIndex: 1 }}>9:41</span>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                    {[4, 6, 8, 10].map((h, i) => (
                      <div key={i} style={{ width: 2.5, height: h, background: i >= 2 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)', borderRadius: 1 }} />
                    ))}
                  </div>
                  <div style={{ marginLeft: 3, width: 16, height: 9, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.35)', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 1px' }}>
                    <div style={{ width: '70%', height: '80%', background: 'rgba(74,222,128,0.85)', borderRadius: 1.5 }} />
                    <div style={{ position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)', width: 2, height: 5, background: 'rgba(255,255,255,0.22)', borderRadius: 1 }} />
                  </div>
                </div>
              </div>
              {/* Screen */}
              <div style={{ flex: 1, padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'grid', placeItems: 'center' }}>
                      <span style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>N</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>NAFAS</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{lang === 'ar' ? 'الرعاية الصحية' : 'Healthcare'}</div>
                    </div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 99, background: 'rgba(255,255,255,0.07)', display: 'grid', placeItems: 'center' }}>
                    <div style={{ width: 7, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.3)' }} />
                  </div>
                </div>
                <div style={{
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(234,88,12,0.22) 0%, rgba(234,88,12,0.07) 100%)',
                  border: '1px solid rgba(234,88,12,0.18)',
                  padding: '11px 13px',
                }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{lang === 'ar' ? 'مرحباً بك' : 'Welcome back'}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{lang === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}</div>
                </div>
                {APP_FEATURES.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.055)',
                    color: '#ea580c',
                  }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(234,88,12,0.14)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <f.Icon size={12} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{lang === 'ar' ? f.ar : f.en}</div>
                      <div style={{ width: `${50 + i * 12}%`, height: 2.5, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginTop: 3 }} />
                    </div>
                    <div style={{ width: 5, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
                  </div>
                ))}
              </div>
              {/* Home indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
                <div style={{ width: 88, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW TO GET ACCESS ─────────────────────────────── */}
      <section style={{
        padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 80px)',
        background: 'var(--ink)', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div aria-hidden style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 3, background: 'var(--accent)', borderRadius: '0 0 3px 3px' }} />
        {/* Glow */}
        <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(234,88,12,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 580, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 14,
            background: 'rgba(234,88,12,0.12)',
            border: '1px solid rgba(234,88,12,0.25)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 28px',
            color: 'var(--accent)',
          }}>
            <IcoShield size={28} />
          </div>

          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: -1.5, margin: '0 0 18px', fontFamily: ff }}>
            {lang === 'ar' ? 'كيف تحصل على الوصول؟' : 'How to Get Access?'}
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: 15, lineHeight: 1.75, margin: '0 0 14px' }}>
            {lang === 'ar'
              ? 'منصة نَفَس متاحة حصرياً للمؤسسات الصحية المرخّصة وشركات الصيانة المعتمدة العاملة في الجزائر.'
              : 'NAFAS is available exclusively to licensed healthcare institutions and certified maintenance companies operating in Algeria.'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13.5, lineHeight: 1.75, margin: '0 0 40px' }}>
            {lang === 'ar'
              ? 'للحصول على الوصول إلى المنصة، تواصل مباشرةً مع المسؤول الوطني الذي سيُزوّدك بمعلومات حسابك.'
              : 'To request access, reach out directly to the national administrator who will provide you with your account credentials.'}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => nav('/login')}
              style={{
                padding: '13px 30px', borderRadius: 9,
                border: 'none', background: 'var(--accent)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>
              {t('Sign In to Portal', 'الدخول إلى البوابة')}
            </button>
            <a
              href="mailto:admin@nafas.dz"
              style={{
                padding: '13px 30px', borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
              }}>
              {t('Contact Administrator', 'تواصل مع المسؤول')}
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{
        padding: '22px clamp(20px, 5vw, 80px)',
        background: '#050504',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 12 }}>N</div>
          <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>NAFAS</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            {lang === 'ar' ? 'منصة الرعاية الصحية الوطنية للجزائر' : "Algeria's National Healthcare Platform"}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={toggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <IcoGlobe size={12} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026</span>
        </div>
      </footer>
    </div>
  )
}

// Helper to clamp CSS values (used inline for gap)
function clamp(_min: string, _val: string, _max: string) {
  return `clamp(${_min}, ${_val}, ${_max})`
}
