# AI_CONTEXT.md — Healthcare Coordinator Project Memory

> This file is the AI assistant's project memory for the Healthcare Coordinator hackathon MVP.

---

## PROJECT PURPOSE

A lightweight clinic coordination dashboard for managing:
1. Patient registration & search
2. Doctor management, availability checking & daily schedules
3. Appointment booking, doctor assignment & status scheduling
4. Follow-up reminders & tracking
5. Patient visit history
6. Ambulance requests & Fleet availability/location management
7. Blood availability search by group + location
8. Nearby hospital / clinic directory
9. Clinic operational dashboard with live statistics

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

### doctors
| Column         | Type    |
| -------------- | ------- |
| id             | Integer |
| name           | String  |
| specialization | String  |
| phone          | String  |
| available_days | String  |
| start_time     | String  |
| end_time       | String  |
| status         | String → Available / Unavailable |
| created_at     | DateTime|

### appointments
| Column           | Type   |
| ---------------- | ------ |
| id               | Integer|
| patient_id       | FK     |
| doctor_id        | FK (nullable) |
| appointment_date | String |
| appointment_time | String |
| reason           | String |
| status           | String → Scheduled / Completed / Cancelled |
| severity         | String → ROUTINE / URGENT / CRITICAL |
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

## DOCTOR AVAILABILITY LOGIC

A doctor is available at a given `date` and `time` if:
1. `doctor.status == "Available"`
2. Selected date falls within their working days (checked via `is_doctor_working_on_date`).
3. Selected time falls within their working hours (`start_time <= time < end_time`).
4. Doctor has no active appointment (`status != "Cancelled"`) at that exact date and time.

---

## APPOINTMENT ASSIGNMENT WORKFLOW

1. Staff selects Patient, Date, and Time in the Booking Modal.
2. The UI automatically queries `/api/doctors/available?date=YYYY-MM-DD&time=HH:MM`.
3. Available doctors are displayed with their specialization and hours.
4. Staff selects the doctor.
5. On submit, backend re-validates availability (checking status, working days, working hours, and conflicts).
6. Appointment is booked and linked to the doctor; doctor schedule updates in real-time.

---

## API CONTRACTS

- `GET  /api/dashboard/`               → aggregate counts (includes doctors)
- `GET  /api/doctors/`                 → list all doctors
- `POST /api/doctors/`                 → create doctor
- `GET  /api/doctors/{id}`             → get doctor details
- `PATCH /api/doctors/{id}`            → update doctor info / status
- `DELETE /api/doctors/{id}`           → delete doctor
- `GET  /api/doctors/available?date=...&time=...` → available doctors
- `GET  /api/doctors/{id}/schedule?date=...`     → doctor schedule slots
- `POST /api/patients/`                → create patient
- `GET  /api/patients/?search=...`     → list + search
- `POST /api/appointments/`            → book appointment with optional doctor assignment
- `GET  /api/appointments/?date_filter=&status=&severity=&doctor_id=` → list filtered
- `GET  /api/appointments/followups?upcoming_days=` → list pending follow-ups
- `GET  /api/appointments/history/{patient_id}`     → patient visit history
- `PATCH /api/appointments/{id}/status`→ update status
- `PATCH /api/appointments/{id}/followup` → update follow-up date/notes
- `POST /api/ambulance/`               → create emergency request
- `GET  /api/ambulance/?status=&priority=` → list requests
- `POST /api/ambulance/units/`         → create fleet unit
- `GET  /api/ambulance/units/?status=&location=` → list fleet units
- `GET  /api/blood/?group=&location=`  → search blood
- `POST /api/blood/`                   → add blood record
- `GET  /api/hospitals/?location=&type=&emergency_only=` → list facilities

---

## FRONTEND ROUTES

| Path           | Component    | Feature |
| -------------- | ------------ | ------- |
| /              | Dashboard    | Clinic stats & live overview |
| /patients      | Patients     | Registration, Search, Visit History |
| /doctors       | Doctors      | Directory, status toggling, schedule view |
| /appointments  | Appointments | Booking, Doctor availability, Status updates |
| /reminders     | Reminders    | Follow-up reminders & tracking |
| /emergency     | Emergency    | Emergency requests & Fleet Availability |
| /blood         | Blood        | Blood group search & records |
| /hospitals     | Hospitals    | Nearby hospitals/clinics directory |

---

## CURRENT STATUS

- [x] Backend complete (FastAPI + SQLAlchemy + SQLite v2.1)
- [x] All 7 tables + 8 API routers
- [x] Doctor management, availability checking, and schedule slots
- [x] Doctor assignment during appointment booking with backend double-booking validation
- [x] Frontend complete (React + Vite)
- [x] All 8 pages & components built and verified
- [x] Seed data script (Patients, Doctors, Appts, Follow-ups, Ambulances, Fleet, Blood, Hospitals)
- [x] Dockerfile
- [x] 33/33 API Smoke Tests passing (including edge cases & conflict rejection)
- [x] Production build passing (0 errors)
