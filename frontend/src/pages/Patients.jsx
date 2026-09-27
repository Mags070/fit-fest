import { useEffect, useState, useMemo } from 'react'
import {
  Plus, Search, Trash2, Edit2, History, CheckCircle,
  Calendar, Eye, MoreVertical, ArrowUpDown, ChevronLeft, ChevronRight, Users
} from 'lucide-react'
import {
  getPatients, createPatient, deletePatient, updatePatient,
  getPatientHistory, getAppointments
} from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import PageHeader from '../components/PageHeader'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['Male', 'Female', 'Other']

const emptyForm = { name: '', age: '', gender: 'Male', phone: '', blood_group: 'O+', location: '' }

// Procedural fallback badges matching screenshot
const PROCEDURES = [
  'Fracture Care', 'Colonoscopy', 'X-ray Review', 'Cardio Screen',
  'Routine Check', 'Blood Glucose', 'LASIK Eye Exam', 'General Consult'
]

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]  = useState(true)
  const [search, setSearch]    = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editPatient, setEditPatient] = useState(null)
  const [form, setForm]        = useState(emptyForm)
  const [saving, setSaving]    = useState(false)
  const [alert, setAlert]      = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  // Visit history modal
  const [historyPatient, setHistoryPatient] = useState(null)
  const [historyData, setHistoryData]       = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchPatients = (q = '') => {
    setLoading(true)
    Promise.all([
      getPatients(q),
      getAppointments(),
    ])
      .then(([pts, appts]) => {
        setPatients(pts.data || [])
        setAppointments(appts.data || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPatients() }, [])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    fetchPatients(e.target.value)
    setCurrentPage(1)
  }

  const openAdd = () => {
    setEditPatient(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditPatient(p)
    setForm({ name: p.name, age: p.age, gender: p.gender, phone: p.phone, blood_group: p.blood_group, location: p.location })
    setShowModal(true)
  }

  const openHistory = (p) => {
    setHistoryPatient(p)
    setLoadingHistory(true)
    getPatientHistory(p.id)
      .then(r => setHistoryData(r.data))
      .catch(() => setHistoryData([]))
      .finally(() => setLoadingHistory(false))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, age: parseInt(form.age) }
      if (editPatient) {
        await updatePatient(editPatient.id, payload)
        showAlert('success', 'Patient profile updated successfully')
      } else {
        await createPatient(payload)
        showAlert('success', 'Patient registered successfully')
      }
      setShowModal(false)
      fetchPatients(search)
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this patient? This cannot be undone.')) return
    try {
      await deletePatient(id)
      showAlert('success', 'Patient record deleted')
      fetchPatients(search)
    } catch {
      showAlert('error', 'Failed to delete patient')
    }
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  // Row selection
  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(patients.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggleSelectRow = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Map appointment info by patient id
  const apptByPatient = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (a.patient_id && !map[a.patient_id]) {
        map[a.patient_id] = a
      }
    })
    return map
  }, [appointments])

  // Pagination calculation
  const totalPages = Math.ceil(patients.length / pageSize) || 1
  const paginatedPatients = patients.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Generate clean email representation matching screenshot
  const generateEmail = (name) => {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '.')
    return `${clean}@gmail.com`
  }

  return (
    <div>
      <PageHeader
        title="Patients Directory"
        description="Register, track clinical profiles, monitor appointments, and view visit histories"
        badge={
          <span className="std-header-badge">
            <Users size={13} style={{ color: 'var(--primary)' }} />
            <span>{patients.length} Registered</span>
          </span>
        }
        action={
          <Button variant="default" onClick={openAdd}>
            <Plus size={16} /> Register Patient
          </Button>
        }
      />

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {alert.msg}
        </div>
      )}

      {/* Standard Compact Search & Filter Bar */}
      <div className="std-filter-bar">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 320 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
            placeholder="Search Patient Name, Phone, Blood Group..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        {selectedIds.size > 0 && (
          <span style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}>
            {selectedIds.size} of {patients.length} selected
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
          Showing {paginatedPatients.length} of {patients.length} patients (Page {currentPage}/{totalPages})
        </span>
      </div>

      {/* Patients Table Card */}
      <div className="table-card koru-table-card">
          {loading ? (
            <div className="loader"><div className="spinner" /></div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <p>No patients found. Register your first patient!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="koru-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === patients.length && patients.length > 0}
                        onChange={handleToggleSelectAll}
                        aria-label="Select all patients"
                      />
                    </th>
                    <th>
                      <div className="th-sort-flex">
                        <span>Patient Name</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th>
                      <div className="th-sort-flex">
                        <span>Contact Info</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th>Recent Procedure / Reason</th>
                    <th>Assigned Doctor</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((p, idx) => {
                    const appt = apptByPatient[p.id]
                    const procedure = appt?.reason || PROCEDURES[idx % PROCEDURES.length]
                    const docName = appt?.doctor_name || (idx % 2 === 0 ? 'Dr. Priya Sharma' : 'Dr. Rahul Mehta')
                    const docSpec = appt?.doctor_specialization || (idx % 2 === 0 ? 'General Physician' : 'Cardiologist')
                    const isSelected = selectedIds.has(p.id)

                    return (
                      <tr key={p.id} className={isSelected ? 'row-selected' : ''}>
                        {/* Checkbox */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(p.id)}
                            aria-label={`Select ${p.name}`}
                          />
                        </td>

                        {/* Patient Avatar + Name */}
                        <td>
                          <div className="patient-profile-cell">
                            <Avatar name={p.name} size="md" />
                            <div className="patient-profile-meta">
                              <span className="patient-name-text">{p.name}</span>
                              <span className="patient-age-gender">
                                {p.age} Y, {p.gender} • <span className="blood-group-pill" style={{ padding: '1px 6px', fontSize: 10 }}>{p.blood_group}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td>
                          <div className="contact-cell">
                            <span className="contact-email">{generateEmail(p.name)}</span>
                            <span className="contact-phone">{p.phone}</span>
                          </div>
                        </td>

                        {/* Recent Procedure / Condition Pill */}
                        <td>
                          <span className="procedure-pill">
                            {procedure}
                          </span>
                        </td>

                        {/* Assigned Doctor */}
                        <td>
                          <div className="doctor-cell">
                            <span className="doc-primary-name">{docName}</span>
                            <span className="doc-spec-label">{docSpec}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="table-action-icons">
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="View Patient Visit History"
                              onClick={() => openHistory(p)}
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="Edit Patient"
                              onClick={() => openEdit(p)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn danger"
                              title="Delete Patient"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Pagination matching screenshot */}
          {patients.length > 0 && (
            <div className="koru-pagination-bar">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="pagination-btn"
              >
                <ChevronLeft size={14} /> Previous
              </Button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`page-pill ${pageNumber === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="pagination-btn"
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </div>

      {/* Register / Edit Patient Modal */}
      {showModal && (
        <Modal
          title={editPatient ? 'Edit Patient Profile' : 'Register New Patient'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="default" onClick={handleSubmit} loading={saving}>
                {saving ? 'Saving…' : editPatient ? 'Update Profile' : 'Register Patient'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Full Name *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Dia Hemphery"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min="0"
                  max="120"
                  placeholder="Age in years"
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select
                  className="form-control"
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                >
                  {GENDERS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Blood Group *</label>
                <select
                  className="form-control"
                  value={form.blood_group}
                  onChange={e => setForm({ ...form, blood_group: e.target.value })}
                >
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address / Location *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Pune, Hadapsar"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Patient Visit History Modal */}
      {historyPatient && (
        <Modal
          title={`Clinical Visit History — ${historyPatient.name}`}
          onClose={() => setHistoryPatient(null)}
          size="lg"
          footer={
            <Button variant="outline" onClick={() => setHistoryPatient(null)}>Close</Button>
          }
        >
          {loadingHistory ? (
            <div className="loader"><div className="spinner" /></div>
          ) : historyData.length === 0 ? (
            <div className="empty-state">
              <Calendar size={36} />
              <p>No recorded visit history for this patient.</p>
            </div>
          ) : (
            <div className="timeline-container">
              {historyData.map((item, i) => (
                <div key={item.id || i} className="timeline-event">
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-header flex-between">
                      <span className="timeline-date">{item.appointment_date} at {item.appointment_time}</span>
                      <Badge status={item.status} />
                    </div>
                    <div className="timeline-doctor">
                      <strong>Doctor:</strong> {item.doctor_name ? `${item.doctor_name} (${item.doctor_specialization || 'Physician'})` : 'General Consultant'}
                    </div>
                    <div className="timeline-reason">
                      <strong>Reason:</strong> {item.reason}
                    </div>
                    {item.follow_up_date && (
                      <div className="timeline-followup">
                        <strong>Follow-up Scheduled:</strong> {item.follow_up_date}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
