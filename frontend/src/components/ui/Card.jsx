import React from 'react'

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`ui-card ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`ui-card-header ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`ui-card-title ${className}`.trim()} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`ui-card-description ${className}`.trim()} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`ui-card-content ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`ui-card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export default Card
