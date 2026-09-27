import { useState, useEffect } from 'react'
import { Plus, Search, Droplets, CheckCircle, Trash2 } from 'lucide-react'
import { getBlood, createBlood, deleteBlood } from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'

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
    <>
      <div className="page-header">
        <div>
          <h2>🩸 Blood Search</h2>
          <p>Search blood availability by group and location</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
          <Plus size={16} /> Add Record
        </button>
      </div>

      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <CheckCircle size={16} /> {alert.msg}
          </div>
        )}

        {/* Search panel */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Search Blood Availability</h3>
          </div>
          <div className="card-body">
            <div className="flex" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label>Blood Group</label>
                <select className="form-control" style={{ width: 120 }}
                  value={searchGroup} onChange={e => setSearchGroup(e.target.value)}>
                  <option value="">All</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label>Location</label>
                <input className="form-control" placeholder="e.g. Pune" style={{ width: 180 }}
                  value={searchLoc} onChange={e => setSearchLoc(e.target.value)} />
              </div>
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSearch}>
                  <Search size={16} /> Search
                </button>
              </div>
              {(searchGroup || searchLoc) && (
                <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                  <button className="btn btn-ghost"
                    onClick={() => { setSearchGroup(''); setSearchLoc(''); fetchAll() }}>
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <h3>
              {searchGroup || searchLoc
                ? `Results for ${searchGroup || 'All'} in ${searchLoc || 'All locations'}`
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
                <p style={{ marginTop: 8, fontSize: 13 }}>Try a different group or location.</p>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Blood Group</th>
                    <th>Location</th>
                    <th>Units Available</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="text-bold">{r.source_name}</td>
                      <td>
                        <span style={{
                          background: '#fce7f3', color: '#be185d',
                          padding: '3px 10px', borderRadius: 999,
                          fontSize: 12, fontWeight: 700
                        }}>{r.blood_group}</span>
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
                      <td>
                        <button className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDelete(r.id)}>
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
    </>
  )
}
