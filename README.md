# Healthcare Coordinator

> **A lightweight clinic coordination dashboard for managing appointments, patients, ambulance requests, and blood-resource information from one interface.**

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

### 2. Seed Demo Data

```bash
python data/seed_data.py
```

### 3. Frontend

```bash
cd frontend
npm install
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

## API Endpoints

| Method | URL                                   | Description                  |
| ------ | ------------------------------------- | ---------------------------- |
| GET    | `/api/dashboard/`                     | Dashboard aggregate stats    |
| GET    | `/api/patients/`                      | List / search patients        |
| POST   | `/api/patients/`                      | Create patient               |
| PATCH  | `/api/patients/{id}`                  | Update patient               |
| DELETE | `/api/patients/{id}`                  | Delete patient               |
| GET    | `/api/appointments/`                  | List appointments (filtered) |
| POST   | `/api/appointments/`                  | Book appointment             |
| PATCH  | `/api/appointments/{id}/status`       | Update appointment status    |
| DELETE | `/api/appointments/{id}`              | Delete appointment           |
| GET    | `/api/ambulance/`                     | List ambulance requests      |
| POST   | `/api/ambulance/`                     | Create ambulance request     |
| PATCH  | `/api/ambulance/{id}/status`          | Update ambulance status      |
| GET    | `/api/blood/?group=B%2B&location=Pune`| Search blood by group/loc    |
| POST   | `/api/blood/`                         | Add blood record             |

---

## Docker / Cloud Run

```bash
# Build
docker build -t healthcare-coordinator .

# Run locally
docker run -p 8080:8080 healthcare-coordinator

# Deploy to Cloud Run
gcloud run deploy healthcare-coordinator \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080
```

---

## Project Structure

```
healthcare-coordinator/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── database.py      # SQLAlchemy setup
│   ├── models/          # DB models
│   ├── schemas/         # Pydantic schemas
│   ├── routes/          # API routers
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/       # Dashboard, Patients, Appointments, Emergency, Blood
│       ├── components/  # Navbar, StatCard, Modal, Badge
│       └── services/    # api.js (axios)
├── data/
│   └── seed_data.py
├── Dockerfile
└── docker-compose.yml
```

---

## Scope

This MVP focuses **exclusively on administrative coordination**:

- ✅ Patient registration
- ✅ Appointment management
- ✅ Ambulance request tracking
- ✅ Blood availability search
- ✅ Unified dashboard

**Not in scope (by design):**
- ❌ Medical diagnosis
- ❌ Prescription management
- ❌ Live GPS / ambulance dispatch
- ❌ Authentication
- ❌ Real-time blood inventory
