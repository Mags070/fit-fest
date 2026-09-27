import { useEffect, useState } from 'react'
import { Plus, CheckCircle, MapPin, Phone, Navigation, AlertTriangle, Truck, Clock, Trash2 } from 'lucide-react'
import {
  getAmbulance, createAmbulance, updateAmbulanceStatus, deleteAmbulance,
  getAmbulanceUnits, createAmbulanceUnit, updateAmbulanceUnitStatus, deleteAmbulanceUnit
} from '../services/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'
import { Button } from '../components/ui/Button'

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
      showAlert('success', 'Emergency ambulance request created')
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
      showAlert('success', `Request updated to ${status}`)
      fetchRequests()
    } catch {
      showAlert('error', 'Failed to update request')
    }
  }

  const handleUnitStatusChange = async (id, status) => {
    try {
      await updateAmbulanceUnitStatus(id, { status })
      showAlert('success', `Unit status updated to ${status}`)
      fetchUnits()
    } catch {
      showAlert('error', 'Failed to update unit status')
    }
  }

  const handleDeleteReq = async (id) => {
    if (!confirm('Delete this emergency request?')) return
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

  const availableUnitsCount = units.filter(u => u.status === 'AVAILABLE').length

  return (
    <div>
      {/* Standard Page Header */}
      <PageHeader
        title="Emergency & Fleet Operations"
        description="Coordinate acute emergency dispatch, triage patient transport, and monitor fleet units"
        action={
          activeTab === 'requests' ? (
            <Button variant="default" onClick={() => { setReqForm(emptyReqForm); setShowReqModal(true) }}>
              <Plus size={16} /> New Emergency Request
            </Button>
          ) : (
            <Button variant="default" onClick={() => { setUnitForm(emptyUnitForm); setShowUnitModal(true) }}>
              <Plus size={16} /> Add Fleet Unit
            </Button>
          )
        }
      />

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <CheckCircle size={16} /> {alert.msg}
        </div>
      )}

      {/* Standard Tabs: Directly below header with equal height */}
      <div className="std-tab-group">
        <button
          type="button"
          className={`std-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <AlertTriangle size={15} />
          <span>Emergency Requests ({requests.length})</span>
        </button>
        <button
          type="button"
          className={`std-tab-btn ${activeTab === 'units' ? 'active' : ''}`}
          onClick={() => setActiveTab('units')}
        >
          <Truck size={15} />
          <span>Fleet Availability ({availableUnitsCount}/{units.length} Free)</span>
        </button>
      </div>

      {/* Tab 1: Emergency Requests */}
      {activeTab === 'requests' && (
        <>
          {/* Compact Filter Bar */}
          <div className="std-filter-bar">
            <span className="std-filter-label">
              <AlertTriangle size={14} /> Filter:
            </span>
            <select
              className="form-control"
              style={{ width: 140, height: 34 }}
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>

            <select
              className="form-control"
              style={{ width: 150, height: 34 }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>

            {(filterPriority || filterStatus) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterPriority(''); setFilterStatus('') }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Compact Emergency Requests List (Preferred Layout from Section 5) */}
          <div className="table-card">
            <div className="table-card-header">
              <h3 className="table-card-title">Emergency Requests ({requests.length})</h3>
            </div>

            {loading ? (
              <div className="loader"><div className="spinner" /></div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={36} color="var(--success)" />
                <p>No emergency requests in queue.</p>
              </div>
            ) : (
              <div className="compact-emergency-list">
                {requests.map(r => (
                  <div key={r.id} className="compact-emergency-row">
                    <div className="emergency-row-patient">
                      <span className="emergency-row-icon">🚑</span>
                      <div>
                        <div className="emergency-row-name">{r.patient_name}</div>
                        <div className="emergency-row-time">
                          {new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {r.phone}
                        </div>
                      </div>
                    </div>

                    <div className="emergency-row-route">
                      <span>{r.location}</span>
                      <span className="route-arrow">→</span>
                      <span>{r.destination}</span>
                    </div>

                    <div className="emergency-row-meta">
                      <Badge status={r.priority} />
                      <Badge status={r.status} />
                    </div>

                    <div className="emergency-row-actions">
                      {STATUSES.filter(s => s !== r.status).map(s => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(r.id, s)}
                        >
                          → {s}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteReq(r.id)}
                        title="Delete request"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab 2: Fleet Availability */}
      {activeTab === 'units' && (
        <div className="table-card">
          <div className="table-card-header">
            <h3 className="table-card-title">Ambulance Fleet Directory ({units.length} Units)</h3>
          </div>

          {loadingUnits ? (
            <div className="loader"><div className="spinner" /></div>
          ) : units.length === 0 ? (
            <div className="empty-state">
              <Truck size={36} />
              <p>No ambulance units in fleet directory.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ambulance</th>
                    <th>Driver Name</th>
                    <th>Contact Phone</th>
                    <th>Base Location</th>
                    <th>Vehicle Number</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
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
                          <MapPin size={13} /> {u.location}
                        </div>
                      </td>
                      <td className="text-muted">{u.vehicle_number || '—'}</td>
                      <td><Badge status={u.status} /></td>
                      <td>
                        <div className="flex" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          {UNIT_STATUSES.filter(s => s !== u.status).map(s => (
                            <Button
                              key={s}
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnitStatusChange(u.id, s)}
                            >
                              → {s}
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDeleteUnit(u.id)}
                            title="Delete unit"
                          >
                            <Trash2 size={14} />
                          </Button>
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

      {/* Compact Emergency Request Modal (Section 15) */}
      {showReqModal && (
        <Modal
          title="New Emergency Request"
          onClose={() => setShowReqModal(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowReqModal(false)}>Cancel</Button>
              <Button variant="default" onClick={handleReqSubmit} loading={savingReq}>
                {savingReq ? 'Creating…' : 'Create Emergency Request'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleReqSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Vikram Joshi"
                  value={reqForm.patient_name}
                  onChange={e => setReqForm({ ...reqForm, patient_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. 9876543210"
                  value={reqForm.phone}
                  onChange={e => setReqForm({ ...reqForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Pickup Location *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Hadapsar, Pune"
                  value={reqForm.location}
                  onChange={e => setReqForm({ ...reqForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Destination Hospital *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. City Hospital, Sassoon"
                  value={reqForm.destination}
                  onChange={e => setReqForm({ ...reqForm, destination: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Priority *</label>
                <select
                  className="form-control"
                  value={reqForm.priority}
                  onChange={e => setReqForm({ ...reqForm, priority: e.target.value })}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Ambulance Unit Modal */}
      {showUnitModal && (
        <Modal
          title="Add Fleet Ambulance Unit"
          onClose={() => setShowUnitModal(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowUnitModal(false)}>Cancel</Button>
              <Button variant="default" onClick={handleUnitSubmit} loading={savingUnit}>
                {savingUnit ? 'Adding…' : 'Add Fleet Unit'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleUnitSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Unit Name *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. AMB-101"
                  value={unitForm.unit_name}
                  onChange={e => setUnitForm({ ...unitForm, unit_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Driver Name *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={unitForm.driver_name}
                  onChange={e => setUnitForm({ ...unitForm, driver_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Driver Phone *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. 9876543210"
                  value={unitForm.phone}
                  onChange={e => setUnitForm({ ...unitForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Base Location *</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Pune City Center"
                  value={unitForm.location}
                  onChange={e => setUnitForm({ ...unitForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Vehicle Number</label>
                <input
                  className="form-control"
                  placeholder="e.g. MH 12 AB 1234"
                  value={unitForm.vehicle_number}
                  onChange={e => setUnitForm({ ...unitForm, vehicle_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  className="form-control"
                  value={unitForm.status}
                  onChange={e => setUnitForm({ ...unitForm, status: e.target.value })}
                >
                  {UNIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
