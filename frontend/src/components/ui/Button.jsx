import React from 'react'

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) {
  const variantClass = {
    default: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    destructive: 'btn-danger',
    success: 'btn-success',
  }[variant] || 'btn-primary'

  const sizeClass = {
    sm: 'btn-sm',
    default: '',
    lg: 'btn-lg',
    icon: 'btn-icon',
  }[size] || ''

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  )
}

export default Button
