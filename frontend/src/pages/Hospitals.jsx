import { useEffect, useState } from 'react'
import { Building2, Phone, MapPin, Plus, CheckCircle, Search, Filter } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { Badge } from '../components/Badge'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'

const TYPES = ['Hospital', 'Clinic', 'Blood Bank', 'Pharmacy']

const emptyForm = {
  name: '', type: 'Hospital', address: '', location: '',
  phone: '', emergency_24h: false, speciality: '', distance_km: ''
}

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [alert, setAlert]         = useState(null)
  const [filterType, setFilterType]       = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterEmergency, setFilterEmergency] = useState(false)

  const fetch = () => {
    setLoading(true)
    const params = {}
    if (filterType)      params.type           = filterType
    if (filterLocation)  params.location       = filterLocation
    if (filterEmergency) params.emergency_only = true
    axios.get('/api/hospitals/', { params }).then(r => setHospitals(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [filterType, filterLocation, filterEmergency])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        distance_km: form.distance_km ? parseFloat(form.distance_km) : null
      }
      await axios.post('/api/hospitals/', payload)
      showAlert('success', 'Facility added')
      setShowModal(false)
      fetch()
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this facility?')) return
    await axios.delete(`/api/hospitals/${id}`)
    fetch()
  }

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  const typeIcon = { Hospital: '🏥', Clinic: '🩺', 'Blood Bank': '🩸', Pharmacy: '💊' }
  const typeColor = {
    Hospital:     { bg: '#dbeafe', color: '#2563eb' },
    Clinic:       { bg: '#dcfce7', color: '#16a34a' },
    'Blood Bank': { bg: '#fce7f3', color: '#be185d' },
    Pharmacy:     { bg: '#fef3c7', color: '#d97706' },
  }

  return (
    <div>
      <PageHeader
        title="Hospital & Clinic Network"
        description="Directory of regional partner hospitals, specialty clinics, blood banks, and 24h emergency centers"
        badge={
          <span className="std-header-badge">
            <Building2 size={13} style={{ color: 'var(--primary)' }} />
            <span>{hospitals.length} Facilities Listed</span>
          </span>
        }
        action={
          <Button variant="default" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
            <Plus size={16} /> Add Facility
          </Button>
        }
      />

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {alert.msg}
        </div>
      )}

      {/* Standard Compact Filter Bar */}
      <div className="std-filter-bar">
        <span className="std-filter-label">
          <Filter size={14} /> Type:
        </span>
        <select
          className="form-control"
          style={{ width: 140, height: 36, fontSize: 13 }}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>

        <span className="std-filter-label" style={{ marginLeft: 8 }}>
          <MapPin size={14} /> Location:
        </span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--muted-foreground)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 30, height: 36, fontSize: 13 }}
            placeholder="Filter by location..."
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
          />
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={filterEmergency}
            onChange={e => setFilterEmergency(e.target.checked)}
          />
          <span style={{ fontWeight: 500 }}>24h Emergency only</span>
        </label>

        {(filterType || filterLocation || filterEmergency) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setFilterType(''); setFilterLocation(''); setFilterEmergency(false) }}
          >
            Clear Filters
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
          {hospitals.length} facilities found
        </span>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : hospitals.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">
            <Building2 size={40} />
            <p>No facilities found matching your criteria.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {hospitals.map(h => {
            const badgeVariant = {
              Hospital: 'primary',
              Clinic: 'success',
              'Blood Bank': 'destructive',
              Pharmacy: 'warning',
            }[h.type] || 'secondary'

            return (
              <div key={h.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex-between">
                      <div className="flex" style={{ gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{typeIcon[h.type] || '🏥'}</span>
                        <div>
                          <div className="text-bold" style={{ fontSize: 14.5 }}>{h.name}</div>
                          <Badge variant={badgeVariant} style={{ marginTop: 3 }}>{h.type}</Badge>
                        </div>
                      </div>
                      {h.emergency_24h && (
                        <Badge variant="destructive" dot>
                          24h ER
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    <div className="info-row flex" style={{ fontSize: 13, color: 'var(--foreground)', marginBottom: 6, gap: 6 }}>
                      <MapPin size={14} style={{ flexShrink: 0, color: 'var(--muted-foreground)' }} />
                      <span>{h.address}</span>
                    </div>
                    <div className="flex" style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6, gap: 6 }}>
                      <Phone size={14} style={{ flexShrink: 0 }} />
                      <span>{h.phone}</span>
                    </div>
                    {h.speciality && (
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
                        Speciality: <strong style={{ color: 'var(--foreground)' }}>{h.speciality}</strong>
                      </div>
                    )}
                    {h.distance_km != null && (
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                        Distance: <strong style={{ color: 'var(--foreground)' }}>{h.distance_km} km</strong>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--secondary)' }}>
                  <button className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => handleDelete(h.id)}>Remove</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <Modal
          title="Add Healthcare Facility"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Add Facility'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Facility Name *</label>
                <input className="form-control" value={form.name} required
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select className="form-control" value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Location / Area *</label>
                <input className="form-control" value={form.location} required placeholder="e.g. Pune"
                  onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Address *</label>
                <input className="form-control" value={form.address} required
                  onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input className="form-control" value={form.phone} required
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Speciality</label>
                <input className="form-control" value={form.speciality} placeholder="e.g. Multispeciality"
                  onChange={e => setForm({ ...form, speciality: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Distance (km)</label>
                <input type="number" step="0.1" className="form-control" value={form.distance_km}
                  onChange={e => setForm({ ...form, distance_km: e.target.value })} />
              </div>
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <label className="flex" style={{ cursor: 'pointer', gap: 8 }}>
                  <input type="checkbox" checked={form.emergency_24h}
                    onChange={e => setForm({ ...form, emergency_24h: e.target.checked })} />
                  24-hour Emergency
                </label>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
