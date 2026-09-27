# Healthcare Coordinator

> **A lightweight clinic coordination dashboard for managing appointments, patient registration, automated doctor availability checks, ambulance requests, blood banks, and nearby facilities from one interface.**

---

## Quick Start (VS Code)

### 1. Backend

```powershell
cd backend
& "C:\Users\Pranav\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

### 2. Seed Demo Data (Doctors, Patients, Appointments, Resources)

```powershell
cd backend
& "C:\Users\Pranav\AppData\Local\Programs\Python\Python312\python.exe" ..\data\seed_data.py
```

### 3. Frontend

```powershell
cd frontend
npm run dev
# App → http://localhost:5173
```

---

## Doctor Availability Engine & Booking Workflow

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

### 2. Booking Demonstration Flow
1. Staff selects **Patient** from dropdown.
2. Staff selects **Date** and **Time**.
3. Staff clicks **[ Check Doctor Availability ]**.
4. System automatically evaluates all clinic doctors against working days, hours, status, and scheduled appointments.
5. System displays:
   - **AVAILABLE DOCTORS:** Name, Specialization, Working Hours, and a manual `[ Select ]` button.
   - **UNAVAILABLE DOCTORS:** Name, Specialization, and specific refusal reason.
6. Staff manually selects the desired available doctor (no auto-assignment).
7. On submission, backend performs a final authoritative check before committing the appointment.

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

## Automated Tests (Scenarios 1-9)

```powershell
& "C:\Users\Pranav\AppData\Local\Programs\Python\Python312\python.exe" tests/test_api.py
```
*(22/22 assertions passing — verifying all 9 prompt test scenarios including off-day, off-hours, scheduled conflict, cancelled/completed pass-through, and double-booking rejection)*
