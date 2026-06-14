import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useLang, useT } from '../store/lang'
import {
  IcoDashboard, IcoHospital, IcoUsers, IcoBriefcase, IcoShield,
  IcoHeart, IcoFlag, IcoStar, IcoChart, IcoSettings, IcoBed, IcoCalendar,
  IcoBadge, IcoWrench, IcoTool, IcoSearch, IcoClipboard, IcoBuilding,
  IcoLogout, IcoGlobe, IcoSubscription, IcoCommunity,
} from './Icon'

type NavItem = {
  to: string
  en: string
  ar: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
}

const NAV_NATIONAL: NavItem[] = [
  { to: '/dashboard',     en: 'Dashboard',            ar: 'لوحة التحكم',         Icon: IcoDashboard    },
  { to: '/hospitals',     en: 'Hospitals',             ar: 'المستشفيات',          Icon: IcoHospital     },
  { to: '/users',         en: 'Users & Staff',         ar: 'المستخدمون والكوادر', Icon: IcoUsers        },
  { to: '/subscriptions', en: 'Subscriptions',         ar: 'الاشتراكات',          Icon: IcoSubscription },
  { to: '/companies',     en: 'Maintenance Companies', ar: 'شركات الصيانة',       Icon: IcoBriefcase    },
  { to: '/accounts',      en: 'Admin Accounts',        ar: 'حسابات المسؤولين',    Icon: IcoShield       },
  { to: '/donations',     en: 'Donations',             ar: 'التبرعات',            Icon: IcoHeart        },
  { to: '/community',    en: 'Nafas Community',       ar: 'مجتمع نَفَس',         Icon: IcoCommunity    },
  { to: '/reviews',       en: 'Ratings & Reviews',     ar: 'التقييمات',           Icon: IcoStar         },
  { to: '/reports',       en: 'Reports',               ar: 'التقارير',            Icon: IcoChart        },
  { to: '/settings',      en: 'Settings',              ar: 'الإعدادات',           Icon: IcoSettings     },
]

const NAV_HOSPITAL: NavItem[] = [
  { to: '/dashboard',    en: 'Dashboard',         ar: 'لوحة التحكم',   Icon: IcoDashboard },
  { to: '/beds',         en: 'Bed Management',    ar: 'إدارة الأسرّة', Icon: IcoBed       },
  { to: '/appointments', en: 'Appointments',      ar: 'المواعيد',      Icon: IcoCalendar  },
  { to: '/staff',        en: 'Staff',             ar: 'الكوادر',       Icon: IcoBadge     },
  { to: '/equipment',    en: 'Equipment',         ar: 'المعدات',       Icon: IcoWrench    },
  { to: '/needs',        en: 'Maintenance Needs', ar: 'طلبات الصيانة', Icon: IcoTool      },
  { to: '/community',   en: 'Nafas Community',   ar: 'مجتمع نَفَس',   Icon: IcoCommunity },
  { to: '/reports',      en: 'Reports',           ar: 'التقارير',      Icon: IcoChart     },
]

const NAV_COMPANY: NavItem[] = [
  { to: '/dashboard',    en: 'Dashboard',       ar: 'لوحة التحكم',     Icon: IcoDashboard },
  { to: '/profile',      en: 'Company Profile', ar: 'ملف الشركة',      Icon: IcoBuilding  },
  { to: '/browse-needs', en: 'Browse Needs',    ar: 'استعراض الطلبات', Icon: IcoSearch    },
  { to: '/my-offers',    en: 'My Offers',       ar: 'عروضي',           Icon: IcoClipboard },
]

function getNav(role?: string) {
  if (role === 'hospital_admin') return NAV_HOSPITAL
  if (role === 'maintenance_company') return NAV_COMPANY
  return NAV_NATIONAL
}

function getRoleLabel(role?: string, lang = 'en'): string {
  const labels: Record<string, [string, string]> = {
    national_admin:      ['National Admin',      'مسؤول وطني'],
    hospital_admin:      ['Hospital Admin',       'مسؤول مستشفى'],
    maintenance_company: ['Maintenance Company',  'شركة صيانة'],
  }
  const entry = labels[role || '']
  if (!entry) return role || ''
  return lang === 'ar' ? entry[1] : entry[0]
}

const ROLE_ACCENT: Record<string, string> = {
  national_admin:      'var(--accent)',
  hospital_admin:      'var(--blue)',
  maintenance_company: 'var(--green)',
}

export default function Layout() {
  const { user, clear } = useAuth()
  const { lang, toggle } = useLang()
  const t = useT()
  const { pathname } = useLocation()

  const initials = (user?.full_name || 'A')
    .split(' ')
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const nav = getNav(user?.role)
  const now = new Date()
  const dateStr = now.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const current = nav.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  const pageTitle = current ? (lang === 'ar' ? current.ar : current.en) : 'NAFAS'

  return (
    <div className="app-shell" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo-pill">
            <img src="/logo.png" alt="NAFAS" className="brand-logo"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <div className="brand-wordmark">NAFAS</div>
            <div className="brand-tagline">{t('Healthcare Platform', 'منصة الرعاية الصحية')}</div>
          </div>
        </div>

        <nav>
          <div className="group-label">{getRoleLabel(user?.role, lang)}</div>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}>
              <n.Icon className="nav-icon" size={17} />
              <span>{lang === 'ar' ? n.ar : n.en}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-section">
          <div className="user-card">
            <div className="avatar"
              style={{ background: ROLE_ACCENT[user?.role || ''] || 'var(--accent)' }}>
              {initials}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{getRoleLabel(user?.role, lang)}</div>
            </div>
            <button className="logout-btn" onClick={clear}
              title={t('Sign out', 'تسجيل خروج')}>
              <IcoLogout size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{pageTitle}</h1>
            <div className="breadcrumb">NAFAS &middot; {dateStr}</div>
          </div>
          <div className="spacer" />
          <div className="topbar-actions">
            <div className="topbar-badge">
              <span className="dot" />
              {t('API Live', 'الخادم متاح')} &middot; {timeStr}
            </div>
            <button className="btn btn-ghost btn-sm lang-toggle" onClick={toggle}
              title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}>
              <IcoGlobe size={14} />
              {lang === 'en' ? 'AR' : 'EN'}
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

