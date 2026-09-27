import React from 'react'

export default function PageHeader({
  title,
  description,
  action,
  badge,
  children,
  className = '',
}) {
  return (
    <div className={`std-page-header ${className}`.trim()}>
      <div className="std-page-header-top">
        <div className="std-page-header-text">
          <div className="std-title-wrap">
            <h1 className="std-page-title">{title}</h1>
            {badge && <span className="std-header-badge">{badge}</span>}
          </div>
          {description && <p className="std-page-desc">{description}</p>}
        </div>

        {action && (
          <div className="std-header-action">
            {action}
          </div>
        )}
      </div>

      {children && (
        <div className="std-page-header-children">
          {children}
        </div>
      )}
    </div>
  )
}
