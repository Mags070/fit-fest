import { useState, useEffect } from 'react'
import { Plus, Search, Droplets, CheckCircle, Trash2 } from 'lucide-react'
import { getBlood, createBlood, deleteBlood } from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const CITIES = ['Pune', 'Pimpri', 'Chinchwad', 'Hadapsar', 'Kothrud', 'Wakad', 'Hinjewadi', 'Viman Nagar']

const emptyForm = {
  blood_group: 'B+',
  location: 'Pune',
  units_available: '',
  contact: '',
  source_name: '',
  status: 'AVAILABLE',
}

export default function Blood() {
  const [records, setRecords]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [searched, setSearched]= useState(false)
  const [searchGroup, setSearchGroup] = useState('')
  const [searchLoc, setSearchLoc]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]        = useState(emptyForm)
  const [saving, setSaving]    = useState(false)
  const [alert, setAlert]      = useState(null)

  const fetchAll = (group = '', location = '') => {
    setLoading(true)
    const params = {}
    if (group)    params.group    = group
    if (location) params.location = location
    getBlood(params).then(r => {
      setRecords(r.data)
      setSearched(true)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleSearch = () => fetchAll(searchGroup, searchLoc)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createBlood({ ...form, units_available: parseInt(form.units_available) })
      showAlert('success', 'Blood record added')
      setShowModal(false)
      fetchAll(searchGroup, searchLoc)
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to add record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return
    await deleteBlood(id)
    fetchAll(searchGroup, searchLoc)
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <div>
      <PageHeader
        title="Blood Bank Inventory & Availability"
        description="Search real-time blood stock across partnered blood banks and regional donation centers"
        badge={
          <span className="std-header-badge">
            <Droplets size={13} style={{ color: '#db2777' }} />
            <span>{records.length} Units Listed</span>
          </span>
        }
        action={
          <Button variant="default" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
            <Plus size={16} /> Add Blood Record
          </Button>
        }
      />

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {alert.msg}
        </div>
      )}

      {/* Standard Filter Bar */}
      <div className="std-filter-bar">
        <span className="std-filter-label">
          <Droplets size={14} /> Group:
        </span>
        <select
          className="form-control"
          style={{ width: 130, height: 36, fontSize: 13 }}
          value={searchGroup}
          onChange={e => setSearchGroup(e.target.value)}
        >
          <option value="">All Groups</option>
          {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
        </select>

        <span className="std-filter-label" style={{ marginLeft: 8 }}>
          Location:
        </span>
        <input
          className="form-control"
          placeholder="e.g. Pune, Hadapsar..."
          style={{ width: 190, height: 36, fontSize: 13 }}
          value={searchLoc}
          onChange={e => setSearchLoc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
        />

        <Button size="sm" variant="default" onClick={handleSearch}>
          <Search size={14} /> Search
        </Button>

        {(searchGroup || searchLoc) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearchGroup(''); setSearchLoc(''); fetchAll() }}
          >
            Clear
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
          {records.length} blood records found
        </span>
      </div>

      {/* Results Table Card */}
      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-card-title">
            {searchGroup || searchLoc
              ? `Results for ${searchGroup || 'All Groups'} in ${searchLoc || 'All Locations'}`
              : 'All Blood Records'
            } ({records.length})
          </h3>
        </div>

        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <Droplets size={40} />
            <p>No matching blood records found.</p>
            {(searchGroup || searchLoc) && (
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted-foreground)' }}>Try searching for a different blood group or area.</p>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source / Blood Bank</th>
                  <th>Blood Group</th>
                  <th>Location</th>
                  <th>Units Available</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="text-bold">{r.source_name}</td>
                    <td>
                      <span className="blood-group-pill">{r.blood_group}</span>
                    </td>
                    <td>{r.location}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: r.units_available > 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {r.units_available} units
                      </span>
                    </td>
                    <td>{r.contact}</td>
                    <td><Badge status={r.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showModal && (
        <Modal
          title="Add Blood Record"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Add Record'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Source / Blood Bank Name *</label>
                <input className="form-control" placeholder="e.g. City Blood Bank" value={form.source_name}
                  onChange={e => setForm({ ...form, source_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Blood Group *</label>
                <select className="form-control" value={form.blood_group}
                  onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input className="form-control" placeholder="e.g. Pune" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Units Available *</label>
                <input type="number" className="form-control" min={0} value={form.units_available}
                  onChange={e => setForm({ ...form, units_available: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contact *</label>
                <input className="form-control" value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
