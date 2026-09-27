import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, Calendar, Ambulance, Droplets, CheckCircle, Clock,
  ArrowRight, Bell, Building2, Truck, UserCheck, Activity, ShieldCheck,
  RefreshCw, AlertTriangle
} from 'lucide-react'
import { getDashboard, getAppointments, getAmbulance, getDoctors } from '../services/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { Badge } from '../components/Badge'
import ActivityHeatmap from '../components/ui/ActivityHeatmap'
import { AppointmentTrendChart, AcuityDonutChart, DoctorWorkloadChart } from '../components/ui/Charts'

export default function Dashboard() {
  const [stats, setStats]           = useState(null)
  const [todayAppts, setTodayAppts] = useState([])
  const [allAppts, setAllAppts]     = useState([])
  const [doctors, setDoctors]       = useState([])
  const [pendingAmb, setPendingAmb] = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState(null)
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState(null)
  const navigate = useNavigate()

  const today = new Date().toISOString().split('T')[0]

  const fetchDashboardData = async () => {
    setError(null)
    try {
      const [dash, todayA, allA, amb, docs] = await Promise.all([
        getDashboard(),
        getAppointments({ date_filter: today }),
        getAppointments(), // all appointments for heatmap & charts
        getAmbulance({ status: 'PENDING' }),
        getDoctors(),
      ])
      setStats(dash.data)
      setTodayAppts(todayA.data.slice(0, 5))
      setAllAppts(allA.data || [])
      setPendingAmb(amb.data.slice(0, 4))
      setDoctors(docs.data || [])
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Unable to load dashboard statistics.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  // Calculate severity counts purely from database appointments (no fake padding)
  const acuityCounts = useMemo(() => {
    let routine = 0
    let urgent = 0
    let critical = 0
    allAppts.forEach(a => {
      const sev = (a.severity || 'ROUTINE').toUpperCase()
      if (sev === 'CRITICAL') critical++
      else if (sev === 'URGENT') urgent++
      else routine++
    })
    return { routine, urgent, critical }
  }, [allAppts])

  // Count appointments per doctor for workload chart from actual database appointments
  const doctorWorkloadData = useMemo(() => {
    const counts = {}
    allAppts.forEach(a => {
      if (a.doctor_id) {
        counts[a.doctor_id] = (counts[a.doctor_id] || 0) + 1
      }
    })
    return doctors.map(d => ({
      ...d,
      appointment_count: counts[d.id] || 0
    }))
  }, [allAppts, doctors])

  const handleHeatmapDateClick = (dateStr) => {
    setSelectedHeatmapDate(dateStr)
    navigate(`/appointments?date=${dateStr}`)
  }

  if (loading && !stats && !error) return <div className="loader"><div className="spinner" /></div>

  return (
    <div>
      {/* Standard Page Header with Dynamic Refresh Action */}
      <PageHeader
        title="Clinical Operations Dashboard"
        description={`Real-time patient intake, physician availability, and acute emergency triage • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        badge={
          <span className="std-header-badge">
            <span className="topbar-live-dot" />
            <span>{stats ? `${stats.available_doctors || 0} Doctors Available` : 'Physicians'}</span>
          </span>
        }
        action={
          <button
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px' }}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {/* User-friendly Error Alert */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      )}

      {/* 4 Primary Summary Cards: Equal Height & Width */}
      <div className="stat-grid-4">
        <StatCard
          icon={<Users size={20} />}
          value={loading ? 'Loading…' : (stats?.total_patients ?? 0)}
          label="Registered Patients"
          color="blue"
          subtext="Active in database"
        />
        <StatCard
          icon={<UserCheck size={20} />}
          value={loading ? 'Loading…' : `${stats?.available_doctors ?? 0} / ${stats?.total_doctors ?? 0}`}
          label="Available Doctors"
          color="green"
          subtext="On-duty clinicians"
        />
        <StatCard
          icon={<Calendar size={20} />}
          value={loading ? 'Loading…' : (stats?.today_appointments ?? 0)}
          label="Today's Appointments"
          color="blue"
          subtext="Active consultations"
        />
        <StatCard
          icon={<Ambulance size={20} />}
          value={loading ? 'Loading…' : (stats?.pending_ambulances ?? 0)}
          label="Pending Emergencies"
          color="red"
          subtext="Urgent dispatch queue"
        />
      </div>

      {/* Visual Analytics Grid: 2-Column Balanced Layout */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        <AppointmentTrendChart data={stats?.appointment_trend} />
        <AcuityDonutChart
          routine={acuityCounts.routine}
          urgent={acuityCounts.urgent}
          critical={acuityCounts.critical}
        />
      </div>

      {/* Doctor Consultation Workload */}
      <div style={{ marginBottom: 20 }}>
        <DoctorWorkloadChart doctors={doctorWorkloadData} />
      </div>

      {/* GitHub-style Activity Heatmap Calendar */}
      <div style={{ marginBottom: 20 }}>
        <ActivityHeatmap
          appointments={allAppts}
          weeksToShow={22}
          onDateClick={handleHeatmapDateClick}
          selectedDate={selectedHeatmapDate}
        />
      </div>

      {/* Operational Two-Column Section: Schedule & Emergency Dispatch */}
      <div className="two-col">
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <h3>Today's Patient Schedule</h3>
            <Link to="/appointments" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <div className="empty-state">
              <Calendar size={32} />
              <p>No appointments booked for today</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Doctor</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppts.map(a => (
                    <tr key={a.id}>
                      <td className="text-bold">{a.patient_name}</td>
                      <td>{a.appointment_time}</td>
                      <td>
                        {a.doctor_name ? (
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{a.doctor_name}</span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: 12 }}>Unassigned</span>
                        )}
                      </td>
                      <td><Badge status={a.severity || 'ROUTINE'} /></td>
                      <td><Badge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Emergency Dispatch Queue (Compact List matching Section 5) */}
        <div className="card">
          <div className="card-header">
            <h3>🚑 Emergency Dispatch Queue</h3>
            <Link to="/emergency" className="btn btn-ghost btn-sm">
              Fleet board <ArrowRight size={13} />
            </Link>
          </div>
          {pendingAmb.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={32} color="var(--success)" />
              <p>No pending emergency requests in queue</p>
            </div>
          ) : (
            <div className="compact-emergency-list">
              {pendingAmb.map(r => (
                <div key={r.id} className="compact-emergency-row">
                  <div className="emergency-row-patient">
                    <span className="emergency-row-icon">🚑</span>
                    <div>
                      <div className="emergency-row-name">{r.patient_name}</div>
                      <div className="emergency-row-time">
                        {new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
