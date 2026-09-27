import React from 'react'
import { Bell, Settings, Activity } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import ThemeToggle from './ThemeToggle'
import { Avatar } from './ui/Avatar'

export default function Header() {
  return (
    <header className="app-topbar">
      {/* Clinic System Status */}
      <div className="topbar-brand">
        <div className="topbar-live-dot" />
        <span className="topbar-brand-title">Central Hospital Operations Hub</span>
        <span className="topbar-badge">Live Triage</span>
      </div>

      {/* Global Command Search */}
      <div className="topbar-search-wrap">
        <GlobalSearch />
      </div>

      {/* Action Controls & Profile */}
      <div className="topbar-actions">
        <ThemeToggle />

        <button
          type="button"
          className="topbar-icon-btn"
          title="Clinical Notifications (3 pending)"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="topbar-badge-dot" />
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          title="System Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        <div className="topbar-user" title="Dr. Sarah Chen • Duty Clinician">
          <Avatar name="Sarah Chen" size="sm" status="online" />
          <div className="topbar-user-text">
            <span className="topbar-user-name">Dr. S. Chen</span>
            <span className="topbar-user-role">Duty Physician</span>
          </div>
        </div>
      </div>
    </header>
  )
}
