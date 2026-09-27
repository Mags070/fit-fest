export default function StatCard({ icon, value, label, color = 'blue' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="value">{value ?? '—'}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  )
}
