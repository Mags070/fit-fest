import React, { useState, useMemo } from 'react'

/**
 * GitHub-style Activity / Contribution Heatmap Calendar for Healthcare Appointments.
 * Shows clinic appointment activity over the past N weeks with color intensity,
 * month labels, weekday indicators, and interactive tooltips.
 */
export default function ActivityHeatmap({
  appointments = [],
  weeksToShow = 18,
  onDateClick,
  selectedDate,
}) {
  const [hoveredDay, setHoveredDay] = useState(null)

  // Aggregate appointments by YYYY-MM-DD
  const dateCounts = useMemo(() => {
    const counts = {}
    appointments.forEach((appt) => {
      const date = appt.appointment_date || (appt.created_at ? appt.created_at.split('T')[0] : null)
      if (date) {
        counts[date] = (counts[date] || 0) + 1
      }
    })
    return counts
  }, [appointments])

  // Build grid data for the last `weeksToShow` weeks
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    // Align to the end of the current week (Saturday)
    const end = new Date(today)
    end.setDate(end.getDate() + (6 - end.getDay()))

    // Total days = weeksToShow * 7
    const totalDays = weeksToShow * 7
    const start = new Date(end)
    start.setDate(start.getDate() - totalDays + 1)

    const weeksArr = []
    const monthsArr = []
    let currentWeek = []
    let lastMonth = null

    const cur = new Date(start)
    let dayIndex = 0

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0]
      const count = dateCounts[dateStr] || 0
      const monthName = cur.toLocaleString('default', { month: 'short' })

      // Check if this column starts or contains a new month
      if (cur.getDay() === 0) {
        if (monthName !== lastMonth) {
          monthsArr.push({ weekIndex: weeksArr.length, month: monthName })
          lastMonth = monthName
        }
      }

      currentWeek.push({
        date: dateStr,
        count,
        dayOfWeek: cur.getDay(),
        formattedDate: cur.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      })

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }

      cur.setDate(cur.getDate() + 1)
      dayIndex++
    }

    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek)
    }

    return { weeks: weeksArr, monthLabels: monthsArr }
  }, [dateCounts, weeksToShow])

  // Helper to determine intensity level (0 to 4)
  const getIntensityLevel = (count) => {
    if (count === 0) return 0
    if (count === 1) return 1
    if (count === 2) return 2
    if (count <= 4) return 3
    return 4
  }

  const daysOfWeek = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <div className="heatmap-title-wrap">
          <span className="heatmap-dot" />
          <h4 className="heatmap-title">Clinical Appointment Density</h4>
          <span className="heatmap-subtitle">Past {weeksToShow} weeks activity</span>
        </div>
        <div className="heatmap-legend">
          <span className="legend-label">Less</span>
          <span className="heatmap-cell level-0" />
          <span className="heatmap-cell level-1" />
          <span className="heatmap-cell level-2" />
          <span className="heatmap-cell level-3" />
          <span className="heatmap-cell level-4" />
          <span className="legend-label">More</span>
        </div>
      </div>

      <div className="heatmap-body-scroll">
        <div className="heatmap-grid-wrapper">
          {/* Month labels along the top */}
          <div className="heatmap-months-row">
            <div className="heatmap-day-label-spacer" />
            <div className="heatmap-months-track">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="heatmap-month-label"
                  style={{ left: `${m.weekIndex * 15}px` }}
                >
                  {m.month}
                </span>
              ))}
            </div>
          </div>

          <div className="heatmap-calendar-layout">
            {/* Day of week labels on left (Mon, Wed, Fri) */}
            <div className="heatmap-day-labels">
              {daysOfWeek.map((label, idx) => (
                <div key={idx} className="heatmap-day-label">
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks columns */}
            <div className="heatmap-weeks">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="heatmap-week-col">
                  {week.map((day) => {
                    const level = getIntensityLevel(day.count)
                    const isSelected = selectedDate === day.date

                    return (
                      <button
                        type="button"
                        key={day.date}
                        className={`heatmap-cell level-${level} ${isSelected ? 'is-selected' : ''}`}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => onDateClick && onDateClick(day.date, day.count)}
                        aria-label={`${day.count} appointments on ${day.formattedDate}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating or Footer Tooltip */}
      <div className="heatmap-tooltip-bar">
        {hoveredDay ? (
          <span>
            <strong>{hoveredDay.count}</strong> appointment{hoveredDay.count === 1 ? '' : 's'} on{' '}
            <strong>{hoveredDay.formattedDate}</strong>
          </span>
        ) : (
          <span className="text-muted">Hover over any day square to inspect appointment volumes</span>
        )}
      </div>
    </div>
  )
}
