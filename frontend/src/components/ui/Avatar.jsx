import React from 'react'

export function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  status, // 'online' | 'busy' | 'offline' | 'on-call'
  className = '',
  ...props
}) {
  const getInitials = (n) => {
    if (!n) return '?'
    const parts = n.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  const sizeClass = {
    sm: 'ui-avatar-sm',
    md: 'ui-avatar-md',
    lg: 'ui-avatar-lg',
    xl: 'ui-avatar-xl'
  }[size] || 'ui-avatar-md'

  return (
    <div className={`ui-avatar ${sizeClass} ${className}`.trim()} {...props}>
      {src ? (
        <img src={src} alt={alt || name} className="ui-avatar-img" />
      ) : (
        <span className="ui-avatar-fallback">{getInitials(name || alt)}</span>
      )}
      {status && <span className={`ui-avatar-status status-${status}`} />}
    </div>
  )
}

export default Avatar
