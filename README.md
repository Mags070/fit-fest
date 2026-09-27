# Healthcare Coordinator

> **A lightweight clinic coordination dashboard for managing appointments, patient registration, automated doctor availability checks, ambulance requests, blood banks, and nearby facilities from one interface.**

---

## Quick Start (VS Code)

### 1. Backend

```powershell
cd backend
uvicorn main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

### 2. Seed Demo Data (Doctors, Patients, Appointments, Resources)

```powershell
cd backend
cd data
seed_data.py
```

### 3. Frontend

```powershell
cd frontend
npm run dev
# App → http://localhost:5173
```

---

## Doctor Availability & Automatic Assignment Engine

### 1. Doctor Availability Rules
A doctor is considered **AVAILABLE** only if **ALL** of these conditions are met:
1. **Doctor exists** in the system.
2. **Doctor status** is `Available`.
3. **Working Days:** Target date falls within doctor's working days (e.g. `Mon-Fri` or `Mon-Sat`).
4. **Working Hours:** Target time is within working hours (`start_time <= appointment_time < end_time`).
5. **No Conflicting Booking:** Doctor does **not** already have a `Scheduled` appointment at that exact date and time.
   - `Scheduled` appointments block availability.
   - `Completed` and `Cancelled` appointments do **not** block availability.

If any condition fails, the doctor is categorized under **Unavailable Doctors** with the exact human-readable reason:
- *"Doctor is not working on this day."*
- *"Outside doctor's working hours."*
- *"Already booked at this time."*
- *"Doctor is marked unavailable."*

### 2. Automatic Doctor Assignment & Workload Balancing
When booking an appointment, staff can choose either manual selection or **[ Auto Assign Doctor ]**:
- **Workload Formula:** Counts ONLY active appointments (`status == "Scheduled"`) for that doctor on the specified date (`Completed` and `Cancelled` appointments do not count).
- **Selection Rule:** Selects the available doctor with the lowest active scheduled appointment workload.
- **Deterministic Tie-Breaker:** If multiple available doctors have the same lowest workload, the tie is broken by lowest doctor ID (`doctor.id`).
- **Suggested Assignment Banner:** Displays doctor name, specialization, working hours, active appointment count, and explanation ("Lowest current appointment workload among available doctors.").
- **Explicit Confirmation:** Staff explicitly confirms the booking by clicking **[ Confirm Appointment ]** (or **[ Choose Another Doctor ]**).
- **Race Condition Prevention:** When the booking is submitted, the backend re-validates doctor availability. If the slot was taken concurrently, the booking is safely rejected with HTTP 400 and a friendly message.

### 3. Booking Demonstration Flow
1. Staff selects **Patient** from dropdown.
2. Staff selects **Date** and **Time**.
3. Staff can click:
   - **[ Check Availability ]**: Inspect available & unavailable doctors along with their active workload (`X booked today`).
   - **[ Auto Assign Doctor ]**: Evaluates available doctors and pre-selects the doctor with the lowest workload, displaying the **Suggested Assignment** card.
4. Staff can keep the suggested assignment or click **[ Choose Another Doctor ]** to manually pick any available doctor.
5. Staff explicitly clicks **[ Confirm Appointment ]**.
6. Backend performs final authoritative check before committing to SQLite.

---

## API Endpoints

| Method | URL                                       | Description                               |
| ------ | ----------------------------------------- | ----------------------------------------- |
| GET    | `/api/dashboard/`                         | Aggregate statistics (incl. doctors)      |
| GET    | `/api/doctors/`                           | List all doctors                          |
| POST   | `/api/doctors/`                           | Register a new doctor                     |
| GET    | `/api/doctors/available?date=...&time=...`| Categorized available & unavailable list  |
| GET    | `/api/doctors/{id}/schedule?date=...`     | Doctor 30-min schedule slots for a day    |
| PATCH  | `/api/doctors/{id}`                       | Update doctor info or status              |
| GET    | `/api/patients/`                          | List / search patients                    |
| POST   | `/api/patients/`                          | Create patient                            |
| POST   | `/api/appointments/auto-assign`           | Workload-balanced doctor auto-assignment  |
| GET    | `/api/appointments/`                      | List appointments (filter date/doc/status)|
| POST   | `/api/appointments/`                      | Book appointment & validate doctor slot   |
| PATCH  | `/api/appointments/{id}/status`           | Update appointment status                 |
| GET    | `/api/appointments/history/{patient_id}`  | Patient visit history                     |
| GET    | `/api/ambulance/`                         | List emergency requests                   |
| POST   | `/api/ambulance/`                         | Create ambulance request                  |
| GET    | `/api/ambulance/units/`                   | List fleet units & availability           |
| GET    | `/api/blood/?group=...&location=...`      | Search blood bank records                 |
| GET    | `/api/hospitals/`                         | Nearby hospital directory                 |

---

## Automated Tests (Availability & Auto-Assignment Suites)

```powershell
& "C:\Users\Pranav\AppData\Local\Programs\Python\Python312\python.exe" tests/test_api.py
```
*(38/38 assertions passing — covering all 18 test scenarios: doctor availability conditions, categorized refusal reasons, conflict checks, edge cases 1-9, plus Automatic Doctor Assignment scenarios 1-9 including workload balancing, tie-breakers, race condition prevention, and explicit confirmation)*

