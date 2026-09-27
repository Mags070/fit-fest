import { useEffect, useState } from 'react'
import { Bell, Calendar, CheckCircle, Clock, Plus, X } from 'lucide-react'
import { getAppointments } from '../services/api'
import axios from 'axios'
import { Badge } from '../components/Badge'
import Modal from '../components/Modal'

export default function Reminders() {
  const [followups, setFollowups] = useState([])
  const [loading, setLoading]    = useState(true)
  const [alert, setAlert]        = useState(null)
  const [editModal, setEditModal] = useState(null) // appointment object
  const [form, setForm]           = useState({ follow_up_date: '', follow_up_notes: '' })
  const [saving, setSaving]       = useState(false)

  const fetch = () => {
    setLoading(true)
    axios.get('/api/appointments/followups?upcoming_days=30')
      .then(r => setFollowups(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openEdit = (appt) => {
    setEditModal(appt)
    setForm({ follow_up_date: appt.follow_up_date || '', follow_up_notes: appt.follow_up_notes || '' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.patch(`/api/appointments/${editModal.id}/followup`, form)
      showAlert('success', 'Follow-up updated')
      setEditModal(null)
      fetch()
    } catch {
      showAlert('error', 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async (appt) => {
    try {
      await axios.patch(`/api/appointments/${appt.id}/followup`, { follow_up_date: null, follow_up_notes: null })
      showAlert('success', 'Follow-up cleared')
      fetch()
    } catch {
      showAlert('error', 'Failed to clear')
    }
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  const today = new Date().toISOString().split('T')[0]

  const isToday   = (d) => d === today
  const isOverdue = (d) => d < today

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🔔 Follow-up Reminders</h2>
          <p>Track upcoming follow-up appointments and reminders</p>
        </div>
      </div>

      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <CheckCircle size={16} /> {alert.msg}
          </div>
        )}

        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : followups.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Bell size={40} />
              <p>No pending follow-up reminders</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>
                Set follow-up dates on appointments from the Appointments page.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              <SummaryPill
                label="Due Today"
                count={followups.filter(f => isToday(f.follow_up_date)).length}
                color="#dc2626" bg="#fee2e2"
              />
              <SummaryPill
                label="Due This Week"
                count={followups.filter(f => {
                  const d = new Date(f.follow_up_date)
                  const diff = (d - new Date()) / 86400000
                  return diff >= 0 && diff <= 7
                }).length}
                color="#d97706" bg="#fef3c7"
              />
              <SummaryPill
                label="Total Pending"
                count={followups.length}
                color="#2563eb" bg="#dbeafe"
              />
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Pending Follow-ups ({followups.length})</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Original Appointment</th>
                      <th>Reason</th>
                      <th>Follow-up Date</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followups.map(f => (
                      <tr key={f.id}>
                        <td>
                          <div className="text-bold">{f.patient_name}</div>
                          <div className="text-muted">{f.patient_phone}</div>
                        </td>
                        <td>
                          <div>{f.appointment_date}</div>
                          <div className="text-muted">{f.appointment_time}</div>
                        </td>
                        <td>{f.reason}</td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            color: isOverdue(f.follow_up_date) ? '#dc2626'
                                 : isToday(f.follow_up_date) ? '#d97706'
                                 : '#16a34a'
                          }}>
                            {f.follow_up_date}
                            {isToday(f.follow_up_date) && (
                              <span style={{ marginLeft: 6, fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 999 }}>Today</span>
                            )}
                          </span>
                        </td>
                        <td style={{ maxWidth: 200, fontSize: 13 }}>{f.follow_up_notes || '—'}</td>
                        <td>
                          <div className="flex">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}>
                              Edit
                            </button>
                            <button className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleClear(f)}>
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editModal && (
        <Modal
          title={`Edit Follow-up — ${editModal.patient_name}`}
          onClose={() => setEditModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label>Follow-up Date</label>
              <input type="date" className="form-control" value={form.follow_up_date}
                onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Notes</label>
              <textarea className="form-control" rows={3} value={form.follow_up_notes}
                onChange={e => setForm({ ...form, follow_up_notes: e.target.value })}
                placeholder="What should be checked at follow-up?" />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function SummaryPill({ label, count, color, bg }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${color}33`, borderRadius: 12,
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 13, color, fontWeight: 500 }}>{label}</div>
    </div>
  )
}
