/**
 * Returns a CSS class for a given status or severity value.
 */
export function statusBadge(status) {
  if (!status) return 'badge'
  const map = {
    scheduled:   'badge badge-scheduled',
    completed:   'badge badge-completed',
    cancelled:   'badge badge-cancelled',
    pending:     'badge badge-pending',
    assigned:    'badge badge-assigned',
    high:        'badge badge-high',
    medium:      'badge badge-medium',
    low:         'badge badge-low',
    available:   'badge badge-available',
    unavailable: 'badge badge-unavailable',
    routine:     'badge badge-low',
    urgent:      'badge badge-medium',
    critical:    'badge badge-high',
  }
  return map[status.toLowerCase()] || 'badge'
}

export function Badge({ status }) {
  return <span className={statusBadge(status)}>{status}</span>
}
