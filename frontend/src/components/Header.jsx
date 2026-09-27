import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Settings, LogOut, Calendar, ChevronDown, UserCheck, Shield } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import ThemeToggle from './ThemeToggle'
import { Avatar } from './ui/Avatar'

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    if (confirm('Sign out of active clinical session for Dr. Test1?')) {
      navigate('/doctors')
    }
  }

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
          onClick={() => setDropdownOpen(prev => !prev)}
        >
          <Settings size={18} />
        </button>

        {/* Interactive Doctor Profile with Hover & Click Dropdown */}
        <div
          className="topbar-profile-container"
          ref={dropdownRef}
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button
            type="button"
            className={`topbar-user ${dropdownOpen ? 'active' : ''}`}
            onClick={() => setDropdownOpen(prev => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Doctor profile menu"
          >
            <Avatar name="Test1 Doctor" size="sm" status="online" />
            <div className="topbar-user-text">
              <span className="topbar-user-name">Dr. Test1</span>
              <span className="topbar-user-role">Duty Physician</span>
            </div>
            <ChevronDown size={14} className={`topbar-chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>

          {/* Dropdown Menu on Hover / Click */}
          <div className={`topbar-profile-dropdown ${dropdownOpen ? 'show' : ''}`}>
            {/* User Header */}
            <div className="profile-dropdown-header">
              <Avatar name="Test1 Doctor" size="md" status="online" />
              <div className="profile-dropdown-info">
                <div className="profile-dropdown-name">Dr. Test1</div>
                <div className="profile-dropdown-badge">
                  <span className="topbar-live-dot" />
                  <span>On Duty • Live Session</span>
                </div>
              </div>
            </div>

            {/* Clinician Meta Info */}
            <div className="profile-meta-grid">
              <div className="profile-meta-item">
                <span className="meta-label">Doctor ID</span>
                <span className="meta-value doc-id-highlight">#DOC-8924</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Department</span>
                <span className="meta-value">Emergency & Triage</span>
              </div>
            </div>

            <div className="profile-dropdown-divider" />

            {/* Menu Links */}
            <div className="profile-menu-list">
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => { setDropdownOpen(false); navigate('/doctors') }}
              >
                <Calendar size={15} />
                <span>My Shift & Schedule</span>
              </button>

              <button
                type="button"
                className="profile-menu-item"
                onClick={() => {
                  setDropdownOpen(false)
                  alert('Doctor Settings & Identity: Dr. Test1 (ID: #DOC-8924)\nDepartment: Emergency & Acute Triage\nAccess Level: Senior Attending Physician')
                }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </button>
            </div>

            <div className="profile-dropdown-divider" />

            {/* Log Out */}
            <button
              type="button"
              className="profile-menu-item logout-item"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
