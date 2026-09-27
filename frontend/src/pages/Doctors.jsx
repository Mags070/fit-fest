import { useEffect, useState } from 'react'
import { Plus, UserCheck, Calendar, Clock, Phone, Trash2, CheckCircle, Search, Filter } from 'lucide-react'
import { getDoctors, createDoctor, updateDoctor, deleteDoctor, getDoctorSchedule } from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'

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
    <>
      <div className="page-header">
        <div>
          <h2>🩺 Doctors & Availability</h2>
          <p>Manage clinic doctors, working hours, and daily schedules</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
          <Plus size={16} /> Add Doctor
        </button>
      </div>

      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <CheckCircle size={16} /> {alert.msg}
          </div>
        )}

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button
            className={`btn ${activeTab === 'directory' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('directory')}
          >
            <UserCheck size={16} /> Doctor Directory ({doctors.length})
          </button>
          <button
            className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={16} /> Doctor Schedule View
          </button>
        </div>

        {/* Tab 1: Doctor Directory */}
        {activeTab === 'directory' && (
          <div>
            {/* Search */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div className="search-wrap">
                  <Search size={16} />
                  <input
                    className="form-control search-input"
                    placeholder="Search doctor by name or specialization..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loader"><div className="spinner" /></div>
            ) : filteredDoctors.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <UserCheck size={40} />
                  <p>No doctors found.</p>
                </div>
              </div>
            ) : (
              <div className="table-wrap card">
                <table>
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Specialization</th>
                      <th>Working Days</th>
                      <th>Working Hours</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div className="text-bold" style={{ fontSize: 14 }}>{doc.name}</div>
                        </td>
                        <td>
                          <span style={{
                            background: '#dbeafe', color: '#1e40af',
                            padding: '3px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600
                          }}>
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
                        <td>
                          <div className="flex" style={{ gap: 6 }}>
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
            )}
          </div>
        )}

        {/* Tab 2: Doctor Schedule View */}
        {activeTab === 'schedule' && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body" style={{ padding: '14px 20px' }}>
                <div className="flex" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                  <div className="form-group" style={{ minWidth: 220 }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Select Doctor</label>
                    <select
                      className="form-control"
                      value={selectedDoctorId}
                      onChange={e => setSelectedDoctorId(Number(e.target.value))}
                    >
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization}) - {d.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ minWidth: 180 }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Schedule Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div style={{ alignSelf: 'flex-end' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setScheduleDate(new Date().toISOString().split('T')[0])}
                    >
                      Today
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loadingSchedule ? (
              <div className="loader"><div className="spinner" /></div>
            ) : !scheduleData ? (
              <div className="card">
                <div className="empty-state">
                  <Calendar size={40} />
                  <p>Select a doctor and date to view schedule.</p>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>{scheduleData.doctor_name} — {scheduleData.specialization}</h3>
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
                        <tr key={slot.time} style={{ background: slot.available ? '#f0fdf4' : 'transparent' }}>
                          <td className="text-bold flex">
                            <Clock size={14} color="var(--primary)" />
                            {slot.time}
                          </td>
                          <td>
                            {slot.available ? (
                              <span style={{
                                background: '#dcfce7', color: '#15803d',
                                padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700
                              }}>
                                AVAILABLE
                              </span>
                            ) : slot.status === 'OFF_DUTY' ? (
                              <span style={{
                                background: '#f3f4f6', color: '#6b7280',
                                padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
                              }}>
                                OFF DUTY
                              </span>
                            ) : slot.status === 'UNAVAILABLE' ? (
                              <span style={{
                                background: '#fee2e2', color: '#dc2626',
                                padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
                              }}>
                                DOCTOR UNAVAILABLE
                              </span>
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
      </div>

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
    </>
  )
}
