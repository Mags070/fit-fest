import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, CheckCircle, Filter, UserCheck, Clock, Check, X, AlertTriangle, Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import {
  getAppointments, createAppointment, updateApptStatus,
  deleteAppointment, getPatients, getDoctors, getAvailableDoctors, autoAssignDoctor
} from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import ActivityHeatmap from '../components/ui/ActivityHeatmap'

const STATUSES   = ['Scheduled', 'Completed', 'Cancelled']
const SEVERITIES = ['ROUTINE', 'URGENT', 'CRITICAL']
const REASONS    = ['General Consultation', 'Follow-up Check', 'Blood Test Review', 'Routine Check-up',
                    'Prescription Renewal', 'Administrative Query', 'High Fever & Chills', 'Severe Chest Pain', 'Acute Hypertension', 'Other']

const emptyForm = {
  patient_id: '',
  doctor_id: '',
  appointment_date: new Date().toISOString().split('T')[0],
  appointment_time: '10:30',
  reason: 'General Consultation',
  status: 'Scheduled',
  severity: 'ROUTINE',
}

export default function Appointments() {
  const [searchParams] = useSearchParams()
  const initialDate = searchParams.get('date') || ''

  const [appts, setAppts]       = useState([])
  const [allAppts, setAllAppts] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [alert, setAlert]       = useState(null)

  // Filters
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterDoctor, setFilterDoctor]     = useState('')
  const [filterDate, setFilterDate]         = useState(initialDate)

  // Availability & Auto-Assignment State in Modal
  const [availabilityData, setAvailabilityData] = useState(null) // { available_doctors: [], unavailable_doctors: [] }
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [autoAssignment, setAutoAssignment] = useState(null)
  const [availabilityError, setAvailabilityError] = useState(null)

  const fetchAll = () => {
    setLoading(true)
    const params = {}
    if (filterStatus)   params.status    = filterStatus
    if (filterSeverity) params.severity  = filterSeverity
    if (filterDoctor)   params.doctor_id = filterDoctor
    if (filterDate)     params.date_filter = filterDate
    getAppointments(params).then(r => setAppts(r.data)).finally(() => setLoading(false))
  }

  const fetchHeatmapData = () => {
    getAppointments().then(r => setAllAppts(r.data || [])).catch(() => {})
  }

  useEffect(() => { fetchAll() }, [filterStatus, filterSeverity, filterDoctor, filterDate])
  useEffect(() => {
    fetchHeatmapData()
    getPatients().then(r => setPatients(r.data))
    getDoctors().then(r => setDoctors(r.data))
  }, [])

  const openBookModal = () => {
    setForm(emptyForm)
    setAvailabilityData(null)
    setAutoAssignment(null)
    setAvailabilityError(null)
    setShowModal(true)
  }

  const handleCheckAvailability = async () => {
    setAvailabilityError(null)

    // Validation
    if (!form.appointment_date) {
      setAvailabilityError('Please select an appointment date.')
      return
    }
    if (!form.appointment_time) {
      setAvailabilityError('Please select an appointment time.')
      return
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (form.appointment_date < todayStr) {
      setAvailabilityError('Please select today or a future date.')
      return
    }

    setCheckingAvailability(true)
    try {
      const res = await getAvailableDoctors(form.appointment_date, form.appointment_time)
      setAvailabilityData(res.data)

      // If previously selected doctor is now unavailable in this check, reset selection
      if (form.doctor_id) {
        const stillAvail = res.data.available_doctors?.some(d => d.id === parseInt(form.doctor_id))
        if (!stillAvail) {
          setForm(prev => ({ ...prev, doctor_id: '' }))
          setAutoAssignment(null)
        }
      }
    } catch (err) {
      setAvailabilityError(err.response?.data?.detail || 'Unable to check doctor availability.')
      setAvailabilityData(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleAutoAssign = async () => {
    setAvailabilityError(null)

    if (!form.appointment_date) {
      setAvailabilityError('Please select an appointment date.')
      return
    }
    if (!form.appointment_time) {
      setAvailabilityError('Please select an appointment time.')
      return
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (form.appointment_date < todayStr) {
      setAvailabilityError('Please select today or a future date.')
      return
    }

    setAutoAssigning(true)
    try {
      const res = await autoAssignDoctor({
        patient_id: form.patient_id ? parseInt(form.patient_id) : undefined,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        reason: form.reason
      })

      setForm(prev => ({ ...prev, doctor_id: res.data.doctor.id }))
      setAutoAssignment(res.data)

      // Also refresh available doctors list in background
      try {
        const availRes = await getAvailableDoctors(form.appointment_date, form.appointment_time)
        setAvailabilityData(availRes.data)
      } catch {
        // secondary catch
      }
    } catch (err) {
      setAvailabilityError(err.response?.data?.detail || 'No doctors are available for the selected date and time.')
      setAutoAssignment(null)
    } finally {
      setAutoAssigning(false)
    }
  }

  const handleSelectDoctor = (doc) => {
    setForm(prev => ({ ...prev, doctor_id: doc.id }))
    if (autoAssignment && autoAssignment.doctor?.id !== doc.id) {
      setAutoAssignment(null)
    }
  }

  const handleDeselectDoctor = () => {
    setForm(prev => ({ ...prev, doctor_id: '' }))
    setAutoAssignment(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patient_id) return showAlert('error', 'Please select a patient.')
    setSaving(true)
    try {
      const payload = {
        ...form,
        patient_id: parseInt(form.patient_id),
        doctor_id: form.doctor_id ? parseInt(form.doctor_id) : null
      }
      await createAppointment(payload)
      showAlert('success', 'Appointment created successfully!')
      setShowModal(false)
      fetchAll()
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to book appointment.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateApptStatus(id, status)
      fetchAll()
      showAlert('success', `Status updated to ${status}`)
    } catch {
      showAlert('error', 'Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this appointment?')) return
    await deleteAppointment(id)
    fetchAll()
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3500)
  }

  const selectedDoctorObj = form.doctor_id
    ? (availabilityData?.available_doctors?.find(d => d.id === parseInt(form.doctor_id)) ||
       doctors.find(d => d.id === parseInt(form.doctor_id)))
    : null

  return (
    <div>
      <PageHeader
        title="Appointments & Consultations"
        description="Book, check real-time doctor availability, triage acuity, and inspect appointment density"
        badge={
          <span className="std-header-badge">
            <CalendarIcon size={13} style={{ color: 'var(--primary)' }} />
            <span>{appts.length} Records</span>
          </span>
        }
        action={
          <Button variant="default" onClick={openBookModal}>
            <Plus size={16} /> Book Appointment
          </Button>
        }
      />

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {alert.msg}
        </div>
      )}

      {/* Heatmap Calendar Activity Density */}
      <div style={{ marginBottom: 20 }}>
        <ActivityHeatmap
          appointments={allAppts}
          weeksToShow={22}
          selectedDate={filterDate}
          onDateClick={(date) => {
            setFilterDate(prev => prev === date ? '' : date)
          }}
        />
      </div>

      {/* Compact Standard Filter Bar */}
      <div className="std-filter-bar">
        <span className="std-filter-label">
          <Filter size={14} /> Filter:
        </span>
        <select
          className="form-control"
          style={{ width: 140, height: 34, fontSize: 13 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          className="form-control"
          style={{ width: 140, height: 34, fontSize: 13 }}
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          className="form-control"
          style={{ width: 180, height: 34, fontSize: 13 }}
          value={filterDoctor}
          onChange={e => setFilterDoctor(e.target.value)}
        >
          <option value="">All Doctors</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input
          type="date"
          className="form-control"
          style={{ width: 150, height: 34, fontSize: 13 }}
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        {(filterStatus || filterSeverity || filterDoctor || filterDate) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterDoctor(''); setFilterDate('') }}
          >
            Clear Filters
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
          {appts.length} appointments found
        </span>
      </div>

      {/* Standard Table Card */}
      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-card-title">Appointments Directory ({appts.length})</h3>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            {filterDate ? `Showing date: ${filterDate}` : 'All scheduled & past encounters'}
          </span>
        </div>
          {loading ? (
            <div className="loader"><div className="spinner" /></div>
          ) : appts.length === 0 ? (
            <div className="empty-state">
              <p>No appointments found. Book the first one!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Assigned Doctor</th>
                    <th>Reason</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="text-bold">{a.patient_name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{a.patient_phone}</div>
                      </td>
                      <td>
                        <div>{a.appointment_date}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{a.appointment_time}</div>
                      </td>
                      <td>
                        {a.doctor_name ? (
                          <div>
                            <div className="text-bold flex" style={{ gap: 4 }}>
                              <UserCheck size={14} color="var(--primary)" />
                              {a.doctor_name}
                            </div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{a.doctor_specialization}</div>
                          </div>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td>{a.reason}</td>
                      <td><Badge status={a.severity || 'ROUTINE'} /></td>
                      <td><Badge status={a.status} /></td>
                      <td>
                        <div className="flex" style={{ flexWrap: 'wrap', gap: 4 }}>
                          {STATUSES.filter(s => s !== a.status).map(s => (
                            <button key={s} className="btn btn-ghost btn-sm"
                              onClick={() => handleStatusChange(a.id, s)}>
                              → {s}
                            </button>
                          ))}
                          <button className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDelete(a.id)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <Modal
          title="Book Appointment"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Booking…' : (form.doctor_id ? 'Confirm Appointment' : 'Book Appointment')}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Patient */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Patient *</label>
                <select
                  className="form-control"
                  value={form.patient_id}
                  onChange={e => setForm({ ...form, patient_id: e.target.value })}
                  required
                >
                  <option value="">— Select patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.appointment_date}
                  onChange={e => {
                    setForm({ ...form, appointment_date: e.target.value })
                    setAvailabilityData(null)
                    setAutoAssignment(null)
                  }}
                  required
                />
              </div>

              {/* Time */}
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.appointment_time}
                  onChange={e => {
                    setForm({ ...form, appointment_time: e.target.value })
                    setAvailabilityData(null)
                    setAutoAssignment(null)
                  }}
                  required
                />
              </div>

              {/* Check Doctor Availability & Auto-Assign Actions */}
              <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ justifyContent: 'center', height: 38 }}
                    onClick={handleCheckAvailability}
                    disabled={checkingAvailability || autoAssigning}
                  >
                    <UserCheck size={16} />
                    {checkingAvailability ? 'Checking…' : 'Check Availability'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ justifyContent: 'center', height: 38, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                    onClick={handleAutoAssign}
                    disabled={autoAssigning || checkingAvailability}
                  >
                    <Sparkles size={16} />
                    {autoAssigning ? 'Auto-Assigning…' : 'Auto Assign Doctor'}
                  </button>
                </div>

                {availabilityError && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', background: '#fee2e2',
                    borderRadius: 6, color: '#dc2626', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center'
                  }}>
                    <AlertTriangle size={15} />
                    <span>{availabilityError}</span>
                  </div>
                )}
              </div>

              {/* Suggested / Automatic Assignment Card */}
              {autoAssignment && (
                <div className="auto-assign-banner">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div className="auto-assign-badge">
                        <Sparkles size={13} /> Suggested Assignment
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>
                          {autoAssignment.doctor.name}
                        </span>
                        <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
                          {autoAssignment.doctor.specialization}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                        Hours: {autoAssignment.doctor.working_hours}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        <span className="workload-tag">
                          <Clock size={12} />
                          {autoAssignment.appointments_today === 0
                            ? '0 active appointments today'
                            : `${autoAssignment.appointments_today} active appointment${autoAssignment.appointments_today > 1 ? 's' : ''} today`}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
                          • {autoAssignment.reason}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                      onClick={handleDeselectDoctor}
                    >
                      Choose Another Doctor
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Doctor Indicator (Manual) */}
              {!autoAssignment && selectedDoctorObj && (
                <div className="doctor-selected-banner">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>Selected Doctor</div>
                    <div className="text-bold" style={{ fontSize: 14 }}>{selectedDoctorObj.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{selectedDoctorObj.specialization}</div>
                    {selectedDoctorObj.appointments_today !== undefined && (
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                        {selectedDoctorObj.appointments_today} active appointments today
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={handleDeselectDoctor}
                  >
                    Deselect
                  </button>
                </div>
              )}

              {/* Availability Results Section */}
              {availabilityData && (
                <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                  {/* AVAILABLE DOCTORS */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--success)',
                      letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <span>✓</span> AVAILABLE DOCTORS ({availabilityData.available_doctors?.length || 0})
                    </div>

                    {(!availabilityData.available_doctors || availabilityData.available_doctors.length === 0) ? (
                      <div className="alert alert-warning" style={{
                        padding: '12px 16px', borderRadius: 8,
                        fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                        backgroundColor: 'var(--warning-light)', color: 'var(--warning)'
                      }}>
                        <AlertTriangle size={16} />
                        <span>No doctors are available for the selected time.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                        {availabilityData.available_doctors.map(doc => {
                          const isSelected = String(form.doctor_id) === String(doc.id)
                          return (
                            <div
                              key={doc.id}
                              className={`doctor-card-box avail ${isSelected ? 'selected' : ''}`}
                            >
                              <div>
                                <div className="flex-between">
                                  <div className="text-bold doc-name-avail">
                                    ✓ {doc.name}
                                  </div>
                                </div>
                                <div className="doc-spec-avail" style={{ marginTop: 2 }}>{doc.specialization}</div>
                                <div className="doc-time-avail" style={{ marginTop: 4 }}>
                                  {doc.working_hours || `${doc.start_time} - ${doc.end_time}`}
                                </div>
                                <div className="doc-workload-tag" style={{ marginTop: 6 }}>
                                  <Clock size={11} />
                                  {doc.appointments_today === 0
                                    ? '0 booked today'
                                    : `${doc.appointments_today} booked today`}
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ alignSelf: 'flex-start', marginTop: 4 }}
                                onClick={() => handleSelectDoctor(doc)}
                              >
                                {isSelected ? <><Check size={14} /> Selected</> : `Select ${doc.name.split(' ')[1] || doc.name}`}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* UNAVAILABLE DOCTORS */}
                  {availabilityData.unavailable_doctors && availabilityData.unavailable_doctors.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--danger)',
                        letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        <span>✕</span> UNAVAILABLE DOCTORS ({availabilityData.unavailable_doctors.length})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                        {availabilityData.unavailable_doctors.map(doc => (
                          <div
                            key={doc.id}
                            className="doctor-card-box unavail"
                          >
                            <div className="text-bold doc-name-unavail">
                              ✕ {doc.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{doc.specialization}</div>
                            <div>
                              <span className="doc-reason-unavail">
                                Reason: {doc.reason}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Reason for Visit *</label>
                <select
                  className="form-control"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                >
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              {/* Severity */}
              <div className="form-group">
                <label>Patient Severity *</label>
                <select
                  className="form-control"
                  value={form.severity}
                  onChange={e => setForm({ ...form, severity: e.target.value })}
                >
                  {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Initial Status */}
              <div className="form-group">
                <label>Initial Status</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
