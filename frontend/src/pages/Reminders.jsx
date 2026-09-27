import { useEffect, useState } from 'react'
import { Bell, Calendar, CheckCircle, Clock, Plus, X } from 'lucide-react'
import { getAppointments } from '../services/api'
import axios from 'axios'
import { Badge } from '../components/Badge'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'

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

  const overdueCount = followups.filter(f => isOverdue(f.follow_up_date)).length
  const todayCount   = followups.filter(f => isToday(f.follow_up_date)).length
  const weekCount    = followups.filter(f => {
    const d = new Date(f.follow_up_date)
    const diff = (d - new Date()) / 86400000
    return diff > 0 && diff <= 7
  }).length
  const upcomingCount = followups.length

  return (
    <div>
      <PageHeader
        title="Follow-up Reminders & Check-ins"
        description="Monitor scheduled follow-ups, pending post-consultation check-ins, and overdue reminders"
        badge={
          <span className="std-header-badge">
            <Bell size={13} style={{ color: 'var(--primary)' }} />
            <span>{followups.length} Reminders</span>
          </span>
        }
      />

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {alert.msg}
        </div>
      )}

      {/* 4 Summary Stat Cards: Equal Height & Width */}
      <div className="stat-grid-4">
        <StatCard
          label="Due Today"
          value={todayCount}
          color="amber"
          icon={<Bell size={20} />}
          subtext="Immediate follow-ups"
        />
        <StatCard
          label="Due This Week"
          value={weekCount}
          color="blue"
          icon={<Calendar size={20} />}
          subtext="Next 7 days"
        />
        <StatCard
          label="Overdue Follow-ups"
          value={overdueCount}
          color="red"
          icon={<Clock size={20} />}
          subtext="Requires clinician action"
        />
        <StatCard
          label="Total Scheduled"
          value={upcomingCount}
          color="green"
          icon={<CheckCircle size={20} />}
          subtext="Active in 30-day queue"
        />
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : followups.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">
            <Bell size={40} />
            <p>No pending follow-up reminders</p>
            <p style={{ fontSize: 13, marginTop: 8, color: 'var(--muted-foreground)' }}>
              Set follow-up dates on appointments from the Appointments page.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-card-header">
            <h3 className="table-card-title">Pending Follow-ups ({followups.length})</h3>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Next 30-day window</span>
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="text-bold">{f.patient_name}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{f.patient_phone}</div>
                    </td>
                    <td>
                      <div>{f.appointment_date}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{f.appointment_time}</div>
                    </td>
                    <td>{f.reason}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: isOverdue(f.follow_up_date) ? 'var(--danger)'
                             : isToday(f.follow_up_date) ? 'var(--warning)'
                             : 'var(--success)'
                      }}>
                        {f.follow_up_date}
                        {isToday(f.follow_up_date) && (
                          <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 7px', borderRadius: 999 }}>Today</span>
                        )}
                        {isOverdue(f.follow_up_date) && (
                          <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 7px', borderRadius: 999 }}>Overdue</span>
                        )}
                      </span>
                    </td>
                    <td style={{ maxWidth: 220, fontSize: 13 }}>{f.follow_up_notes || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex" style={{ justifyContent: 'flex-end', gap: 6 }}>
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
      )}

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
    </div>
  )
}
