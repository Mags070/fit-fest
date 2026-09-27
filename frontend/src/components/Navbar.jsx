import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, AlertTriangle,
  Droplets, Activity, Bell, Building2
} from 'lucide-react'

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients',    icon: Users,           label: 'Patients' },
  { to: '/appointments',icon: Calendar,        label: 'Appointments' },
  { to: '/reminders',   icon: Bell,            label: 'Reminders' },
  { to: '/emergency',   icon: AlertTriangle,   label: 'Emergency', section: 'Emergency' },
  { to: '/blood',       icon: Droplets,        label: 'Blood Search' },
  { to: '/hospitals',   icon: Building2,       label: 'Hospitals & Directory' },
]

export default function Navbar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Activity size={20} color="white" />
        </div>
        <div>
          <h1>Healthcare</h1>
          <span>Coordinator</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Main</div>

        {navItems.map(({ to, icon: Icon, label, section }) => (
          <React.Fragment key={to}>
            {section && <div className="nav-section">{section}</div>}
            <NavLink
              to={to}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              end={to === '/'}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </React.Fragment>
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid #374151', fontSize: '11px', color: '#6b7280' }}>
        MVP v2.0 · {new Date().toLocaleDateString()}
      </div>
    </aside>
  )
}
