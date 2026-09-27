import { useEffect, useState } from 'react'
import { Plus, UserCheck, Calendar, Clock, Phone, Trash2, CheckCircle, Search, Filter } from 'lucide-react'
import { getDoctors, createDoctor, updateDoctor, deleteDoctor, getDoctorSchedule } from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'

const SPECIALIZATIONS = [
  'General Physician', 'Pediatrician', 'Cardiologist', 'Orthopedic',
  'Dermatologist', 'Gynecologist', 'ENT Specialist', 'Other'
]

const emptyForm = {
  name: '',
  specialization: 'General Physician',
  phone: '',
  available_days: 'Mon-Fri',
  start_time: '10:00',
  end_time: '14:00',
  status: 'Available'
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('directory') // 'directory' | 'schedule'
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [search, setSearch] = useState('')

  // Schedule View state
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleData, setScheduleData] = useState(null)
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  const fetchDoctorsList = () => {
    setLoading(true)
    getDoctors().then(r => {
      setDoctors(r.data)
      if (r.data.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(r.data[0].id)
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDoctorsList()
  }, [])

  const fetchSchedule = (docId, dateStr) => {
    if (!docId) return
    setLoadingSchedule(true)
    getDoctorSchedule(docId, dateStr)
      .then(r => setScheduleData(r.data))
      .catch(() => setScheduleData(null))
      .finally(() => setLoadingSchedule(false))
  }

  useEffect(() => {
    if (activeTab === 'schedule' && selectedDoctorId) {
      fetchSchedule(selectedDoctorId, scheduleDate)
    }
  }, [activeTab, selectedDoctorId, scheduleDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createDoctor(form)
      showAlert('success', 'Doctor registered successfully')
      setShowModal(false)
      setForm(emptyForm)
      fetchDoctorsList()
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to add doctor')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (doctor) => {
    const nextStatus = doctor.status === 'Available' ? 'Unavailable' : 'Available'
    try {
      await updateDoctor(doctor.id, { status: nextStatus })
      showAlert('success', `${doctor.name} is now ${nextStatus}`)
      fetchDoctorsList()
      if (selectedDoctorId === doctor.id && activeTab === 'schedule') {
        fetchSchedule(doctor.id, scheduleDate)
      }
    } catch {
      showAlert('error', 'Failed to update doctor status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this doctor from the clinic?')) return
    try {
      await deleteDoctor(id)
      showAlert('success', 'Doctor removed')
      fetchDoctorsList()
    } catch {
      showAlert('error', 'Failed to remove doctor')
    }
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  )

  const openScheduleForDoctor = (docId) => {
    setSelectedDoctorId(docId)
    setActiveTab('schedule')
  }

  return (
    <div>
      <PageHeader
        title="Doctors & On-Call Directory"
        description="Manage clinical staff schedules, active on-duty availability, and shift assignments"
        badge={
          <span className="std-header-badge">
            <UserCheck size={13} style={{ color: 'var(--primary)' }} />
            <span>{doctors.filter(d => d.status === 'Available').length}/{doctors.length} On Duty</span>
          </span>
        }
        action={
          <Button variant="default" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
            <Plus size={16} /> Add Doctor
          </Button>
        }
      />

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {alert.msg}
        </div>
      )}

      {/* Standard Tab Switch */}
      <div className="std-tab-group">
        <button
          type="button"
          className={`std-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <UserCheck size={15} />
          <span>Doctor Directory ({doctors.length})</span>
        </button>
        <button
          type="button"
          className={`std-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={15} />
          <span>Doctor Schedule View</span>
        </button>
      </div>

      {/* Tab 1: Doctor Directory */}
      {activeTab === 'directory' && (
        <div>
          {/* Standard Compact Search & Filter Bar */}
          <div className="std-filter-bar">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, color: 'var(--muted-foreground)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
                placeholder="Search doctor by name or specialization..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
              {filteredDoctors.length} doctors found
            </span>
          </div>

          {loading ? (
            <div className="loader"><div className="spinner" /></div>
          ) : filteredDoctors.length === 0 ? (
            <div className="table-card">
              <div className="empty-state">
                <UserCheck size={36} />
                <p>No doctors found.</p>
              </div>
            </div>
          ) : (
            <div className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Specialization</th>
                      <th>Working Days</th>
                      <th>Working Hours</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div className="text-bold" style={{ fontSize: 13.5 }}>{doc.name}</div>
                        </td>
                        <td>
                          <span className="specialization-pill">
                            {doc.specialization}
                          </span>
                        </td>
                        <td>{doc.available_days}</td>
                        <td>
                          <div className="flex" style={{ fontSize: 13 }}>
                            <Clock size={14} color="var(--gray-500)" />
                            {doc.start_time} - {doc.end_time}
                          </div>
                        </td>
                        <td>
                          <div className="flex" style={{ fontSize: 13 }}>
                            <Phone size={14} color="var(--gray-500)" />
                            {doc.phone}
                          </div>
                        </td>
                        <td>
                          <Badge status={doc.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex" style={{ justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openScheduleForDoctor(doc.id)}
                            >
                              <Calendar size={14} /> Schedule
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleToggleStatus(doc)}
                            >
                              {doc.status === 'Available' ? 'Set Unavailable' : 'Set Available'}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Doctor Schedule View */}
      {activeTab === 'schedule' && (
        <div>
          <div className="std-filter-bar">
            <span className="std-filter-label">
              <UserCheck size={14} /> Doctor:
            </span>
            <select
              className="form-control"
              style={{ width: 260, height: 36, fontSize: 13 }}
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(Number(e.target.value))}
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization}) - {d.status}
                </option>
              ))}
            </select>

            <span className="std-filter-label" style={{ marginLeft: 8 }}>
              <Calendar size={14} /> Date:
            </span>
            <input
              type="date"
              className="form-control"
              style={{ width: 150, height: 36, fontSize: 13 }}
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
            />

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setScheduleDate(new Date().toISOString().split('T')[0])}
            >
              Today
            </button>
          </div>

          {loadingSchedule ? (
            <div className="loader"><div className="spinner" /></div>
          ) : !scheduleData ? (
            <div className="table-card">
              <div className="empty-state">
                <Calendar size={36} />
                <p>Select a doctor and date to view schedule.</p>
              </div>
            </div>
          ) : (
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h3 className="table-card-title">{scheduleData.doctor_name} — {scheduleData.specialization}</h3>
                  <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Date: <strong>{scheduleData.date}</strong> | Working Day: {scheduleData.works_today ? '✅ On Duty' : '❌ Off Duty'} | Status: <Badge status={scheduleData.doctor_status} />
                  </p>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time Slot</th>
                      <th>Status</th>
                      <th>Assigned Patient</th>
                      <th>Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.slots.map(slot => (
                      <tr key={slot.time} className={slot.available ? 'slot-row-avail' : 'slot-row-busy'}>
                        <td className="text-bold flex">
                          <Clock size={14} color="var(--primary)" />
                          {slot.time}
                        </td>
                        <td>
                          {slot.available ? (
                            <Badge status="available" dot>
                              AVAILABLE
                            </Badge>
                          ) : slot.status === 'OFF_DUTY' ? (
                            <Badge status="cancelled">
                              OFF DUTY
                            </Badge>
                          ) : slot.status === 'UNAVAILABLE' ? (
                            <Badge status="unavailable">
                              DOCTOR UNAVAILABLE
                            </Badge>
                          ) : (
                            <Badge status={slot.status} />
                          )}
                        </td>
                        <td>
                          {slot.patient_name ? (
                            <span className="text-bold">{slot.patient_name}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {slot.reason || (slot.available ? 'Ready for patient assignment' : '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showModal && (
        <Modal
          title="Register New Doctor"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Register Doctor'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Doctor Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Dr. Priya Sharma"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Specialization *</label>
                <select
                  className="form-control"
                  value={form.specialization}
                  onChange={e => setForm({ ...form, specialization: e.target.value })}
                >
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Available Working Days *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Mon-Fri or Mon-Sat"
                  value={form.available_days}
                  onChange={e => setForm({ ...form, available_days: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Time (HH:MM) *</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time (HH:MM) *</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Initial Status</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
