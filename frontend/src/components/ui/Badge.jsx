import React from 'react'

export function getStatusVariant(status) {
  if (!status) return 'default'
  const s = String(status).toLowerCase()
  if (['completed', 'available', 'low', 'routine'].includes(s)) return 'success'
  if (['pending', 'medium', 'urgent', 'in_progress', 'partially_fulfilled'].includes(s)) return 'warning'
  if (['cancelled', 'unavailable', 'high', 'critical'].includes(s)) return 'destructive'
  if (['scheduled', 'assigned'].includes(s)) return 'primary'
  return 'secondary'
}

export function Badge({
  children,
  variant,
  status,
  dot = false,
  className = '',
  ...props
}) {
  // If status is passed without variant, infer variant from status
  const effectiveVariant = variant || (status ? getStatusVariant(status) : 'default')
  const content = children || status

  return (
    <span
      className={`ui-badge ui-badge-${effectiveVariant} ${className}`.trim()}
      {...props}
    >
      {dot && <span className="ui-badge-dot" />}
      {content}
    </span>
  )
}

export default Badge
