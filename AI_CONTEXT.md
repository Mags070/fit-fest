# AI_CONTEXT.md — Healthcare Coordinator Project Memory

> This file is the AI assistant's project memory for the Healthcare Coordinator hackathon MVP.

---

## PROJECT PURPOSE

A lightweight clinic coordination dashboard for managing:
1. Patient registration & search
2. Appointment booking / tracking / status scheduling
3. Follow-up reminders & tracking
4. Patient visit history
5. Ambulance requests & Fleet availability/location management
6. Blood availability search by group + location
7. Nearby hospital / clinic directory
8. Clinic operational dashboard with live statistics

**It is NOT a medical decision system.** No diagnosis, no treatment, no prescriptions.

---

## TECH STACK

| Layer      | Technology                |
| ---------- | ------------------------- |
| Frontend   | React 18 + Vite (JSX)     |
| Backend    | FastAPI (Python)          |
| Database   | SQLite                    |
| ORM        | SQLAlchemy                |
| Validation | Pydantic                  |
| Container  | Docker                    |
| Deployment | Google Cloud Run          |

---

## DATABASE SCHEMA

### patients
| Column      | Type    |
| ----------- | ------- |
| id          | Integer |
| name        | String  |
| age         | Integer |
| gender      | String  |
| phone       | String  |
| blood_group | String  |
| location    | String  |
| created_at  | DateTime|

### appointments
| Column           | Type   |
| ---------------- | ------ |
| id               | Integer|
| patient_id       | FK     |
| appointment_date | String |
| appointment_time | String |
| reason           | String |
| status           | String → Scheduled / Completed / Cancelled |
| follow_up_date   | String → YYYY-MM-DD or None |
| follow_up_notes  | String → Notes or None |
| created_at       | DateTime|

### ambulance_requests
| Column      | Type   |
| ----------- | ------ |
| id          | Integer|
| patient_name| String |
| phone       | String |
| location    | String |
| destination | String |
| priority    | String → LOW / MEDIUM / HIGH |
| status      | String → PENDING / ASSIGNED / COMPLETED |
| created_at  | DateTime|

### ambulance_units (Fleet)
| Column        | Type   |
| ------------- | ------ |
| id            | Integer|
| unit_name     | String |
| driver_name   | String |
| phone         | String |
| location      | String |
| status        | String → AVAILABLE / ON_CALL / UNAVAILABLE |
| vehicle_number| String |
| created_at    | DateTime|

### blood_records
| Column          | Type   |
| --------------- | ------ |
| id              | Integer|
| blood_group     | String |
| location        | String |
| units_available | Integer|
| contact         | String |
| source_name     | String |
| status          | String → AVAILABLE / UNAVAILABLE |
| created_at      | DateTime|

### hospitals
| Column       | Type    |
| ------------ | ------- |
| id           | Integer |
| name         | String  |
| type         | String → Hospital / Clinic / Blood Bank / Pharmacy |
| address      | String  |
| location     | String  |
| phone        | String  |
| emergency_24h| Boolean |
| speciality   | String  |
| distance_km  | Float   |
| created_at   | DateTime|

---

## API CONTRACTS

- `GET  /api/dashboard/`               → aggregate counts & stats
- `POST /api/patients/`                → create patient
- `GET  /api/patients/?search=...`     → list + search
- `PATCH /api/patients/{id}`           → update patient
- `DELETE /api/patients/{id}`          → delete
- `POST /api/appointments/`            → book appointment
- `GET  /api/appointments/?date_filter=&status=` → list filtered
- `GET  /api/appointments/followups?upcoming_days=` → list pending follow-ups
- `GET  /api/appointments/history/{patient_id}`     → patient visit history
- `PATCH /api/appointments/{id}/status`→ update status
- `PATCH /api/appointments/{id}/followup` → update follow-up date/notes
- `POST /api/ambulance/`               → create emergency request
- `GET  /api/ambulance/?status=&priority=` → list requests
- `PATCH /api/ambulance/{id}/status`   → update request status
- `POST /api/ambulance/units/`         → create fleet unit
- `GET  /api/ambulance/units/?status=&location=` → list fleet units
- `PATCH /api/ambulance/units/{id}/status` → update fleet unit status
- `GET  /api/blood/?group=&location=`  → search blood
- `POST /api/blood/`                   → add blood record
- `GET  /api/hospitals/?location=&type=&emergency_only=` → list facilities
- `POST /api/hospitals/`               → add facility record

---

## FRONTEND ROUTES

| Path           | Component    | Feature |
| -------------- | ------------ | ------- |
| /              | Dashboard    | Clinic stats & live overview |
| /patients      | Patients     | Registration, Search, Visit History |
| /appointments  | Appointments | Booking, Scheduling, Status updates |
| /reminders     | Reminders    | Follow-up reminders & tracking |
| /emergency     | Emergency    | Emergency requests & Fleet Availability |
| /blood         | Blood        | Blood group search & records |
| /hospitals     | Hospitals    | Nearby hospitals/clinics directory |

---

## CURRENT STATUS

- [x] Backend complete (FastAPI + SQLAlchemy + SQLite v2.0)
- [x] All 6 tables + 7 API routers
- [x] Frontend complete (React + Vite)
- [x] All 7 pages & components built and verified
- [x] Seed data script (Patients, Appts, Follow-ups, Ambulances, Fleet, Blood, Hospitals)
- [x] Dockerfile
- [x] 21/21 API Smoke Tests passing
- [x] Production build passing (0 errors)
