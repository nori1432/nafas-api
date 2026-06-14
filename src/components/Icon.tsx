/** Stroke-based SVG icon set — no emojis, consistent 20×20 grid */
interface IconProps { size?: number; className?: string; style?: React.CSSProperties }

const base = (d: string | JSX.Element, extra?: string) =>
  ({ size = 18, className, style }: IconProps) => (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}
    >
      {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
  )

export const IcoDashboard = base(
  <><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></>
)
export const IcoHospital = base(
  <><path d="M3 9V17h14V9"/><path d="M1 9.5L10 3l9 6.5"/><path d="M9 17v-5h2v5"/><path d="M10 6.5v3M8.5 8H11.5"/></>
)
export const IcoUsers = base(
  <><circle cx="7.5" cy="6.5" r="2.5"/><path d="M1 17c0-3.31 2.91-6 6.5-6"/><circle cx="14" cy="8" r="2"/><path d="M11 17c0-2.76 1.79-5 4-5s4 2.24 4 5"/></>
)
export const IcoDocument = base(
  <><path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M12 2v4h4"/><path d="M8 9h6M8 12h6M8 15h4"/></>
)
export const IcoBriefcase = base(
  <><rect x="2" y="7" width="16" height="11" rx="2"/><path d="M7 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/><path d="M2 12h16"/></>
)
export const IcoShield = base(
  <><path d="M10 2L3 5v6c0 4.41 2.94 8.13 7 9 4.06-.87 7-4.59 7-9V5L10 2z"/><path d="M7 10l2 2 4-4"/></>
)
export const IcoHeart = base(
  <><path d="M10 17S2 12.5 2 7a4 4 0 018-1.5A4 4 0 0118 7c0 5.5-8 10-8 10z"/></>
)
export const IcoFlag = base(
  <><path d="M4 3v14"/><path d="M4 4l12 3-12 4"/></>
)
export const IcoStar = base(
  <><path d="M10 2l2.2 4.5 4.8.7-3.5 3.4.8 4.9L10 13.2l-4.3 2.3.8-4.9L3 7.2l4.8-.7L10 2z"/></>
)
export const IcoChart = base(
  <><path d="M2 16h16"/><path d="M5 16V10"/><path d="M9 16V6"/><path d="M13 16V12"/><path d="M17 16V8"/></>
)
export const IcoSettings = base(
  <><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/></>
)
export const IcoBed = base(
  <><path d="M1 12V8a2 2 0 012-2h14a2 2 0 012 2v4"/><path d="M1 16V12h18v4"/><path d="M5 6V4"/><rect x="5" y="9" width="10" height="3" rx="1"/></>
)
export const IcoCalendar = base(
  <><rect x="2" y="4" width="16" height="14" rx="2"/><path d="M2 9h16"/><path d="M7 2v4M13 2v4"/></>
)
export const IcoBadge = base(
  <><rect x="4" y="2" width="12" height="16" rx="2"/><circle cx="10" cy="8" r="2.5"/><path d="M6 16c0-2.21 1.79-4 4-4s4 1.79 4 4"/></>
)
export const IcoWrench = base(
  <><path d="M14.7 2.3a4 4 0 00-5.4 5.4L2 15a1 1 0 000 1.4l.6.6a1 1 0 001.4 0l7.3-7.3a4 4 0 005.4-5.4l-2.5 2.5-1.7-.5-.5-1.7 2.7-2.3z"/></>
)
export const IcoTool = base(
  <><path d="M3 17l1.5-1.5M8 3L5 6l1.5 1.5L5 9l4 4 1.5-1.5L12 13l3-3-2-2 1-4-4 1-2 2z"/></>
)
export const IcoSearch = base(
  <><circle cx="9" cy="9" r="6"/><path d="M15 15l3 3"/></>
)
export const IcoClipboard = base(
  <><rect x="5" y="3" width="10" height="14" rx="1.5"/><path d="M8 3V2h4v1"/><path d="M7 9h6M7 12h4"/></>
)
export const IcoBuilding = base(
  <><rect x="3" y="4" width="14" height="14" rx="1"/><path d="M3 9h14"/><path d="M9 4v5"/><path d="M7 14h2v4H7zM11 14h2v4h-2z"/></>
)
export const IcoLogout = base(
  <><path d="M13 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4"/><path d="M9 14l4-4-4-4"/><path d="M13 10H3"/></>
)
export const IcoGlobe = base(
  <><circle cx="10" cy="10" r="8"/><path d="M10 2a14 14 0 000 16"/><path d="M10 2a14 14 0 010 16"/><path d="M2 10h16"/></>
)
export const IcoChevronRight = base('M8 4l5 6-5 6')
export const IcoX = base('M4 4l12 12M16 4L4 16')
export const IcoPlus = base('M10 3v14M3 10h14')
export const IcoSmartphone = base(
  <><rect x="5" y="1" width="10" height="18" rx="2.5"/><path d="M8 4.5h4"/><path d="M9 15.5h2"/></>
)
export const IcoDownload = base(
  <><path d="M10 3v11"/><path d="M5.5 9.5l4.5 4.5 4.5-4.5"/><path d="M3 17h14"/></>
)
export const IcoPencil = base('M3 17l2-5L14 3l3 3L8 15l-5 2zM12 5l3 3')
export const IcoTrash = base(
  <><path d="M3 6h14M8 6V4h4v2M6 6l1 12h6l1-12"/></>
)
export const IcoCheck = base('M4 10l4 4 8-8')
export const IcoInfo = base(<><circle cx="10" cy="10" r="8"/><path d="M10 7v1M10 11v4"/></>)
export const IcoNotification = base(<><path d="M10 2a6 6 0 016 6c0 3 1 4 2 5H2c1-1 2-2 2-5a6 6 0 016-6z"/><path d="M8 17a2 2 0 004 0"/></>)
export const IcoSubscription = base(<><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M6 8h8M6 12h5"/><path d="M15 11l2 2 2-2"/></>)
export const IcoCommunity = base(<><circle cx="7" cy="7" r="3"/><circle cx="14" cy="7" r="3"/><path d="M1 17c0-2.76 2.69-5 6-5"/><path d="M13 12c3.31 0 6 2.24 6 5"/><path d="M7 12c3.31 0 6 2.24 6 5"/></>)
