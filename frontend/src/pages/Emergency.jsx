import { useEffect, useState } from 'react'
import { Plus, CheckCircle, MapPin, Phone, Navigation, AlertTriangle, Shield, Truck } from 'lucide-react'
import {
  getAmbulance, createAmbulance, updateAmbulanceStatus, deleteAmbulance,
  getAmbulanceUnits, createAmbulanceUnit, updateAmbulanceUnitStatus, deleteAmbulanceUnit
} from '../services/api'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
const STATUSES   = ['PENDING', 'ASSIGNED', 'COMPLETED']
const UNIT_STATUSES = ['AVAILABLE', 'ON_CALL', 'UNAVAILABLE']

const emptyReqForm = {
  patient_name: '', phone: '', location: '', destination: '', priority: 'HIGH'
}

const emptyUnitForm = {
  unit_name: '', driver_name: '', phone: '', location: 'Pune', status: 'AVAILABLE', vehicle_number: ''
}

export default function Emergency() {
  const [activeTab, setActiveTab] = useState('requests') // 'requests' | 'units'

  // Emergency Requests state
  const [requests, setRequests] = useState([])
  const [loading, setLoading]  = useState(true)
  const [showReqModal, setShowReqModal] = useState(false)
  const [reqForm, setReqForm]  = useState(emptyReqForm)
  const [savingReq, setSavingReq] = useState(false)
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus]     = useState('')

  // Ambulance Units state
  const [units, setUnits]           = useState([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [unitForm, setUnitForm]     = useState(emptyUnitForm)
  const [savingUnit, setSavingUnit] = useState(false)

  const [alert, setAlert]      = useState(null)

  const fetchRequests = () => {
    setLoading(true)
    const params = {}
    if (filterPriority) params.priority = filterPriority
    if (filterStatus)   params.status   = filterStatus
    getAmbulance(params).then(r => setRequests(r.data)).finally(() => setLoading(false))
  }

  const fetchUnits = () => {
    setLoadingUnits(true)
    getAmbulanceUnits().then(r => setUnits(r.data)).finally(() => setLoadingUnits(false))
  }

  useEffect(() => { fetchRequests() }, [filterPriority, filterStatus])
  useEffect(() => { fetchUnits() }, [])

  const handleReqSubmit = async (e) => {
    e.preventDefault()
    setSavingReq(true)
    try {
      await createAmbulance(reqForm)
      showAlert('success', 'Ambulance request created')
      setShowReqModal(false)
      fetchRequests()
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to create request')
    } finally {
      setSavingReq(false)
    }
  }

  const handleUnitSubmit = async (e) => {
    e.preventDefault()
    setSavingUnit(true)
    try {
      await createAmbulanceUnit(unitForm)
      showAlert('success', 'Ambulance unit added to fleet')
      setShowUnitModal(false)
      fetchUnits()
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to add unit')
    } finally {
      setSavingUnit(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateAmbulanceStatus(id, status)
      showAlert('success', `Status → ${status}`)
      fetchRequests()
    } catch {
      showAlert('error', 'Failed to update')
    }
  }

  const handleUnitStatusChange = async (id, status) => {
    try {
      await updateAmbulanceUnitStatus(id, { status })
      showAlert('success', `Unit Status → ${status}`)
      fetchUnits()
    } catch {
      showAlert('error', 'Failed to update unit status')
    }
  }

  const handleDeleteReq = async (id) => {
    if (!confirm('Delete this request?')) return
    await deleteAmbulance(id)
    fetchRequests()
  }

  const handleDeleteUnit = async (id) => {
    if (!confirm('Remove this unit from fleet?')) return
    await deleteAmbulanceUnit(id)
    fetchUnits()
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🚑 Emergency Board & Fleet</h2>
          <p>Coordinate emergency requests and track ambulance availability</p>
        </div>
        <div className="flex">
          {activeTab === 'requests' ? (
            <button className="btn btn-primary" onClick={() => { setReqForm(emptyReqForm); setShowReqModal(true) }}>
              <Plus size={16} /> New Emergency Request
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => { setUnitForm(emptyUnitForm); setShowUnitModal(true) }}>
              <Plus size={16} /> Add Fleet Unit
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <CheckCircle size={16} /> {alert.msg}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('requests')}
          >
            <AlertTriangle size={16} /> Emergency Requests ({requests.length})
          </button>
          <button
            className={`btn ${activeTab === 'units' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('units')}
          >
            <Truck size={16} /> Fleet Availability ({units.filter(u => u.status === 'AVAILABLE').length}/{units.length} Free)
          </button>
        </div>

        {activeTab === 'requests' && (
          <>
            {/* Filters */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div className="flex">
                  <AlertTriangle size={16} color="var(--gray-500)" />
                  <span className="text-muted">Filter:</span>
                  <select className="form-control" style={{ width: 140 }}
                    value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <select className="form-control" style={{ width: 150 }}
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {(filterPriority || filterStatus) && (
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setFilterPriority(''); setFilterStatus('') }}>Clear</button>
                  )}
                </div>
              </div>
            </div>

            {/* Cards */}
            {loading ? (
              <div className="loader"><div className="spinner" /></div>
            ) : requests.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <CheckCircle size={40} color="var(--success)" />
                  <p>No ambulance requests found.</p>
                </div>
              </div>
            ) : (
              <div className="emergency-grid">
                {requests.map(r => (
                  <div key={r.id} className="emergency-card">
                    <div className="emergency-card-header">
                      <div className="flex">
                        <span style={{ fontSize: 20 }}>🚑</span>
                        <div>
                          <div className="text-bold">{r.patient_name}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {new Date(r.created_at).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <Badge status={r.priority} />
                    </div>

                    <div className="emergency-card-body">
                      <div className="info-row">
                        <MapPin size={14} />
                        <span><strong>From:</strong> {r.location}</span>
                      </div>
                      <div className="info-row">
                        <Navigation size={14} />
                        <span><strong>To:</strong> {r.destination}</span>
                      </div>
                      <div className="info-row">
                        <Phone size={14} />
                        <span>{r.phone}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Badge status={r.status} />
                      </div>
                    </div>

                    <div className="emergency-card-footer">
                      {STATUSES.filter(s => s !== r.status).map(s => (
                        <button key={s} className="btn btn-ghost btn-sm"
                          onClick={() => handleStatusChange(r.id, s)}>→ {s}</button>
                      ))}
                      <button className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                        onClick={() => handleDeleteReq(r.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'units' && (
          <div>
            {loadingUnits ? (
              <div className="loader"><div className="spinner" /></div>
            ) : units.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <Truck size={40} />
                  <p>No ambulance units in fleet directory.</p>
                </div>
              </div>
            ) : (
              <div className="table-wrap card">
                <table>
                  <thead>
                    <tr>
                      <th>Unit Name</th>
                      <th>Driver Name</th>
                      <th>Contact Phone</th>
                      <th>Location</th>
                      <th>Vehicle Number</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map(u => (
                      <tr key={u.id}>
                        <td className="text-bold flex">
                          <Truck size={16} color="var(--primary)" />
                          {u.unit_name}
                        </td>
                        <td>{u.driver_name}</td>
                        <td>{u.phone}</td>
                        <td>
                          <div className="flex" style={{ fontSize: 13 }}>
                            <MapPin size={14} /> {u.location}
                          </div>
                        </td>
                        <td className="text-muted">{u.vehicle_number || '—'}</td>
                        <td><Badge status={u.status} /></td>
                        <td>
                          <div className="flex">
                            {UNIT_STATUSES.filter(s => s !== u.status).map(s => (
                              <button key={s} className="btn btn-ghost btn-sm"
                                onClick={() => handleUnitStatusChange(u.id, s)}>
                                → {s}
                              </button>
                            ))}
                            <button className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDeleteUnit(u.id)}>
                              Delete
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
      </div>

      {/* New Request Modal */}
      {showReqModal && (
        <Modal
          title="New Emergency Ambulance Request"
          onClose={() => setShowReqModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowReqModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReqSubmit} disabled={savingReq}>
                {savingReq ? 'Submitting…' : 'Submit Request'}
              </button>
            </>
          }
        >
          <form onSubmit={handleReqSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Patient / Requester Name *</label>
                <input className="form-control" value={reqForm.patient_name}
                  onChange={e => setReqForm({ ...reqForm, patient_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contact Phone *</label>
                <input className="form-control" value={reqForm.phone}
                  onChange={e => setReqForm({ ...reqForm, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Pickup Location *</label>
                <input className="form-control" placeholder="e.g. Hadapsar" value={reqForm.location}
                  onChange={e => setReqForm({ ...reqForm, location: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Destination *</label>
                <input className="form-control" placeholder="e.g. City Hospital" value={reqForm.destination}
                  onChange={e => setReqForm({ ...reqForm, destination: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select className="form-control" value={reqForm.priority}
                  onChange={e => setReqForm({ ...reqForm, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* New Unit Modal */}
      {showUnitModal && (
        <Modal
          title="Add Ambulance Fleet Unit"
          onClose={() => setShowUnitModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowUnitModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUnitSubmit} disabled={savingUnit}>
                {savingUnit ? 'Saving…' : 'Add Unit'}
              </button>
            </>
          }
        >
          <form onSubmit={handleUnitSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Unit Name *</label>
                <input className="form-control" placeholder="e.g. AMB-05" value={unitForm.unit_name}
                  onChange={e => setUnitForm({ ...unitForm, unit_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Driver Name *</label>
                <input className="form-control" value={unitForm.driver_name}
                  onChange={e => setUnitForm({ ...unitForm, driver_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input className="form-control" value={unitForm.phone}
                  onChange={e => setUnitForm({ ...unitForm, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Station / Area *</label>
                <input className="form-control" placeholder="e.g. Pune" value={unitForm.location}
                  onChange={e => setUnitForm({ ...unitForm, location: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Vehicle Number</label>
                <input className="form-control" placeholder="e.g. MH12-AB-9999" value={unitForm.vehicle_number}
                  onChange={e => setUnitForm({ ...unitForm, vehicle_number: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Initial Status</label>
                <select className="form-control" value={unitForm.status}
                  onChange={e => setUnitForm({ ...unitForm, status: e.target.value })}>
                  {UNIT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
