import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/api/dashboard/')

// ─── Patients ────────────────────────────────────────────────────────────────
export const getPatients    = (search = '') => api.get(`/api/patients/${search ? `?search=${encodeURIComponent(search)}` : ''}`)
export const getPatient     = (id) => api.get(`/api/patients/${id}`)
export const createPatient  = (data) => api.post('/api/patients/', data)
export const updatePatient  = (id, data) => api.patch(`/api/patients/${id}`, data)
export const deletePatient  = (id) => api.delete(`/api/patients/${id}`)

// ─── Doctors ─────────────────────────────────────────────────────────────────
export const getDoctors          = (params = {}) => api.get('/api/doctors/', { params })
export const getDoctor           = (id) => api.get(`/api/doctors/${id}`)
export const createDoctor        = (data) => api.post('/api/doctors/', data)
export const updateDoctor        = (id, data) => api.patch(`/api/doctors/${id}`, data)
export const deleteDoctor        = (id) => api.delete(`/api/doctors/${id}`)
export const getAvailableDoctors = (date, time) => api.get('/api/doctors/available', { params: { date, time } })
export const getDoctorSchedule   = (id, date) => api.get(`/api/doctors/${id}/schedule`, { params: { date } })

// ─── Appointments ─────────────────────────────────────────────────────────────
export const getAppointments    = (params = {}) => api.get('/api/appointments/', { params })
export const getAppointment     = (id) => api.get(`/api/appointments/${id}`)
export const createAppointment  = (data) => api.post('/api/appointments/', data)
export const updateApptStatus   = (id, status) => api.patch(`/api/appointments/${id}/status`, { status })
export const updateApptFollowup = (id, data) => api.patch(`/api/appointments/${id}/followup`, data)
export const deleteAppointment  = (id) => api.delete(`/api/appointments/${id}`)
export const getPatientHistory  = (patientId) => api.get(`/api/appointments/history/${patientId}`)
export const getFollowups       = (days = 30) => api.get(`/api/appointments/followups?upcoming_days=${days}`)
export const autoAssignDoctor   = (data) => api.post('/api/appointments/auto-assign', data)

// ─── Ambulance requests ───────────────────────────────────────────────────────
export const getAmbulance          = (params = {}) => api.get('/api/ambulance/', { params })
export const createAmbulance       = (data) => api.post('/api/ambulance/', data)
export const updateAmbulanceStatus = (id, status) => api.patch(`/api/ambulance/${id}/status`, { status })
export const deleteAmbulance       = (id) => api.delete(`/api/ambulance/${id}`)

// ─── Ambulance units (fleet) ──────────────────────────────────────────────────
export const getAmbulanceUnits       = (params = {}) => api.get('/api/ambulance/units/', { params })
export const createAmbulanceUnit     = (data) => api.post('/api/ambulance/units/', data)
export const updateAmbulanceUnitStatus = (id, data) => api.patch(`/api/ambulance/units/${id}/status`, data)
export const deleteAmbulanceUnit     = (id) => api.delete(`/api/ambulance/units/${id}`)

// ─── Blood ────────────────────────────────────────────────────────────────────
export const getBlood    = (params = {}) => api.get('/api/blood/', { params })
export const createBlood = (data) => api.post('/api/blood/', data)
export const deleteBlood = (id) => api.delete(`/api/blood/${id}`)

// ─── Hospitals ────────────────────────────────────────────────────────────────
export const getHospitals   = (params = {}) => api.get('/api/hospitals/', { params })
export const createHospital = (data) => api.post('/api/hospitals/', data)
export const deleteHospital = (id) => api.delete(`/api/hospitals/${id}`)

export default api
