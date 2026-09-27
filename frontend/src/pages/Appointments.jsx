import { useEffect, useState } from 'react'
import { Plus, CheckCircle, Filter, UserCheck, Clock } from 'lucide-react'
import {
  getAppointments, createAppointment, updateApptStatus,
  deleteAppointment, getPatients, getDoctors, getAvailableDoctors
} from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'

const STATUSES   = ['Scheduled', 'Completed', 'Cancelled']
const SEVERITIES = ['ROUTINE', 'URGENT', 'CRITICAL']
const REASONS    = ['General Consultation', 'Follow-up Check', 'Blood Test Review', 'Routine Check-up',
                    'Prescription Renewal', 'Administrative Query', 'High Fever & Chills', 'Severe Chest Pain', 'Acute Hypertension', 'Other']

const emptyForm = {
  patient_id: '',
  doctor_id: '',
  appointment_date: new Date().toISOString().split('T')[0],
  appointment_time: '10:00',
  reason: 'General Consultation',
  status: 'Scheduled',
  severity: 'ROUTINE',
}

export default function Appointments() {
  const [appts, setAppts]       = useState([])
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
  const [filterDate, setFilterDate]         = useState('')

  // Available Doctors in Modal
  const [availableDoctors, setAvailableDoctors] = useState([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)

  const fetchAll = () => {
    setLoading(true)
    const params = {}
    if (filterStatus)   params.status    = filterStatus
    if (filterSeverity) params.severity  = filterSeverity
    if (filterDoctor)   params.doctor_id = filterDoctor
    if (filterDate)     params.date_filter = filterDate
    getAppointments(params).then(r => setAppts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [filterStatus, filterSeverity, filterDoctor, filterDate])
  useEffect(() => {
    getPatients().then(r => setPatients(r.data))
    getDoctors().then(r => setDoctors(r.data))
  }, [])

  // Whenever modal is open and date/time change, check available doctors
  useEffect(() => {
    if (showModal && form.appointment_date && form.appointment_time) {
      setLoadingAvailable(true)
      getAvailableDoctors(form.appointment_date, form.appointment_time)
        .then(r => {
          setAvailableDoctors(r.data)
          // If current selected doctor is not available, reset or auto-select first available
          if (form.doctor_id) {
            const stillAvailable = r.data.some(d => d.id === parseInt(form.doctor_id))
            if (!stillAvailable) {
              setForm(prev => ({ ...prev, doctor_id: '' }))
            }
          }
        })
        .catch(() => setAvailableDoctors([]))
        .finally(() => setLoadingAvailable(false))
    }
  }, [showModal, form.appointment_date, form.appointment_time])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patient_id) return showAlert('error', 'Please select a patient')
    setSaving(true)
    try {
      const payload = {
        ...form,
        patient_id: parseInt(form.patient_id),
        doctor_id: form.doctor_id ? parseInt(form.doctor_id) : null
      }
      await createAppointment(payload)
      showAlert('success', 'Appointment booked and doctor assigned successfully')
      setShowModal(false)
      fetchAll()
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to book appointment')
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
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Appointments</h2>
          <p>Book, view, and assign doctors to patient appointments</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <CheckCircle size={16} /> {alert.msg}
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 10 }}>
              <Filter size={16} color="var(--gray-500)" />
              <span className="text-muted">Filter:</span>
              <select className="form-control" style={{ width: 140 }}
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="form-control" style={{ width: 140 }}
                value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                <option value="">All Severities</option>
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="form-control" style={{ width: 180 }}
                value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}>
                <option value="">All Doctors</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="date" className="form-control" style={{ width: 160 }}
                value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              {(filterStatus || filterSeverity || filterDoctor || filterDate) && (
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterDoctor(''); setFilterDate('') }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <h3>Appointments ({appts.length})</h3>
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
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title="Book Appointment & Assign Doctor"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Booking…' : 'Assign & Book'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Patient *</label>
                <select className="form-control" value={form.patient_id}
                  onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
                  <option value="">— Select patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" className="form-control" value={form.appointment_date}
                  onChange={e => setForm({ ...form, appointment_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input type="time" className="form-control" value={form.appointment_time}
                  onChange={e => setForm({ ...form, appointment_time: e.target.value })} required />
              </div>

              {/* Available Doctors Selector */}
              <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Available Doctors for {form.appointment_date} at {form.appointment_time}:</span>
                  {loadingAvailable && <span className="text-muted" style={{ fontSize: 11 }}>Checking availability…</span>}
                </label>

                {loadingAvailable ? (
                  <div style={{ padding: 10, textAlign: 'center', fontSize: 12, color: 'var(--gray-500)' }}>
                    Checking doctor schedules…
                  </div>
                ) : availableDoctors.length === 0 ? (
                  <div style={{
                    padding: '12px 16px', background: '#fee2e2', borderRadius: 8,
                    color: '#b91c1c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span>⚠️</span>
                    <span>No doctors available for the selected time. Please change time or proceed as unassigned.</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 4 }}>
                    <div
                      onClick={() => setForm({ ...form, doctor_id: '' })}
                      style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        border: !form.doctor_id ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                        background: !form.doctor_id ? 'var(--primary-light)' : 'white'
                      }}
                    >
                      <div className="text-bold" style={{ fontSize: 13 }}>No Doctor (Walk-in)</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Leave unassigned</div>
                    </div>
                    {availableDoctors.map(doc => {
                      const isSelected = String(form.doctor_id) === String(doc.id)
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setForm({ ...form, doctor_id: doc.id })}
                          style={{
                            padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                            background: isSelected ? 'var(--primary-light)' : 'white',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div className="flex-between">
                            <div className="text-bold" style={{ fontSize: 13 }}>{doc.name}</div>
                            <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>
                              Available
                            </span>
                          </div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{doc.specialization}</div>
                          <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                            Hours: {doc.start_time} - {doc.end_time} ({doc.available_days})
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Reason for Visit *</label>
                <select className="form-control" value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}>
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Patient Severity *</label>
                <select className="form-control" value={form.severity}
                  onChange={e => setForm({ ...form, severity: e.target.value })}>
                  {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Initial Status</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
