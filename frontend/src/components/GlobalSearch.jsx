import React, { useState, useEffect, useRef } from 'react'
import { Search, User, FileText, Activity, ChevronRight, X, Phone, HeartPulse } from 'lucide-react'
import { getPatients, getDoctors } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function GlobalSearch({ onSelectPatient }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('patients') // 'patients' | 'conditions' | 'doctors'
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    getPatients().then(r => setPatients(r.data || [])).catch(() => {})
    getDoctors().then(r => setDoctors(r.data || [])).catch(() => {})
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const q = query.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      String(p.id).includes(q) ||
      p.location?.toLowerCase().includes(q)
    )
  })

  // Filter doctors
  const filteredDoctors = doctors.filter(d => {
    const q = query.toLowerCase()
    return (
      d.name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.phone?.includes(q)
    )
  })

  // Sample conditions derived from appointments or standard clinical list
  const conditions = [
    { name: 'Acute Hypertension', category: 'Cardiovascular', risk: 'Urgent' },
    { name: 'High Fever & Chills', category: 'Infectious', risk: 'Routine' },
    { name: 'Fracture / Trauma', category: 'Orthopedics', risk: 'Critical' },
    { name: 'Type 2 Diabetes', category: 'Endocrinology', risk: 'Routine' },
    { name: 'Severe Chest Pain', category: 'Emergency', risk: 'Critical' },
  ].filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))

  const handleSelectPatient = (p) => {
    setIsOpen(false)
    setQuery('')
    if (onSelectPatient) {
      onSelectPatient(p)
    } else {
      navigate('/patients')
    }
  }

  const handleSelectDoctor = (d) => {
    setIsOpen(false)
    setQuery('')
    navigate('/doctors')
  }

  return (
    <div className="global-search-container" ref={containerRef}>
      <div className="global-search-input-wrap">
        <Search size={16} className="global-search-icon" />
        <input
          type="text"
          className="global-search-input"
          placeholder="Search Patient Name, MRN..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
        />
        {query && (
          <button
            type="button"
            className="global-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="global-search-popover">
          {/* Tab Selector */}
          <div className="search-tab-bar">
            <button
              type="button"
              className={`search-tab-pill ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveTab('patients')}
            >
              <User size={13} />
              <span>Patients</span>
            </button>
            <button
              type="button"
              className={`search-tab-pill ${activeTab === 'conditions' ? 'active' : ''}`}
              onClick={() => setActiveTab('conditions')}
            >
              <HeartPulse size={13} />
              <span>Medical Conditions</span>
            </button>
            <button
              type="button"
              className={`search-tab-pill ${activeTab === 'doctors' ? 'active' : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <Activity size={13} />
              <span>Doctors & Care <ChevronRight size={11} /></span>
            </button>
          </div>

          {/* Results List */}
          <div className="search-results-list">
            {activeTab === 'patients' && (
              filteredPatients.length === 0 ? (
                <div className="search-empty">No matching patients found.</div>
              ) : (
                filteredPatients.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="search-result-item"
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div className="search-item-avatar">
                      <User size={16} />
                    </div>
                    <div className="search-item-info">
                      <div className="search-item-name">{p.name}</div>
                      <div className="search-item-sub">
                        <span>MRN: 349{p.id}89</span>
                        <span className="bullet-sep">•</span>
                        <span>Phone: {p.phone}</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'conditions' && (
              conditions.length === 0 ? (
                <div className="search-empty">No matching conditions.</div>
              ) : (
                conditions.map((c, i) => (
                  <div key={i} className="search-result-item" onClick={() => { setIsOpen(false); navigate('/appointments') }}>
                    <div className="search-item-avatar condition">
                      <HeartPulse size={16} />
                    </div>
                    <div className="search-item-info">
                      <div className="search-item-name">{c.name}</div>
                      <div className="search-item-sub">
                        <span>Category: {c.category}</span>
                        <span className="bullet-sep">•</span>
                        <span className={`risk-tag ${c.risk.toLowerCase()}`}>{c.risk}</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'doctors' && (
              filteredDoctors.length === 0 ? (
                <div className="search-empty">No doctors found.</div>
              ) : (
                filteredDoctors.slice(0, 5).map((d) => (
                  <div key={d.id} className="search-result-item" onClick={() => handleSelectDoctor(d)}>
                    <div className="search-item-avatar doctor">
                      <Activity size={16} />
                    </div>
                    <div className="search-item-info">
                      <div className="search-item-name">{d.name}</div>
                      <div className="search-item-sub">
                        <span>{d.specialization}</span>
                        <span className="bullet-sep">•</span>
                        <span>{d.available_days} ({d.start_time}-{d.end_time})</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
