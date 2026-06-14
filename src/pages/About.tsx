/**
 * About / Project Overview — premium redesign
 * Exchange rate: 1 USD = 132.59 DZD  (XE.com, 16 May 2026)
 * Hosting prices: Hostinger.com live May 2026
 * Salaries: Algerian IT market 2026
 */
import { useLang } from '../store/lang'
import { useNavigate } from 'react-router-dom'
import {
  Globe, ArrowLeft, User, Code2, Shield, Server, Cloud, Building2,
  ChevronDown, ChevronUp, Wrench, HeartHandshake,
  BarChart3, CalendarCheck, Lock, Smartphone,
} from 'lucide-react'
import { useState, CSSProperties } from 'react'

const RATE = 132.59
const toD = (n: number) => (Math.round(n * RATE / 100) * 100).toLocaleString('fr-DZ')

/* ── helpers ──────────────────────────────────────────────────────── */
function Tag({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 12px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
      background: c + '18', color: c, border: `1px solid ${c}28`,
    }}>{children}</span>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10.5, fontWeight: 800, letterSpacing: '3px',
      textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 10px',
    }}>{children}</p>
  )
}

function GCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 24px rgba(0,0,0,0.05)',
      overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

/* ── collapsible budget row ───────────────────────────────────────── */
function Row({ icon: Icon, color, label, sub, low, high, unit, note }: {
  icon: React.ElementType; color: string; label: string; sub: string;
  low: string; high: string; unit: string; note: string;
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        background: open ? color + '08' : 'transparent',
        border: `1px solid ${open ? color + '28' : 'transparent'}`,
        borderRadius: 14, padding: '12px 14px',
        cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg,${color}20,${color}40)`,
          display: 'grid', placeItems: 'center', color,
        }}>
          <Icon size={17} />
        </div>
        <div style={{ flex: 1, textAlign: 'start' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{label}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>{sub}</div>
        </div>
        <div style={{ textAlign: 'end', marginInlineEnd: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color }}>{low} – {high}</div>
          <div style={{ fontSize: 11, color: '#bbb' }}>{unit}</div>
        </div>
        <span style={{ color: '#ccc', flexShrink: 0 }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <div style={{
          margin: '4px 0 8px 56px', padding: '12px 16px', borderRadius: 12,
          background: color + '0b', border: `1px solid ${color}20`,
          fontSize: 13, color: '#555', lineHeight: 1.8,
        }}>{note}</div>
      )}
    </div>
  )
}

/* ================================================================== */
export default function About() {
  const { lang, toggle } = useLang()
  const nav = useNavigate()
  const ar = lang === 'ar'
  const dir = ar ? 'rtl' : 'ltr'
  const ff = ar ? "'Cairo',sans-serif" : "'Inter',sans-serif"
  const t = (en: string, a: string) => ar ? a : en

  /* ── features ─────────────────────────────────────────────────── */
  const FEAT = [
    { icon: User,          color: '#6366f1', en: '6 User Roles',            ar: '6 أدوار', den: 'National admin · Hospital admin · Doctor · Patient · Donor · Maintenance co.', dar: 'مسؤول وطني · مستشفى · طبيب · مريض · متبرع · صيانة' },
    { icon: Building2,     color: '#0ea5e9', en: 'Hospital Network',        ar: 'شبكة المستشفيات', den: 'Beds, staff, equipment, needs, community questions and subscriptions per hospital.', dar: 'أسرة، موظفون، معدات، احتياجات، أسئلة المجتمع واشتراكات لكل مستشفى.' },
    { icon: CalendarCheck, color: '#10b981', en: 'Appointments',            ar: 'المواعيد', den: 'Specialty-based booking, doctor schedules, real-time slot availability.', dar: 'حجز بالتخصص وجداول الأطباء وتوفر الفترات في الوقت الفعلي.' },
    { icon: Wrench,        color: '#f59e0b', en: 'Maintenance Market',      ar: 'سوق الصيانة', den: 'Hospitals post needs. Companies bid. Admin approves contracts.', dar: 'المستشفيات تنشر احتياجاتها، الشركات تقدم عروضاً، الإداري يوافق.' },
    { icon: HeartHandshake,color: '#ef4444', en: 'Donations & Blood',       ar: 'تبرعات ودم', den: 'Citizens donate blood or supplies. Real-time matching with hospitals.', dar: 'تبرع بالدم أو المستلزمات مع توفيق فوري مع المستشفيات.' },
    { icon: BarChart3,     color: '#8b5cf6', en: 'National Analytics',      ar: 'تحليلات وطنية', den: 'Bed occupancy, appointment stats, community activity, subscriptions.', dar: 'إشغال الأسرة، إحصاءات المواعيد، نشاط المجتمع، الاشتراكات.' },
  ]

  /* ── tech stack ────────────────────────────────────────────────── */
  const STACK = [
    { icon: Server,     color: '#f59e0b', en: 'Flask REST API',   ar: 'Flask REST API',   den: 'Python · JWT auth · RBAC 6 roles · Alembic migrations · file upload',    dar: 'Python · JWT · RBAC 6 أدوار · Alembic · رفع ملفات' },
    { icon: Code2,      color: '#6366f1', en: 'Admin Dashboard',  ar: 'لوحة الإدارة',     den: 'React 18 · TypeScript · Vite · TanStack Query · Zustand · Recharts',      dar: 'React 18 · TypeScript · Vite · TanStack Query · Zustand' },
    { icon: Smartphone, color: '#10b981', en: 'Mobile App',       ar: 'التطبيق الجوال',   den: 'Flutter · iOS / Android / Web · JWT auth · same backend API',             dar: 'Flutter · iOS / Android / ويب · JWT · نفس الـ API' },
    { icon: Building2,  color: '#0ea5e9', en: 'MySQL Database',   ar: 'قاعدة MySQL',      den: '15+ relational tables · Aiven cloud or on-premises · daily backups',       dar: '15+ جدول علائقي · Aiven سحابة أو محلي · نسخ يومية' },
    { icon: Lock,       color: '#ef4444', en: 'Security Layer',   ar: 'طبقة الأمن',       den: 'bcrypt · CORS · HTTPS · input validation · OWASP-hardened API',            dar: 'bcrypt · CORS · HTTPS · التحقق من المدخلات · API مُعزَّز' },
    { icon: Cloud,      color: '#8b5cf6', en: 'Hosting',          ar: 'الاستضافة',        den: 'VPS (API) + Vercel CDN (admin) + Aiven MySQL + SSL + domain',             dar: 'VPS (API) + Vercel (إدارة) + Aiven MySQL + SSL + نطاق' },
  ]

  /* ── developer budget ─────────────────────────────────────────── */
  const DEV = [
    { icon: Code2,  color: '#6366f1', en: 'Junior Full-Stack Dev',     ar: 'مطور Full-Stack مبتدئ',     sub_en: '0–2 yrs · maintenance & new features',   sub_ar: '0–2 سنة · صيانة وميزات جديدة',        low: '60,000',  high: '90,000',  u_en: 'DZD / month', u_ar: 'دج / شهر', n_en: 'Algerian IT market 2026. Covers bug fixes, API updates, mobile patches. Rates based on emploitic.com and LinkedIn DZ.', n_ar: 'سوق تكنولوجيا المعلومات الجزائري 2026. يشمل إصلاح الأخطاء وتحديثات الـ API. استناداً لـ emploitic.com وLinkedIn الجزائر.' },
    { icon: Code2,  color: '#8b5cf6', en: 'Mid-Level Full-Stack Dev',  ar: 'مطور Full-Stack متوسط',     sub_en: '3–5 yrs · architecture & scaling',       sub_ar: '3–5 سنوات · بنية وتوسع',              low: '100,000', high: '160,000', u_en: 'DZD / month', u_ar: 'دج / شهر', n_en: 'Recommended for 50+ hospitals. Covers CI/CD, performance tuning, infrastructure decisions.',                          n_ar: 'موصى به لـ 50+ مستشفى. يشمل CI/CD وضبط الأداء وقرارات البنية.' },
  ]

  const CYBER = [
    { icon: Shield, color: '#f97316', en: 'Junior Cybersecurity Analyst',   ar: 'محلل أمن سيبراني مبتدئ', sub_en: 'Pen-testing · OWASP audits · log monitoring', sub_ar: 'اختبار اختراق · تدقيق OWASP · مراقبة', low: '80,000',  high: '130,000', u_en: 'DZD / month', u_ar: 'دج / شهر', n_en: 'Highly recommended — platform stores sensitive patient data. Covers OWASP Top 10, JWT hardening, incident response.', n_ar: 'موصى به بشدة — المنصة تخزن بيانات المرضى الحساسة. OWASP Top 10، تعزيز JWT، استجابة للحوادث.' },
    { icon: Shield, color: '#ef4444', en: 'Senior Cybersecurity Specialist', ar: 'متخصص أمن سيبراني أول', sub_en: 'Full arch · compliance · Algerian Law 18-07',  sub_ar: 'بنية كاملة · امتثال · القانون 18-07',  low: '150,000', high: '280,000', u_en: 'DZD / month', u_ar: 'دج / شهر', n_en: 'Required for government/CNAS integration. Ensures compliance with Algerian Law 18-07 on personal data protection.',   n_ar: 'مطلوب للتكامل الحكومي/CNAS. يضمن الامتثال للقانون الجزائري 18-07 لحماية البيانات.' },
  ]

  /* ── cloud hosting ─────────────────────────────────────────────── */
  const CLOUD = [
    { l_en: 'API Hosting — Hostinger VPS KVM 2', l_ar: 'استضافة API — Hostinger VPS KVM 2', d_en: '2 vCPU · 8 GB RAM · 100 GB NVMe  (live price)', d_ar: '2 vCPU · 8 GB RAM · 100 GB NVMe  (سعر حي)', usd: 8.99 },
    { l_en: 'MySQL — Aiven Startup',              l_ar: 'MySQL — Aiven Startup',              d_en: 'Managed · daily backups · SSL',                   d_ar: 'مُدار · نسخ يومية · SSL',                usd: 19 },
    { l_en: 'Admin Panel — Vercel Pro',            l_ar: 'لوحة الإدارة — Vercel Pro',          d_en: 'Global CDN · unlimited bandwidth',               d_ar: 'CDN عالمي · نطاق غير محدود',             usd: 20 },
    { l_en: 'Domain (.com / .dz)',                 l_ar: 'النطاق (.com / .dz)',                d_en: '1 year via Namecheap / CERIST',                  d_ar: 'سنة عبر Namecheap / CERIST',             usd: 1 },
    { l_en: 'SSL Certificate',                     l_ar: 'شهادة SSL',                         d_en: "Let's Encrypt — free (bundled)",                 d_ar: "Let's Encrypt — مجاناً (مدمجة)",         usd: 0 },
  ]
  const cloudTotal = CLOUD.reduce((s, i) => s + i.usd, 0)

  /* ── gov items ─────────────────────────────────────────────────── */
  const GOV = [
    { l_en: 'App Servers — Dell PowerEdge R750 × 2', l_ar: 'خادما التطبيق — Dell R750 × 2', d_en: '32 vCPU · 64 GB RAM · 1 TB NVMe + ~30% customs', d_ar: '32 vCPU · 64 GB RAM · 1 TB NVMe + ~30% جمارك', dzd: toD(6500*2*1.3),  once: true },
    { l_en: 'Database Server — Dell PowerEdge R650xs', l_ar: 'خادم DB — Dell R650xs',        d_en: '16 vCPU · 64 GB RAM · 2 TB RAID + customs',     d_ar: '16 vCPU · 64 GB RAM · 2 TB RAID + جمارك',    dzd: toD(5000*1.3),    once: true },
    { l_en: 'Backup Server + NAS (20 TB)',             l_ar: 'خادم احتياطي + NAS 20 TB',     d_en: 'Synology NAS or equiv. + customs',               d_ar: 'Synology أو ما يعادله + جمارك',              dzd: toD(3000*1.3),    once: true },
    { l_en: 'Network: Firewall + Switches + UPS 20KVA',l_ar: 'شبكة: جدار حماية + محولات + UPS', d_en: 'Fortinet/Cisco + L2/L3 + customs',           d_ar: 'Fortinet/Cisco + L2/L3 + جمارك',            dzd: toD(8000*1.3),    once: true },
    { l_en: 'OS + DB Enterprise Licenses',             l_ar: 'رخص نظام التشغيل + DB',       d_en: 'Ubuntu Pro + MySQL Enterprise — annual',         d_ar: 'Ubuntu Pro + MySQL Enterprise — سنوي',       dzd: toD(4000),        once: false },
    { l_en: 'Hardware Maintenance + Dell ProSupport',  l_ar: 'صيانة الأجهزة + ضمان Dell',   d_en: '~15% of hardware value / year',                  d_ar: '~15% من قيمة الأجهزة / سنة',                dzd: toD(3700),        once: false },
    { l_en: 'System Administrators × 2',              l_ar: 'مسؤولا النظام × 2',            d_en: '120,000 DZD/mo × 2 × 12 months',                d_ar: '120,000 دج/شهر × 2 × 12 شهراً',             dzd: (120000*2*12).toLocaleString('fr-DZ'), once: false },
  ]
  const govOnce   = GOV.filter(g =>  g.once).reduce((s,g)=>s+parseInt(g.dzd.replace(/\D/g,'')),0)
  const govYearly = GOV.filter(g => !g.once).reduce((s,g)=>s+parseInt(g.dzd.replace(/\D/g,'')),0)

  /* ================================================================ */
  return (
    <div dir={dir} style={{ fontFamily: ff, background: '#f4f4f2', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(22px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: '0 clamp(16px,5vw,64px)',
        display: 'flex', alignItems: 'center', height: 60, gap: 14,
      }}>
        <button onClick={() => nav('/')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: '#777', padding: '6px 10px', borderRadius: 8,
        }}>
          <ArrowLeft size={14} />{t('Back', 'رجوع')}
        </button>
        <img src="/logo.png" alt="NAFAS" style={{ height: 32 }} />
        <div style={{ flex: 1 }} />
        <button onClick={toggle} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.12)', background: 'transparent',
          cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#555',
        }}>
          <Globe size={13} />{ar ? 'English' : 'العربية'}
        </button>
      </nav>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: 'clamp(28px,5vw,60px) clamp(16px,4vw,32px) 80px' }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 24, overflow: 'hidden', marginBottom: 28,
          background: 'linear-gradient(140deg,#0d0d1a 0%,#1a1040 40%,#0d1629 100%)',
          padding: 'clamp(36px,5vw,64px) clamp(28px,5vw,60px)',
          position: 'relative',
        }}>
          {/* glow orbs */}
          <div aria-hidden style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
            <div style={{ position:'absolute',width:500,height:500,borderRadius:'50%',top:'-20%',right:'-8%',background:'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 65%)' }} />
            <div style={{ position:'absolute',width:350,height:350,borderRadius:'50%',bottom:'-30%',left:'5%',background:'radial-gradient(circle,rgba(234,88,12,0.14) 0%,transparent 65%)' }} />
            <div style={{ position:'absolute',width:250,height:250,borderRadius:'50%',top:'30%',left:'35%',background:'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 65%)' }} />
          </div>

          <div style={{ position:'relative', zIndex:1 }}>
            <Tag c="#ea580c">{t('Platform Overview', 'نظرة عامة على المنصة')}</Tag>

            <h1 style={{
              margin:'18px 0 10px', lineHeight:1.05,
              fontSize:'clamp(40px,6vw,72px)', fontWeight:900,
              letterSpacing:-2.5, color:'#fff',
            }}>
              <span style={{
                background:'linear-gradient(90deg,#fff 30%,#a5b4fc)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>نَفَس</span>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.4em', fontWeight:500, letterSpacing:0 }}> · </span>
              <span style={{
                background:'linear-gradient(90deg,#a5b4fc,#c4b5fd)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>NAFAS</span>
            </h1>

            <p style={{ fontSize:14, fontWeight:600, color:'#7c8fd4', margin:'0 0 18px', letterSpacing:0.3 }}>
              {t('National Health Administration & Facility Automation System','نظام الإدارة الوطنية للصحة وأتمتة المرافق')}
            </p>

            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14.5, lineHeight:1.85, maxWidth:580, margin:0 }}>
              {t(
                "A unified digital platform for Algeria's healthcare ecosystem — connecting national administrators, hospitals, maintenance companies, and citizens through one secure, role-based system.",
                'منصة رقمية موحّدة للمنظومة الصحية في الجزائر — تربط المسؤولين الوطنيين والمستشفيات وشركات الصيانة والمواطنين عبر نظام واحد آمن قائم على الأدوار.',
              )}
            </p>

            {/* stat chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:28 }}>
              {[
                { val:'6',  lbl: t('User Roles','أدوار'),        c:'#6366f1' },
                { val:'15+',lbl: t('DB Tables','جداول'),          c:'#0ea5e9' },
                { val:'3',  lbl: t('Platforms','منصات'),          c:'#10b981' },
                { val:'5',  lbl: t('Route Groups','مجموعات API'), c:'#f59e0b' },
              ].map(s => (
                <div key={s.val} style={{
                  padding:'8px 16px', borderRadius:12,
                  background:'rgba(255,255,255,0.07)',
                  border:'1px solid rgba(255,255,255,0.12)',
                  backdropFilter:'blur(8px)',
                }}>
                  <span style={{ fontWeight:900, fontSize:18, color:s.c }}>{s.val} </span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PROJECT LEADER ───────────────────────────────────── */}
        <GCard style={{ marginBottom:24, padding:'32px 28px' }}>
          <SLabel>{t('Project Leader','قائدة المشروع')}</SLabel>
          <div style={{ display:'flex', gap:22, flexWrap:'wrap', alignItems:'flex-start' }}>
            <div style={{
              width:74, height:74, borderRadius:20, flexShrink:0,
              background:'linear-gradient(135deg,#ea580c,#f97316,#fbbf24)',
              display:'grid', placeItems:'center', color:'#fff',
              boxShadow:'0 10px 30px rgba(234,88,12,0.3)',
            }}>
              <User size={32} strokeWidth={1.5} />
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontWeight:900, fontSize:23, color:'#111', marginBottom:4, letterSpacing:-0.5 }}>
                Benferhat Nour Alhouda Rosa
              </div>
              <div style={{ fontSize:14, color:'#666', marginBottom:12 }}>
                <span style={{ color:'#aaa' }}>{t('Speciality','التخصص')}: </span>
                <strong style={{ color:'#333' }}>Français Didactique — Master 02</strong>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <Tag c="#0ea5e9">{ar ? 'جامعة أبو القاسم سعد الله — الجزائر 2' : 'Abou El Kacem Saadallah Univ. — Algiers 2'}</Tag>
                <Tag c="#ea580c">{t('Project Initiator','مُطلِقة المشروع')}</Tag>
              </div>
            </div>
          </div>

          <div style={{
            marginTop:20, padding:'16px 20px', borderRadius:14,
            background:'linear-gradient(135deg,#fafaf8,#f2f2ef)',
            border:'1px solid #e5e5e0',
            fontSize:14, color:'#555', lineHeight:1.85,
          }}>
            {t(
              "This project was initiated and led as a graduation initiative within the Master's program. NAFAS addresses a genuine operational gap in Algeria's national healthcare infrastructure, proposing a digital-first solution that serves both public institutions and private healthcare providers.",
              'أُطلق هذا المشروع وقِيد في إطار مبادرة تخرج ضمن برنامج الماستر. يعالج نَفَس فجوةً تشغيليةً حقيقية في البنية التحتية الصحية الوطنية بالجزائر، ويقترح حلاً رقمياً أولياً يخدم المؤسسات العامة ومقدمي الرعاية الصحية الخاصة.',
            )}
          </div>
        </GCard>

        {/* ── FEATURES GRID ────────────────────────────────────── */}
        <GCard style={{ marginBottom:24 }}>
          <div style={{ padding:'28px 28px 20px' }}>
            <SLabel>{t('Platform Overview','نظرة عامة')}</SLabel>
            <h2 style={{ margin:'0 0 8px', fontSize:26, fontWeight:900, letterSpacing:-1, color:'#111' }}>
              {t('What is NAFAS?','ما هو نَفَس؟')}
            </h2>
            <p style={{ fontSize:14.5, color:'#777', lineHeight:1.8, margin:'0 0 24px', maxWidth:640 }}>
              {t(
                "NAFAS is a full-stack web and mobile platform built to digitalise Algeria's healthcare operations — replacing fragmented paper processes with a unified, real-time system.",
                'نَفَس منصة متكاملة للويب والجوال لرقمنة عمليات الرعاية الصحية في الجزائر — تستبدل العمليات الورقية المتفرقة بنظام رقمي موحّد في الوقت الفعلي.',
              )}
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', borderTop:'1px solid #f0f0ee' }}>
            {FEAT.map((f,i) => (
              <div key={f.en} style={{
                padding:'22px 22px',
                borderBottom:'1px solid #f0f0ee',
                borderRight: i%3!==2 ? '1px solid #f0f0ee' : 'none',
              }}>
                <div style={{
                  width:42, height:42, borderRadius:13, marginBottom:14,
                  background:`linear-gradient(135deg,${f.color}18,${f.color}38)`,
                  display:'grid', placeItems:'center', color:f.color,
                }}>
                  <f.icon size={18} />
                </div>
                <div style={{ fontWeight:700, fontSize:14, color:'#111', marginBottom:5 }}>{ar?f.ar:f.en}</div>
                <div style={{ fontSize:12.5, color:'#999', lineHeight:1.65 }}>{ar?f.dar:f.den}</div>
              </div>
            ))}
          </div>
        </GCard>

        {/* ── TECH STACK ───────────────────────────────────────── */}
        <GCard style={{ marginBottom:24, padding:'28px 24px' }}>
          <SLabel>{t('Technical Requirements','المتطلبات التقنية')}</SLabel>
          <h2 style={{ margin:'0 0 20px', fontSize:26, fontWeight:900, letterSpacing:-1, color:'#111' }}>
            {t('What Does It Need to Run?','ما الذي يحتاجه للعمل؟')}
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {STACK.map(s => (
              <div key={s.en} style={{
                display:'flex', alignItems:'center', gap:16,
                padding:'13px 16px', borderRadius:14,
                background:'#fafaf8', border:'1px solid #ebebea',
              }}>
                <div style={{
                  width:44, height:44, borderRadius:12, flexShrink:0,
                  background:`linear-gradient(135deg,${s.color}18,${s.color}38)`,
                  display:'grid', placeItems:'center', color:s.color,
                }}>
                  <s.icon size={19} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#222' }}>{ar?s.ar:s.en}</div>
                  <div style={{ fontSize:12.5, color:'#aaa', marginTop:2 }}>{ar?s.dar:s.den}</div>
                </div>
                <div style={{ width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0,opacity:0.6 }} />
              </div>
            ))}
          </div>
        </GCard>

        {/* ── DEV COST ─────────────────────────────────────────── */}
        <GCard style={{ marginBottom:24, padding:'28px 24px' }}>
          <SLabel>{t('Human Resources','الموارد البشرية')}</SLabel>
          <h2 style={{ margin:'0 0 6px', fontSize:26, fontWeight:900, letterSpacing:-1, color:'#111' }}>
            {t('Developer Cost','تكلفة المطور')}
          </h2>
          <p style={{ fontSize:13, color:'#bbb', margin:'0 0 18px' }}>
            {t('Algerian IT market 2026 — click any row for reasoning','سوق IT الجزائر 2026 — انقر لرؤية المبررات')}
          </p>
          {DEV.map(r=>(
            <Row key={r.en} icon={r.icon} color={r.color}
              label={ar?r.ar:r.en} sub={ar?r.sub_ar:r.sub_en}
              low={r.low} high={r.high} unit={ar?r.u_ar:r.u_en} note={ar?r.n_ar:r.n_en}/>
          ))}
          <div style={{
            marginTop:8, padding:'12px 16px', borderRadius:12,
            background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            border:'1px solid #bbf7d0', fontSize:13, color:'#166534',
          }}>
            💡 {t('For maintenance-only, a part-time contract dev at 40,000–60,000 DZD/mo may suffice.','للصيانة فقط، قد يكفي مطور بدوام جزئي بـ 40,000–60,000 دج/شهر.')}
          </div>
        </GCard>

        {/* ── CYBER COST ───────────────────────────────────────── */}
        <GCard style={{ marginBottom:24, padding:'28px 24px' }}>
          <SLabel>{t('Optional — Highly Recommended','اختياري — موصى به بشدة')}</SLabel>
          <h2 style={{ margin:'0 0 6px', fontSize:26, fontWeight:900, letterSpacing:-1, color:'#111' }}>
            {t('Cybersecurity Specialist','متخصص الأمن السيبراني')}
          </h2>
          <p style={{ fontSize:13, color:'#bbb', margin:'0 0 18px', lineHeight:1.6 }}>
            {t('The platform stores sensitive patient records. A dedicated security role is strongly advised.','المنصة تخزن سجلات المرضى الحساسة. يُنصح بشدة بتخصيص دور أمني مخصص.')}
          </p>
          {CYBER.map(r=>(
            <Row key={r.en} icon={r.icon} color={r.color}
              label={ar?r.ar:r.en} sub={ar?r.sub_ar:r.sub_en}
              low={r.low} high={r.high} unit={ar?r.u_ar:r.u_en} note={ar?r.n_ar:r.n_en}/>
          ))}
        </GCard>

        {/* ── OPTION A: CLOUD ──────────────────────────────────── */}
        <GCard style={{ marginBottom:24, borderTop:'3px solid #10b981' }}>
          <div style={{ padding:'28px 24px 12px' }}>
            <SLabel>{t('Option A · Clinics & Private Hospitals','الخيار أ · عيادات ومستشفيات خاصة')}</SLabel>
            <h2 style={{ margin:'0 0 6px', fontSize:26, fontWeight:900, letterSpacing:-1, color:'#065f46' }}>
              {t('Cloud Hosting — SaaS Model','استضافة سحابية — نموذج SaaS')}
            </h2>
            <p style={{ fontSize:13, color:'#bbb', margin:'0 0 20px', lineHeight:1.6 }}>
              {t('Launch as an independent SaaS sold to clinics. All prices live May 2026.','إطلاق كمنتج SaaS مستقل يُباع للعيادات. أسعار حية مايو 2026.')}
            </p>
          </div>

          <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:6 }}>
            {CLOUD.map(item=>(
              <div key={item.l_en} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'12px 16px', borderRadius:12,
                background:'#f9f9f7', border:'1px solid #eee',
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13.5, color:'#222' }}>{ar?item.l_ar:item.l_en}</div>
                  <div style={{ fontSize:12, color:'#bbb', marginTop:2 }}>{ar?item.d_ar:item.d_en}</div>
                </div>
                {item.usd===0
                  ? <span style={{ fontWeight:800, fontSize:14, color:'#10b981' }}>{t('Free','مجاناً')}</span>
                  : (
                    <div style={{ textAlign:'end' }}>
                      <div style={{ fontWeight:800, fontSize:14, color:'#065f46' }}>
                        ${item.usd.toFixed(2)}<span style={{ fontSize:11, fontWeight:500, color:'#bbb' }}>/mo</span>
                      </div>
                      <div style={{ fontSize:11, color:'#ccc' }}>≈ {toD(item.usd)} {t('DZD','دج')}</div>
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* total banner */}
          <div style={{ padding:'16px 16px 24px' }}>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              flexWrap:'wrap', gap:12,
              background:'linear-gradient(135deg,#064e3b,#065f46)',
              borderRadius:16, padding:'20px 24px', color:'#fff',
            }}>
              <div>
                <div style={{ fontWeight:800, fontSize:15 }}>{t('Total Monthly Hosting','إجمالي الاستضافة الشهرية')}</div>
                <div style={{ fontSize:12, opacity:0.55, marginTop:2 }}>{t('Excludes salaries · scales with usage','لا يشمل الرواتب')}</div>
              </div>
              <div style={{ textAlign:'end' }}>
                <div style={{ fontWeight:900, fontSize:30, letterSpacing:-1 }}>
                  ${cloudTotal.toFixed(2)}<span style={{ fontSize:14, fontWeight:600, opacity:0.6 }}>/mo</span>
                </div>
                <div style={{ fontSize:13, opacity:0.7, fontWeight:700 }}>≈ {toD(cloudTotal)} {t('DZD / month','دج / شهر')}</div>
              </div>
            </div>

            <div style={{
              marginTop:12, padding:'12px 16px', borderRadius:12,
              background:'#f0fdf4', border:'1px solid #bbf7d0',
              fontSize:13, color:'#166534', lineHeight:1.8,
            }}>
              <strong>{t('Business model:','نموذج العمل:')}</strong>{' '}
              {t(
                'Charge 5,000–15,000 DZD/month per clinic. Break-even at ~4 clients. At 20 clinics → up to 300,000 DZD revenue vs ~6,500 DZD infra cost.',
                'احسب 5,000–15,000 دج/شهر لكل عيادة. نقطة التعادل عند ~4 عملاء. عند 20 عيادة ← حتى 300,000 دج إيرادات مقابل ~6,500 دج تكاليف.',
              )}
            </div>
          </div>
        </GCard>

        {/* ── OPTION B: GOVERNMENT ─────────────────────────────── */}
        <GCard style={{ marginBottom:24, borderTop:'3px solid #6366f1' }}>
          <div style={{ padding:'28px 24px 12px' }}>
            <SLabel>{t('Option B · Ministry of Health / National','الخيار ب · وزارة الصحة / الوطني')}</SLabel>
            <h2 style={{ margin:'0 0 6px', fontSize:26, fontWeight:900, letterSpacing:-1, color:'#1e1b4b' }}>
              {t('On-Premises Server Infrastructure','بنية تحتية بخوادم محلية')}
            </h2>
            <p style={{ fontSize:13, color:'#bbb', margin:'0 0 20px', lineHeight:1.6 }}>
              {t(
                '1 USD = 132.59 DZD (XE.com May 16 2026) · +30% Algerian customs on IT imports · Dell US list pricing',
                '1 دولار = 132.59 دج (XE.com 16 مايو 2026) · +30% جمارك جزائرية · أسعار Dell الأمريكية',
              )}
            </p>
          </div>

          <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:6 }}>
            {GOV.map(g=>(
              <div key={g.l_en} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'12px 16px', borderRadius:12,
                background: g.once?'#faf5ff':'#eff6ff',
                border:`1px solid ${g.once?'#e9d5ff':'#bae6fd'}`,
              }}>
                <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,background:g.once?'#7c3aed':'#0369a1' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13.5, color:'#222' }}>{ar?g.l_ar:g.l_en}</div>
                  <div style={{ fontSize:12, color:'#bbb', marginTop:2 }}>{ar?g.d_ar:g.d_en}</div>
                </div>
                <div style={{ textAlign:'end', flexShrink:0 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:g.once?'#7c3aed':'#0369a1' }}>
                    {g.dzd} {t('DZD','دج')}
                  </div>
                  <div style={{ fontSize:11, color:'#bbb' }}>{g.once?t('one-time','دفعة واحدة'):t('annual','سنوياً')}</div>
                </div>
              </div>
            ))}
          </div>

          {/* totals */}
          <div style={{ padding:'16px 16px 8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { l_en:'One-Time Hardware', l_ar:'تكلفة الأجهزة (مرة واحدة)', val:govOnce,   bg:'linear-gradient(135deg,#3b0764,#6d28d9)' },
              { l_en:'Annual Running Cost', l_ar:'التكلفة السنوية الجارية',  val:govYearly, bg:'linear-gradient(135deg,#0c4a6e,#0369a1)' },
            ].map(b=>(
              <div key={b.l_en} style={{ background:b.bg, borderRadius:14, padding:'18px 20px', color:'#fff' }}>
                <div style={{ fontSize:10.5, opacity:0.65, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1.5 }}>
                  {ar?b.l_ar:b.l_en}
                </div>
                <div style={{ fontWeight:900, fontSize:20, letterSpacing:-0.5 }}>
                  ~{b.val.toLocaleString('fr-DZ')}
                  <span style={{ fontSize:13, fontWeight:600, opacity:0.65 }}> {t('DZD','دج')}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:'12px 16px 24px' }}>
            <div style={{
              padding:'12px 16px', borderRadius:12,
              background:'#fefce8', border:'1px solid #fde68a',
              fontSize:13, color:'#713f12', lineHeight:1.8,
            }}>
              ⚠️ {t(
                'Conservative minimums. Actual costs vary by public tender, exchange rate fluctuation, and government bulk pricing with Dell/HP.',
                'حدود دنيا متحفظة. تتفاوت التكاليف الفعلية بحسب المناقصات وتقلبات الصرف والأسعار الجملة الحكومية مع Dell/HP.',
              )}
            </div>
          </div>
        </GCard>

        {/* ── FOOTNOTE ─────────────────────────────────────────── */}
        <p style={{ textAlign:'center', fontSize:11.5, color:'#ccc', lineHeight:1.7 }}>
          {t(
            '* 1 USD = 132.59 DZD — XE.com, May 16 2026 15:48 UTC · Hosting: Hostinger.com May 2026 · Hardware: Dell US list pricing',
            '* 1 دولار = 132.59 دج — XE.com، 16 مايو 2026، 15:48 UTC · استضافة: Hostinger.com مايو 2026 · أجهزة: أسعار Dell الأمريكية',
          )}
        </p>

      </div>
    </div>
  )
}
