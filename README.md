# Healthcare Coordinator

> **A lightweight clinic coordination dashboard for managing appointments, patient registration, doctor schedules and availability, ambulance requests, blood banks, and nearby facilities from one interface.**

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

## Tech Stack

| Layer      | Technology           |
| ---------- | -------------------- |
| Frontend   | React 18 + Vite      |
| Backend    | FastAPI              |
| Database   | SQLite + SQLAlchemy  |
| Validation | Pydantic             |
| Styling    | Custom CSS           |
| Container  | Docker               |
| Deployment | Google Cloud Run     |

---

## Doctor Management & Patient Assignment

### 1. Doctor Availability Logic
A doctor is available for an appointment if:
1. Marked **Available** (`status == "Available"`).
2. The selected date falls within their working days (e.g. `Mon-Fri` or `Mon-Sat`).
3. The selected time is within their working hours (`start_time <= appointment_time < end_time`).
4. The doctor does **not** already have an active appointment (`status != "Cancelled"`) at that exact date and time (prevents double-booking).

### 2. Patient Assignment Flow
`Patient` ➔ `Date & Time` ➔ `Query Available Doctors` ➔ `Select Doctor` ➔ `Assign Patient & Book` ➔ `Doctor Schedule Updated`

---

## API Endpoints

| Method | URL                                       | Description                               |
| ------ | ----------------------------------------- | ----------------------------------------- |
| GET    | `/api/dashboard/`                         | Aggregate statistics (incl. doctors)      |
| GET    | `/api/doctors/`                           | List all doctors                          |
| POST   | `/api/doctors/`                           | Register a new doctor                     |
| GET    | `/api/doctors/available?date=...&time=...`| Check doctors available for a slot        |
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

## Running Automated Tests

```powershell
& "C:\Users\Pranav\AppData\Local\Programs\Python\Python312\python.exe" tests/test_api.py
```
*(33/33 tests passing — including double-booking rejection and edge cases)*

---

## Docker / Cloud Run

```bash
docker build -t healthcare-coordinator .
docker run -p 8080:8080 healthcare-coordinator

# Deploy to Cloud Run
gcloud run deploy healthcare-coordinator \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080
```
