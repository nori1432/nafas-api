import { useAuth } from '../store/auth'

export default function Settings() {
  const { user } = useAuth()
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">My profile</div>
        <div className="row">
          <div className="flex-1">
            <div className="muted">Full name</div>
            <div style={{ fontSize: 16, marginTop: 4 }}>{user?.full_name}</div>
          </div>
          <div className="flex-1">
            <div className="muted">Phone</div>
            <div style={{ fontSize: 16, marginTop: 4 }}>{user?.phone_number}</div>
          </div>
          <div className="flex-1">
            <div className="muted">Role</div>
            <div style={{ fontSize: 16, marginTop: 4 }}><span className="badge badge-ink">{user?.role}</span></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="section-title">Platform settings</div>
        <p className="muted">Notification templates, repair-center approval workflow, and donation thresholds will appear here. (Backend hooks ready — UI editor TBD.)</p>
      </div>
    </>
  )
}
