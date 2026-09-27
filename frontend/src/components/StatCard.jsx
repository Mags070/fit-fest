import React from 'react'

export default function StatCard({ icon, value, label, color = 'blue', subtext, trend }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="value">{value ?? '—'}</div>
        <div className="label">{label}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  )
}
