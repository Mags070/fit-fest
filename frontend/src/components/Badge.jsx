import React from 'react'

export function statusBadge(status) {
  if (!status) return 'ui-badge ui-badge-secondary'
  const map = {
    scheduled:   'ui-badge ui-badge-primary',
    completed:   'ui-badge ui-badge-success',
    cancelled:   'ui-badge ui-badge-secondary',
    pending:     'ui-badge ui-badge-warning',
    assigned:    'ui-badge ui-badge-primary',
    high:        'ui-badge ui-badge-destructive',
    medium:      'ui-badge ui-badge-warning',
    low:         'ui-badge ui-badge-success',
    available:   'ui-badge ui-badge-success',
    unavailable: 'ui-badge ui-badge-destructive',
    routine:     'ui-badge ui-badge-success',
    urgent:      'ui-badge ui-badge-warning',
    critical:    'ui-badge ui-badge-destructive',
  }
  return map[status.toLowerCase()] || 'ui-badge ui-badge-secondary'
}

export function Badge({
  children,
  status,
  variant,
  dot = false,
  className = '',
  ...props
}) {
  const content = children || status
  let badgeClass = ''

  if (variant) {
    badgeClass = `ui-badge ui-badge-${variant}`
  } else if (status) {
    badgeClass = statusBadge(status)
  } else {
    badgeClass = 'ui-badge ui-badge-secondary'
  }

  return (
    <span className={`${badgeClass} ${className}`.trim()} {...props}>
      {dot && <span className="ui-badge-dot" />}
      {content}
    </span>
  )
}

export default Badge
