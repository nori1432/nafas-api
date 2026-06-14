import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts'
import { api } from '../lib/api'
import { useT, useLang } from '../store/lang'
import { IcoHospital, IcoBed, IcoChart, IcoHeart, IcoWrench, IcoBadge, IcoCheck, IcoCommunity } from '../components/Icon'

const COLORS = ['#27AE60', '#F39C12', '#E74C3C', '#2563eb', '#8b5cf6']

function bedColor(avail: number, total: number) {
  if (!total) return '#9ca3af'
  const pct = avail / total
  if (avail === 0) return '#E74C3C'
  if (pct < 0.1) return '#E74C3C'
  if (pct < 0.3) return '#F39C12'
  return '#27AE60'
}

function KpiCard({ label, value, delta, icon, colorClass, iconBg }: {
  label: string; value: string | number; delta: string; icon?: React.ReactNode; colorClass?: string; iconBg?: string
}) {
  return (
    <div className={`kpi-card ${colorClass || ''}`}>
      {icon && <div className="kpi-icon" style={{ background: iconBg || '#eff6ff' }}>{icon}</div>}
      <div>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
        <div className="delta">{delta}</div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Wilaya {label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const t = useT()
  const { lang } = useLang()
  const dash = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data,
  })
  const bedReport = useQuery({
    queryKey: ['report-beds'],
    queryFn: async () => (await api.get('/admin/reports/beds')).data.data as Array<{ wilaya_id: number; total_beds: number; available_beds: number; hospital_count: number }>,
  })
  const map = useQuery({
    queryKey: ['hospitals-map'],
    queryFn: async () => (await api.get('/hospitals/map')).data.data as Array<{ id: number; name_ar: string; name_en: string; lat: number; lng: number; available_beds: number; total_beds: number }>,
  })

  const d = dash.data || {}
  const beds = bedReport.data || []
  const hospitals = map.data || []

  const occupancyRate = d.total_beds ? Math.round(((d.total_beds - d.available_beds) / d.total_beds) * 100) : 0
  const availRate = 100 - occupancyRate

  const pieData = [
    { name: t('Available', 'متاح'), value: d.available_beds || 0 },
    { name: t('Occupied', 'مشغول'), value: (d.total_beds || 0) - (d.available_beds || 0) },
  ]

  const statusData = [
    { name: t('Open Questions', 'أسئلة مجتمع نَفَس'), value: d.open_community_questions || 0, color: '#3B82F6' },
    { name: t('Open Maintenance', 'طلبات صيانة'), value: d.open_maintenance || 0, color: '#F39C12' },
    { name: t('Blood Campaigns', 'حملات دم'), value: d.active_blood_campaigns || 0, color: '#c0392b' },
  ]

  // Trending line: mock monthly trend from bed data
  const trendData = beds.slice(0, 10).map((b, i) => ({
    month: `W${b.wilaya_id}`,
    occupancy: b.total_beds ? Math.round(((b.total_beds - b.available_beds) / b.total_beds) * 100) : 0,
  }))

  const criticalHospitals = hospitals.filter(h => h.total_beds > 0 && (h.available_beds / h.total_beds) < 0.1)
  const healthyHospitals = hospitals.filter(h => h.total_beds > 0 && (h.available_beds / h.total_beds) >= 0.3)

  return (
    <>
      {/* ── KPI Grid ───────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          label={t('Total Hospitals', 'إجمالي المستشفيات')}
          value={d.total_hospitals ?? '—'}
          delta={t('Nationwide facilities', 'مرافق على مستوى الوطن')}
          icon={<IcoHospital size={18} />}
          iconBg="#eff6ff"
        />
        <KpiCard
          label={t('Available Beds', 'أسرّة متاحة')}
          value={d.available_beds ?? '—'}
          delta={`${availRate}% ${t('of', 'من')} ${d.total_beds ?? 0} ${t('total', 'إجمالي')}`}
          icon={<IcoBed size={18} />}
          colorClass="green"
          iconBg="#f0fdf4"
        />
        <KpiCard
          label={t('Occupancy Rate', 'معدل الإشغال')}
          value={`${occupancyRate}%`}
          delta={occupancyRate > 80 ? t('Critical load', 'حمل حرج') : t('Normal capacity', 'طاقة طبيعية')}
          icon={<IcoChart size={18} />}
          colorClass={occupancyRate > 80 ? 'accent' : 'amber'}
          iconBg={occupancyRate > 80 ? '#fef2f2' : '#fffbeb'}
        />
        <KpiCard
          label={t('Blood Campaigns', 'حملات الدم')}
          value={d.active_blood_campaigns ?? '—'}
          delta={t('Active country-wide', 'نشطة على مستوى الوطن')}
          icon={<IcoHeart size={18} />}
          colorClass="accent"
          iconBg="#fef2f2"
        />
        <KpiCard
          label={t('Community Questions', 'أسئلة مجتمع نَفَس')}
          value={d.open_community_questions ?? '—'}
          delta={d.open_community_questions > 20 ? t('Needs attention', 'تحتاج اهتمامًا') : t('Within normal range', 'ضمن النطاق الطبيعي')}
          icon={<IcoCommunity size={18} />}
          colorClass={d.open_community_questions > 20 ? 'accent' : ''}
          iconBg="#eff6ff"
        />
        <KpiCard
          label={t('Maintenance Requests', 'طلبات الصيانة')}
          value={d.open_maintenance_needs ?? '—'}
          delta={t('Pending resolution', 'في انتظار الحل')}
          icon={<IcoWrench size={18} />}
          colorClass="amber"
          iconBg="#fffbeb"
        />
        <KpiCard
          label={t('Critical Hospitals', 'مستشفيات حرجة')}
          value={criticalHospitals.length}
          delta={t('<10% beds available', 'أقل من 10% أسرّة متاحة')}
          icon={<IcoBadge size={18} />}
          colorClass="accent"
          iconBg="#fef2f2"
        />
        <KpiCard
          label={t('Healthy Facilities', 'مرافق جيدة')}
          value={healthyHospitals.length}
          delta={t('≥30% beds available', '30%+ أسرّة متاحة')}
          icon={<IcoCheck size={18} />}
          colorClass="green"
          iconBg="#f0fdf4"
        />
      </div>

      {/* ── Alert Banner ──────────────────────────── */}
      {criticalHospitals.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1px solid rgba(220,38,38,0.25)',
          borderLeft: '4px solid #dc2626',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>
              {criticalHospitals.length} {t('hospital(s) at critical capacity', 'مستشفى في طاقة حرجة')}
            </div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>
              {criticalHospitals.slice(0, 3).map(h => lang === 'ar' ? h.name_ar : h.name_en).join(', ')}{criticalHospitals.length > 3 ? ` +${criticalHospitals.length - 3}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Row ────────────────────────────── */}
      <div className="chart-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('Bed Availability by Wilaya', 'توافر الأسرة حسب الولاية')}</div>
              <div className="card-subtitle">{t('Total vs available beds per region', 'إجمالي الأسرة مقابل المتاحة حسب المنطقة')}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={beds.slice(0, 15)} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="wilaya_id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <RTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total_beds" name={t('Total Beds', 'إجمالي الأسرة')} fill="#e2e8f0" radius={[3,3,0,0]} />
              <Bar dataKey="available_beds" name={t('Available', 'المتاح')} fill="#16a34a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-title">{t('Bed Occupancy', 'إشغال الأسرة')}</div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={3}>
                  <Cell fill="#16a34a" />
                  <Cell fill="#e74c3c" />
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
              {pieData.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#16a34a' : '#e74c3c', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
                  <strong style={{ color: 'var(--text)' }}>{p.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>{t('Activity Overview', 'نظرة عامة على النشاط')}</div>
            {statusData.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{s.name}</span>
                <div style={{ flex: 2, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((s.value / 50) * 100, 100)}%`, background: s.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.color, minWidth: 24, textAlign: 'right' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Occupancy Trend ───────────────────────── */}
      {trendData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Occupancy Rate by Region', 'معدل الإشغال حسب المنطقة')}</div>
              <div className="card-subtitle">{t('% beds occupied per wilaya (top 10)', '% الأسرة المشغولة لكل ولاية (أعلى 10)')}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c0392b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#c0392b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <RTooltip formatter={(v: any) => `${v}%`} />
              <Area type="monotone" dataKey="occupancy" name={t('Occupancy', 'الإشغال')} stroke="#c0392b" strokeWidth={2} fill="url(#occGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Map ───────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title">{t('Hospital Map — Algeria', 'خريطة المستشفيات — الجزائر')}</div>
            <div className="card-subtitle">
              <span style={{ color: '#27AE60' }}>● {t('Available', 'متاح')} </span>
              <span style={{ color: '#F39C12', marginLeft: 8 }}>● {t('Limited', 'محدود')} </span>
              <span style={{ color: '#E74C3C', marginLeft: 8 }}>● {t('Critical', 'حرج')}</span>
            </div>
          </div>
          <span className="badge badge-green">{hospitals.length} {t('facilities', 'مرفق')}</span>
        </div>
        <div style={{ height: 480 }}>
          <MapContainer center={[28.0339, 1.6596]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hospitals.map((h) => (
              <CircleMarker
                key={h.id}
                center={[h.lat, h.lng]}
                radius={9}
                pathOptions={{ color: bedColor(h.available_beds, h.total_beds), fillOpacity: 0.8, weight: 2, fillColor: bedColor(h.available_beds, h.total_beds) }}
              >
                <Tooltip>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'ar' ? h.name_ar : h.name_en}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>{lang === 'ar' ? h.name_en : h.name_ar}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, fontSize: 12 }}>
                    <span>{h.available_beds}/{h.total_beds} {t('beds', 'سرير')}</span>
                    <span style={{ color: bedColor(h.available_beds, h.total_beds), fontWeight: 600 }}>
                      {h.total_beds ? Math.round((h.available_beds / h.total_beds) * 100) : 0}% {t('free', 'شاغر')}
                    </span>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* ── Critical Hospitals Table ──────────────── */}
      {criticalHospitals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--red)' }}>{t('Critical Capacity Hospitals', 'مستشفيات ذات طاقة حرجة')}</div>
            <span className="badge badge-red">{criticalHospitals.length} {t('hospitals', 'مستشفى')}</span>
          </div>
          <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
            <table className="nfs">
              <thead>
                <tr><th>{t('Hospital', 'المستشفى')}</th><th>{t('Arabic Name', 'الاسم بالعربية')}</th><th>{t('Available', 'متاح')}</th><th>{t('Total', 'الإجمالي')}</th><th>{t('Load', 'الحمل')}</th></tr>
              </thead>
              <tbody>
                {criticalHospitals.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.name_en}</td>
                    <td>{h.name_ar}</td>
                    <td><span className="badge badge-red">{h.available_beds}</span></td>
                    <td>{h.total_beds}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${h.total_beds ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0}%`, background: '#dc2626', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', minWidth: 36 }}>
                          {h.total_beds ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
