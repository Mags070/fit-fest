import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, Ambulance, Droplets, CheckCircle, Clock, ArrowRight, Bell, Building2, Truck } from 'lucide-react'
import { getDashboard, getAppointments, getAmbulance } from '../services/api'
import StatCard from '../components/StatCard'
import { Badge } from '../components/Badge'

export default function Dashboard() {
  const [stats, setStats]    = useState(null)
  const [todayAppts, setTodayAppts] = useState([])
  const [pendingAmb, setPendingAmb] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getAppointments({ date_filter: today }),
      getAmbulance({ status: 'PENDING' }),
    ])
      .then(([dash, appts, amb]) => {
        setStats(dash.data)
        setTodayAppts(appts.data.slice(0, 5))
        setPendingAmb(amb.data.slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader"><div className="spinner" /></div>

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>
          Good {getGreeting()}, Staff 👋
        </h2>
        <p className="text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stat cards grid */}
      <div className="stat-grid">
        <StatCard icon={<Users size={22} />}    value={stats?.total_patients}     label="Registered Patients"    color="blue"  />
        <StatCard icon={<Calendar size={22} />} value={stats?.today_appointments}  label="Today's Appointments"   color="green" />
        <StatCard icon={<Bell size={22} />}     value={stats?.followups_due_today}label="Follow-ups Due Today"  color="amber" />
        <StatCard icon={<Ambulance size={22} />}value={stats?.pending_ambulances}  label="Pending Emergencies"    color="red"   />
      </div>

      {/* Second row stats */}
      <div className="stat-grid">
        <StatCard icon={<Truck size={22} />}    value={`${stats?.available_units || 0}/${stats?.total_units || 0}`} label="Ambulance Fleet Free" color="green" />
        <StatCard icon={<Droplets size={22} />} value={stats?.available_blood}     label="Available Blood Records"color="amber" />
        <StatCard icon={<Building2 size={22} />}value={stats?.total_hospitals}     label="Nearby Facilities"      color="blue"  />
        <StatCard icon={<Calendar size={22} />} value={stats?.upcoming_appointments}label="Upcoming Scheduled"    color="green" />
      </div>

      {/* Two column layout */}
      <div className="two-col">

        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <h3>Today's Appointments</h3>
            <Link to="/appointments" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <div className="empty-state">
              <Calendar size={36} />
              <p>No appointments today</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppts.map(a => (
                    <tr key={a.id}>
                      <td className="text-bold">{a.patient_name}</td>
                      <td>{a.appointment_time}</td>
                      <td><Badge status={a.severity || 'ROUTINE'} /></td>
                      <td><Badge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Ambulances */}
        <div className="card">
          <div className="card-header">
            <h3>🚑 Pending Ambulances</h3>
            <Link to="/emergency" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {pendingAmb.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={36} />
              <p>No pending ambulance requests</p>
            </div>
          ) : (
            <div style={{ padding: '8px 16px' }}>
              {pendingAmb.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--gray-100)'
                }}>
                  <div>
                    <div className="text-bold" style={{ fontSize: 14 }}>{r.patient_name}</div>
                    <div className="text-muted">{r.location} → {r.destination}</div>
                  </div>
                  <Badge status={r.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick stats summary */}
      <div className="card section-gap">
        <div className="card-header">
          <h3>Operational Overview & Metrics</h3>
          <div className="flex">
            <Clock size={16} color="var(--gray-500)" />
            <span className="text-muted">Live system metrics</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <SummaryItem color="#16a34a" label="Completed Today" value={stats?.completed_today} />
            <SummaryItem color="#2563eb" label="Scheduled Today" value={stats?.scheduled_today} />
            <SummaryItem color="#dc2626" label="Cancelled Today" value={stats?.cancelled_today} />
            <SummaryItem color="#d97706" label="Total Ambulances" value={stats?.total_ambulances} />
            <SummaryItem color="#7c3aed" label="Blood Bank Records" value={stats?.blood_records} />
            <SummaryItem color="#0284c7" label="Emergency Facilities" value={stats?.emergency_hospitals} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryItem({ color, label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? 0}</div>
      <div className="text-muted">{label}</div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
