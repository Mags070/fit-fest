import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="theme-toggle-icon sun" />
      ) : (
        <Moon size={18} className="theme-toggle-icon moon" />
      )}
      <span className="theme-toggle-text">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}
