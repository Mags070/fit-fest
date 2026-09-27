import React, { useState } from 'react'

/**
 * Clean, lightweight, zero-dependency SVG healthcare charts.
 * 1. AppointmentTrendChart: Area curve showing volume over time
 * 2. AcuityDonutChart: Acuity breakdown (Routine, Urgent, Critical)
 * 3. DoctorWorkloadChart: Comparative bar chart of doctor assignments
 */

export function AppointmentTrendChart({
  data,
  height = 180,
}) {
  const [activePoint, setActivePoint] = useState(null)

  // Use dynamic data if provided; default to zero-initialized week if empty
  const chartData = (data && data.length > 0)
    ? data
    : [
        { day: 'Mon', day_full: 'Monday', scheduled: 0, completed: 0 },
        { day: 'Tue', day_full: 'Tuesday', scheduled: 0, completed: 0 },
        { day: 'Wed', day_full: 'Wednesday', scheduled: 0, completed: 0 },
        { day: 'Thu', day_full: 'Thursday', scheduled: 0, completed: 0 },
        { day: 'Fri', day_full: 'Friday', scheduled: 0, completed: 0 },
        { day: 'Sat', day_full: 'Saturday', scheduled: 0, completed: 0 },
        { day: 'Sun', day_full: 'Sunday', scheduled: 0, completed: 0 },
      ]

  const width = 500
  const paddingX = 40
  const paddingY = 25

  const maxVal = Math.max(...chartData.map(d => Math.max(d.scheduled || 0, d.completed || 0)), 5)

  const getX = (i) => paddingX + (i / Math.max(chartData.length - 1, 1)) * (width - paddingX * 2)
  const getY = (val) => height - paddingY - ((val || 0) / maxVal) * (height - paddingY * 2)

  // Build SVG path points for scheduled
  const scheduledPoints = chartData.map((d, i) => `${getX(i)},${getY(d.scheduled)}`).join(' ')
  const completedPoints = chartData.map((d, i) => `${getX(i)},${getY(d.completed)}`).join(' ')

  const scheduledArea = `${getX(0)},${height - paddingY} ${scheduledPoints} ${getX(chartData.length - 1)},${height - paddingY}`
  const completedArea = `${getX(0)},${height - paddingY} ${completedPoints} ${getX(chartData.length - 1)},${height - paddingY}`

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
          {chartData.map((d, i) => {
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
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{activePoint.day_full || activePoint.day}</div>
            <div style={{ color: '#3b82f6', fontSize: 11.5 }}>Scheduled: {activePoint.scheduled}</div>
            <div style={{ color: '#10b981', fontSize: 11.5 }}>Completed: {activePoint.completed}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function AcuityDonutChart({
  routine = 0,
  urgent = 0,
  critical = 0,
}) {
  const total = routine + urgent + critical
  const safeTotal = total > 0 ? total : 1
  const routinePct = total > 0 ? Math.round((routine / total) * 100) : 0
  const urgentPct = total > 0 ? Math.round((urgent / total) * 100) : 0
  const criticalPct = total > 0 ? Math.max(0, 100 - routinePct - urgentPct) : 0

  const size = 130
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const routineOffset = 0
  const routineDash = (routine / safeTotal) * circumference

  const urgentOffset = -routineDash
  const urgentDash = (urgent / safeTotal) * circumference

  const criticalOffset = -(routineDash + urgentDash)
  const criticalDash = (critical / safeTotal) * circumference

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
            <span className="legend-item"><span className="legend-chip green" /> Routine</span>
            <span className="donut-legend-val">{routine} ({routinePct}%)</span>
          </div>
          <div className="donut-legend-row">
            <span className="legend-item"><span className="legend-chip amber" /> Urgent</span>
            <span className="donut-legend-val">{urgent} ({urgentPct}%)</span>
          </div>
          <div className="donut-legend-row">
            <span className="legend-item"><span className="legend-chip red" /> Critical</span>
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
            const count = doc.appointment_count || 0
            const maxVal = Math.max(...displayDocs.map(d => d.appointment_count || 0), 1)
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
