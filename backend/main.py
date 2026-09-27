from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from database import engine, Base

# Import all models so SQLAlchemy creates tables
from models import patient, appointment, ambulance, blood
from models import ambulance_unit, hospital, doctor

# Import routers
from routes import patients, appointments
from routes import ambulance as ambulance_router
from routes import blood as blood_router
from routes import dashboard
from routes import ambulance_units, hospitals, doctors

# Create all tables (safe — skips existing ones)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Healthcare Coordination API",
    description="Clinic coordination: appointments, doctor availability, emergency resources, blood search, nearby hospitals.",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routes
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(ambulance_router.router)
app.include_router(blood_router.router)
app.include_router(dashboard.router)
# Directory routes
app.include_router(ambulance_units.router)
app.include_router(hospitals.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.1.0"}


# Serve React SPA in production (static/ dir created by Docker build)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
