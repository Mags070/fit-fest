import { useEffect, useState } from 'react'
import { Plus, CheckCircle, Filter } from 'lucide-react'
import { getAppointments, createAppointment, updateApptStatus, deleteAppointment, getPatients } from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'

const STATUSES   = ['Scheduled', 'Completed', 'Cancelled']
const SEVERITIES = ['ROUTINE', 'URGENT', 'CRITICAL']
const REASONS    = ['General Consultation', 'Follow-up Check', 'Blood Test Review', 'Routine Check-up',
                    'Prescription Renewal', 'Administrative Query', 'High Fever & Chills', 'Severe Chest Pain', 'Acute Hypertension', 'Other']

const emptyForm = {
  patient_id: '',
  appointment_date: new Date().toISOString().split('T')[0],
  appointment_time: '09:00',
  reason: 'General Consultation',
  status: 'Scheduled',
  severity: 'ROUTINE',
}

export default function Appointments() {
  const [appts, setAppts]       = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [alert, setAlert]       = useState(null)
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterDate, setFilterDate]         = useState('')

  const fetchAll = () => {
    setLoading(true)
    const params = {}
    if (filterStatus)   params.status   = filterStatus
    if (filterSeverity) params.severity = filterSeverity
    if (filterDate)     params.date_filter = filterDate
    getAppointments(params).then(r => setAppts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [filterStatus, filterSeverity, filterDate])
  useEffect(() => { getPatients().then(r => setPatients(r.data)) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patient_id) return showAlert('error', 'Please select a patient')
    setSaving(true)
    try {
      await createAppointment({ ...form, patient_id: parseInt(form.patient_id) })
      showAlert('success', 'Appointment booked successfully')
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
          <p>Book, view, and manage patient appointments and severity</p>
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
              <select className="form-control" style={{ width: 150 }}
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="form-control" style={{ width: 150 }}
                value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                <option value="">All Severities</option>
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
              <input type="date" className="form-control" style={{ width: 170 }}
                value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              {(filterStatus || filterSeverity || filterDate) && (
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterDate('') }}>Clear</button>
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
                        <div className="text-muted">{a.patient_phone}</div>
                      </td>
                      <td>
                        <div>{a.appointment_date}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{a.appointment_time}</div>
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
          title="Book Appointment"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Booking…' : 'Book Appointment'}
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
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Reason *</label>
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
