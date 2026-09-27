import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, History, CheckCircle, Calendar } from 'lucide-react'
import { getPatients, createPatient, deletePatient, updatePatient, getPatientHistory } from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['Male', 'Female', 'Other']

const emptyForm = { name: '', age: '', gender: 'Male', phone: '', blood_group: 'O+', location: '' }

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]  = useState(true)
  const [search, setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editPatient, setEditPatient] = useState(null)
  const [form, setForm]        = useState(emptyForm)
  const [saving, setSaving]    = useState(false)
  const [alert, setAlert]      = useState(null)

  // Visit history modal
  const [historyPatient, setHistoryPatient] = useState(null)
  const [historyData, setHistoryData]       = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchPatients = (q = '') => {
    setLoading(true)
    getPatients(q).then(r => setPatients(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchPatients() }, [])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    fetchPatients(e.target.value)
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
        showAlert('success', 'Patient updated successfully')
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
      showAlert('success', 'Patient deleted')
      fetchPatients(search)
    } catch {
      showAlert('error', 'Failed to delete patient')
    }
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Patients</h2>
          <p>Register and manage patient information</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Patient
        </button>
      </div>

      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <CheckCircle size={16} /> {alert.msg}
          </div>
        )}

        {/* Search */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <div className="search-wrap">
              <Search size={16} />
              <input
                className="form-control search-input"
                placeholder="Search by name or phone..."
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <h3>All Patients ({patients.length})</h3>
          </div>
          {loading ? (
            <div className="loader"><div className="spinner" /></div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <p>No patients found. Register the first patient!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Age / Gender</th>
                    <th>Phone</th>
                    <th>Blood Group</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => (
                    <tr key={p.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td className="text-bold">{p.name}</td>
                      <td>{p.age} / {p.gender}</td>
                      <td>{p.phone}</td>
                      <td>
                        <span style={{
                          background: '#fce7f3', color: '#be185d',
                          padding: '3px 10px', borderRadius: 999,
                          fontSize: 12, fontWeight: 600
                        }}>{p.blood_group}</span>
                      </td>
                      <td>{p.location}</td>
                      <td>
                        <div className="flex">
                          <button className="btn btn-ghost btn-sm" title="Visit History" onClick={() => openHistory(p)}>
                            <History size={14} /> History
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}
                            style={{ color: 'var(--danger)' }}>
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
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editPatient ? 'Edit Patient' : 'Register New Patient'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : editPatient ? 'Update' : 'Register'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input className="form-control" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Age *</label>
                <input type="number" className="form-control" value={form.age} min={0} max={150}
                  onChange={e => setForm({ ...form, age: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select className="form-control" value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}>
                  {GENDERS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input className="form-control" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Blood Group *</label>
                <select className="form-control" value={form.blood_group}
                  onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Location / Area *</label>
                <input className="form-control" value={form.location} placeholder="e.g. Pune"
                  onChange={e => setForm({ ...form, location: e.target.value })} required />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Patient History Modal */}
      {historyPatient && (
        <Modal
          title={`🗂️ Visit History — ${historyPatient.name}`}
          onClose={() => setHistoryPatient(null)}
          footer={
            <button className="btn btn-ghost" onClick={() => setHistoryPatient(null)}>Close</button>
          }
        >
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--gray-600)' }}>
              <strong>Phone:</strong> {historyPatient.phone} | <strong>Blood Group:</strong> {historyPatient.blood_group} | <strong>Location:</strong> {historyPatient.location}
            </div>

            {loadingHistory ? (
              <div className="loader"><div className="spinner" /></div>
            ) : historyData.length === 0 ? (
              <div className="empty-state">
                <Calendar size={36} />
                <p>No visit or appointment history recorded for this patient.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Reason</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map(h => (
                      <tr key={h.id}>
                        <td>
                          <div className="text-bold">{h.appointment_date}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{h.appointment_time}</div>
                        </td>
                        <td>{h.reason}</td>
                        <td><Badge status={h.severity || 'ROUTINE'} /></td>
                        <td><Badge status={h.status} /></td>
                        <td style={{ fontSize: 12 }}>
                          {h.follow_up_date ? (
                            <div>
                              <strong style={{ color: 'var(--primary)' }}>{h.follow_up_date}</strong>
                              {h.follow_up_notes && <div className="text-muted">{h.follow_up_notes}</div>}
                            </div>
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
