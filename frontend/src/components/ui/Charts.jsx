import React, { useState } from 'react'

/**
 * Clean, lightweight, zero-dependency SVG healthcare charts.
 * 1. AppointmentTrendChart: Area curve showing volume over time
 * 2. AcuityDonutChart: Acuity breakdown (Routine, Urgent, Critical)
 * 3. DoctorWorkloadChart: Comparative bar chart of doctor assignments
 */

export function AppointmentTrendChart({
  data = [
    { day: 'Mon', scheduled: 4, completed: 3 },
    { day: 'Tue', scheduled: 7, completed: 6 },
    { day: 'Wed', scheduled: 5, completed: 5 },
    { day: 'Thu', scheduled: 9, completed: 7 },
    { day: 'Fri', scheduled: 8, completed: 8 },
    { day: 'Sat', scheduled: 3, completed: 3 },
    { day: 'Sun', scheduled: 1, completed: 1 },
  ],
  height = 180,
}) {
  const [activePoint, setActivePoint] = useState(null)

  const width = 500
  const paddingX = 40
  const paddingY = 25

  const maxVal = Math.max(...data.map(d => Math.max(d.scheduled, d.completed)), 10)

  const getX = (i) => paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
  const getY = (val) => height - paddingY - (val / maxVal) * (height - paddingY * 2)

  // Build SVG path points for scheduled
  const scheduledPoints = data.map((d, i) => `${getX(i)},${getY(d.scheduled)}`).join(' ')
  const completedPoints = data.map((d, i) => `${getX(i)},${getY(d.completed)}`).join(' ')

  const scheduledArea = `${getX(0)},${height - paddingY} ${scheduledPoints} ${getX(data.length - 1)},${height - paddingY}`
  const completedArea = `${getX(0)},${height - paddingY} ${completedPoints} ${getX(data.length - 1)},${height - paddingY}`

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h4 className="chart-title">Weekly Patient Consultation Trend</h4>
          <span className="chart-subtitle">Scheduled vs Completed Visits</span>
        </div>
        <div className="chart-legend-row">
          <span className="legend-item"><span className="legend-chip blue" /> Scheduled</span>
          <span className="legend-item"><span className="legend-chip green" /> Completed</span>
        </div>
      </div>

      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="schedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = height - paddingY - ratio * (height - paddingY * 2)
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
            )
          })}

          {/* Area Fills */}
          <polygon points={scheduledArea} fill="url(#schedGrad)" />
          <polygon points={completedArea} fill="url(#compGrad)" />

          {/* Lines */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={scheduledPoints}
          />
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={completedPoints}
          />

          {/* Points */}
          {data.map((d, i) => {
            const sx = getX(i)
            const sy = getY(d.scheduled)
            return (
              <g key={i}>
                <circle
                  cx={sx}
                  cy={sy}
                  r="4"
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="chart-dot"
                  onMouseEnter={() => setActivePoint({ ...d, x: sx, y: sy })}
                  onMouseLeave={() => setActivePoint(null)}
                />
                <text
                  x={sx}
                  y={height - 8}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize="11"
                  fontWeight="500"
                >
                  {d.day}
                </text>
              </g>
            )
          })}
        </svg>

        {activePoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
            }}
          >
            <strong>{activePoint.day}</strong>: {activePoint.scheduled} scheduled, {activePoint.completed} completed
          </div>
        )}
      </div>
    </div>
  )
}

export function AcuityDonutChart({
  routine = 12,
  urgent = 5,
  critical = 2,
}) {
  const total = routine + urgent + critical || 1
  const routinePct = Math.round((routine / total) * 100)
  const urgentPct = Math.round((urgent / total) * 100)
  const criticalPct = Math.max(0, 100 - routinePct - urgentPct)

  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const routineOffset = 0
  const routineDash = (routine / total) * circumference

  const urgentOffset = -routineDash
  const urgentDash = (urgent / total) * circumference

  const criticalOffset = -(routineDash + urgentDash)
  const criticalDash = (critical / total) * circumference

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h4 className="chart-title">Patient Acuity & Triage Risk</h4>
          <span className="chart-subtitle">Case Severity Distribution</span>
        </div>
      </div>

      <div className="donut-wrap">
        <div className="donut-svg-container">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--secondary)"
              strokeWidth={strokeWidth}
            />
            {/* Routine segment (Green) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${routineDash} ${circumference}`}
              strokeDashoffset={routineOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            {/* Urgent segment (Amber) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${urgentDash} ${circumference}`}
              strokeDashoffset={urgentOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            {/* Critical segment (Red) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              strokeDasharray={`${criticalDash} ${circumference}`}
              strokeDashoffset={criticalOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="donut-center-label">
            <span className="donut-total">{total}</span>
            <span className="donut-label">Total Cases</span>
          </div>
        </div>

        <div className="donut-legend">
          <div className="donut-legend-row">
            <span className="legend-chip green" />
            <span className="donut-legend-name">Routine</span>
            <span className="donut-legend-val">{routine} ({routinePct}%)</span>
          </div>
          <div className="donut-legend-row">
            <span className="legend-chip amber" />
            <span className="donut-legend-name">Urgent</span>
            <span className="donut-legend-val">{urgent} ({urgentPct}%)</span>
          </div>
          <div className="donut-legend-row">
            <span className="legend-chip red" />
            <span className="donut-legend-name">Critical</span>
            <span className="donut-legend-val">{critical} ({criticalPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DoctorWorkloadChart({ doctors = [] }) {
  // Take top 4 doctors
  const displayDocs = doctors.slice(0, 4)

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h4 className="chart-title">Doctor Consultation Load</h4>
          <span className="chart-subtitle">Active assigned patient cases</span>
        </div>
      </div>

      <div className="workload-list">
        {displayDocs.length === 0 ? (
          <div className="text-muted" style={{ padding: '20px 0', textAlign: 'center', fontSize: 13 }}>
            No active doctor appointments recorded
          </div>
        ) : (
          displayDocs.map((doc, idx) => {
            const count = doc.appointment_count || (idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : 2)
            const maxVal = 8
            const pct = Math.min(100, Math.round((count / maxVal) * 100))

            return (
              <div key={doc.id || idx} className="workload-item">
                <div className="workload-info">
                  <span className="workload-name">{doc.name}</span>
                  <span className="workload-badge">{count} cases</span>
                </div>
                <div className="workload-bar-track">
                  <div
                    className="workload-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: idx % 2 === 0
                        ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                        : 'linear-gradient(90deg, #10b981, #34d399)'
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
