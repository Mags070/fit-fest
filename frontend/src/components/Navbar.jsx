import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, AlertTriangle,
  Droplets, Bell, Building2, UserCheck, LogOut,
  Hexagon, Stethoscope
} from 'lucide-react'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients',     icon: Users,           label: 'Patients' },
  { to: '/doctors',      icon: UserCheck,       label: 'Doctors & On-Call' },
  { to: '/appointments', icon: Calendar,        label: 'Appointments & Heatmap' },
  { to: '/reminders',    icon: Bell,            label: 'Follow-ups' },
  { to: '/emergency',    icon: AlertTriangle,   label: 'Emergency Dispatch' },
  { to: '/blood',        icon: Droplets,        label: 'Blood Bank' },
  { to: '/hospitals',    icon: Building2,       label: 'Hospital Directory' },
]

export default function Navbar() {
  return (
    <aside className="slim-sidebar">
      {/* Top Logo */}
      <div className="slim-logo-wrap" title="Koru Healthcare Coordinator">
        <div className="slim-logo-gem">
          <Hexagon size={24} className="gem-icon" />
          <span className="gem-inner-dot" />
        </div>
      </div>

      {/* Nav Icons */}
      <nav className="slim-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `slim-nav-item ${isActive ? 'active' : ''}`}
            aria-label={label}
          >
            <span className="slim-active-bar" />
            <div className="slim-icon-box">
              <Icon size={20} />
            </div>
            <span className="slim-tooltip">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Action */}
      <div className="slim-sidebar-footer">
        <button
          type="button"
          className="slim-nav-item logout-btn"
          aria-label="Clinical Session Active"
          onClick={() => {}}
        >
          <div className="slim-icon-box">
            <LogOut size={18} />
          </div>
          <span className="slim-tooltip">Session Active</span>
        </button>
      </div>
    </aside>
  )
}
