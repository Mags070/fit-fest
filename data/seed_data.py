# -*- coding: utf-8 -*-
"""
Seed script -- populates the database with realistic demo data.
Run from the backend/ directory:
    python ..\data\seed_data.py
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from database import SessionLocal, engine, Base
from models.patient import Patient
from models.doctor import Doctor
from models.appointment import Appointment
from models.ambulance import AmbulanceRequest
from models.ambulance_unit import AmbulanceUnit
from models.blood import BloodRecord
from models.hospital import Hospital
from datetime import date, timedelta

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# --- Clear all tables ---
db.query(Appointment).delete()
db.query(AmbulanceRequest).delete()
db.query(AmbulanceUnit).delete()
db.query(BloodRecord).delete()
db.query(Hospital).delete()
db.query(Doctor).delete()
db.query(Patient).delete()
db.commit()

# ─── Patients ────────────────────────────────────────────────────────────────
patients_data = [
    {"name": "Rahul Sharma",   "age": 32, "gender": "Male",   "phone": "9876543210", "blood_group": "B+",  "location": "Pune"},
    {"name": "Sneha Patil",    "age": 27, "gender": "Female", "phone": "9823456789", "blood_group": "O+",  "location": "Pune"},
    {"name": "Amit Kulkarni",  "age": 45, "gender": "Male",   "phone": "9765432109", "blood_group": "A+",  "location": "Pimpri"},
    {"name": "Priya Desai",    "age": 38, "gender": "Female", "phone": "9654321098", "blood_group": "AB+", "location": "Chinchwad"},
    {"name": "Vikram Joshi",   "age": 55, "gender": "Male",   "phone": "9543210987", "blood_group": "O-",  "location": "Hadapsar"},
    {"name": "Meena Gaikwad",  "age": 29, "gender": "Female", "phone": "9432109876", "blood_group": "B-",  "location": "Pune"},
    {"name": "Suresh Nair",    "age": 62, "gender": "Male",   "phone": "9321098765", "blood_group": "A-",  "location": "Pune"},
    {"name": "Kavita More",    "age": 34, "gender": "Female", "phone": "9210987654", "blood_group": "B+",  "location": "Pimpri"},
]

patient_objs = []
for p in patients_data:
    obj = Patient(**p)
    db.add(obj)
    patient_objs.append(obj)
db.commit()
for obj in patient_objs:
    db.refresh(obj)
print(f"[OK] Inserted {len(patient_objs)} patients")

# ─── Doctors ─────────────────────────────────────────────────────────────────
doctors_data = [
    {"name": "Dr. Priya Sharma",    "specialization": "General Physician", "phone": "9812345678", "available_days": "Mon-Fri", "start_time": "10:00", "end_time": "14:00", "status": "Available"},
    {"name": "Dr. Amit Patil",      "specialization": "Pediatrician",      "phone": "9823456780", "available_days": "Mon-Sat", "start_time": "09:00", "end_time": "13:00", "status": "Available"},
    {"name": "Dr. Neha Kulkarni",   "specialization": "General Physician", "phone": "9834567891", "available_days": "Mon-Fri", "start_time": "14:00", "end_time": "18:00", "status": "Available"},
    {"name": "Dr. Rajesh Deshmukh", "specialization": "Orthopedic",        "phone": "9845678902", "available_days": "Mon-Sat", "start_time": "11:00", "end_time": "15:00", "status": "Available"},
    {"name": "Dr. Ananya Sen",      "specialization": "Cardiologist",      "phone": "9856789013", "available_days": "Mon-Fri", "start_time": "10:00", "end_time": "14:00", "status": "Available"},
]

doctor_objs = []
for d in doctors_data:
    obj = Doctor(**d)
    db.add(obj)
    doctor_objs.append(obj)
db.commit()
for obj in doctor_objs:
    db.refresh(obj)
print(f"[OK] Inserted {len(doctor_objs)} doctors")

# ─── Appointments ─────────────────────────────────────────────────────────────
today     = date.today().isoformat()
tomorrow  = (date.today() + timedelta(days=1)).isoformat()
in3days   = (date.today() + timedelta(days=3)).isoformat()
in5days   = (date.today() + timedelta(days=5)).isoformat()
yesterday = (date.today() - timedelta(days=1)).isoformat()

appointments_data = [
    {"patient_id": patient_objs[0].id, "doctor_id": doctor_objs[0].id, "appointment_date": today,     "appointment_time": "10:00",
     "reason": "General Consultation",  "status": "Scheduled", "severity": "ROUTINE",
     "follow_up_date": in3days, "follow_up_notes": "Review blood reports"},

    {"patient_id": patient_objs[1].id, "doctor_id": doctor_objs[1].id, "appointment_date": today,     "appointment_time": "10:30",
     "reason": "High Fever & Chills",   "status": "Completed", "severity": "URGENT",
     "follow_up_date": None, "follow_up_notes": None},

    {"patient_id": patient_objs[2].id, "doctor_id": doctor_objs[4].id, "appointment_date": today,     "appointment_time": "11:00",
     "reason": "Severe Chest Pain",     "status": "Scheduled", "severity": "CRITICAL",
     "follow_up_date": in5days, "follow_up_notes": "Discuss lab results"},

    {"patient_id": patient_objs[3].id, "doctor_id": doctor_objs[0].id, "appointment_date": today,     "appointment_time": "12:30",
     "reason": "Administrative Query",  "status": "Cancelled", "severity": "ROUTINE",
     "follow_up_date": None, "follow_up_notes": None},

    {"patient_id": patient_objs[4].id, "doctor_id": doctor_objs[3].id, "appointment_date": today,     "appointment_time": "14:00",
     "reason": "Routine Check-up",      "status": "Scheduled", "severity": "ROUTINE",
     "follow_up_date": None, "follow_up_notes": None},

    {"patient_id": patient_objs[5].id, "doctor_id": doctor_objs[1].id, "appointment_date": tomorrow,  "appointment_time": "09:30",
     "reason": "Prescription Renewal",  "status": "Scheduled", "severity": "ROUTINE",
     "follow_up_date": None, "follow_up_notes": None},

    {"patient_id": patient_objs[6].id, "doctor_id": doctor_objs[4].id, "appointment_date": tomorrow,  "appointment_time": "11:00",
     "reason": "Acute Hypertension",    "status": "Scheduled", "severity": "URGENT",
     "follow_up_date": in3days, "follow_up_notes": "Check BP"},

    {"patient_id": patient_objs[0].id, "doctor_id": doctor_objs[0].id, "appointment_date": yesterday, "appointment_time": "10:00",
     "reason": "Initial Registration",  "status": "Completed", "severity": "ROUTINE",
     "follow_up_date": None, "follow_up_notes": None},
]

for a in appointments_data:
    db.add(Appointment(**a))
db.commit()
print(f"[OK] Inserted {len(appointments_data)} appointments")

# ─── Ambulance Requests ───────────────────────────────────────────────────────
ambulance_data = [
    {"patient_name": "Vikram Joshi", "phone": "9543210987", "location": "Hadapsar", "destination": "City Hospital",    "priority": "HIGH",   "status": "PENDING"},
    {"patient_name": "Ravi Kumar",   "phone": "9112233445", "location": "Pimpri",   "destination": "Sassoon Hospital", "priority": "MEDIUM", "status": "ASSIGNED"},
    {"patient_name": "Geeta Sharma", "phone": "9223344556", "location": "Pune",     "destination": "Ruby Hall Clinic", "priority": "LOW",    "status": "COMPLETED"},
]
for a in ambulance_data:
    db.add(AmbulanceRequest(**a))
db.commit()
print(f"[OK] Inserted {len(ambulance_data)} ambulance requests")

# ─── Ambulance Units (Fleet) ──────────────────────────────────────────────────
unit_data = [
    {"unit_name": "AMB-01", "driver_name": "Sunil Pawar",   "phone": "9811111111", "location": "Pune",     "status": "AVAILABLE",   "vehicle_number": "MH12-AB-1234"},
    {"unit_name": "AMB-02", "driver_name": "Ramesh Jadhav", "phone": "9822222222", "location": "Pimpri",   "status": "ON_CALL",     "vehicle_number": "MH12-CD-5678"},
    {"unit_name": "AMB-03", "driver_name": "Ganesh Shinde", "phone": "9833333333", "location": "Hadapsar", "status": "AVAILABLE",   "vehicle_number": "MH12-EF-9012"},
    {"unit_name": "AMB-04", "driver_name": "Manoj Kadam",   "phone": "9844444444", "location": "Chinchwad","status": "UNAVAILABLE", "vehicle_number": "MH12-GH-3456"},
]
for u in unit_data:
    db.add(AmbulanceUnit(**u))
db.commit()
print(f"[OK] Inserted {len(unit_data)} ambulance units")

# ─── Blood Records ────────────────────────────────────────────────────────────
blood_data = [
    {"blood_group": "B+",  "location": "Pune",      "units_available": 4, "contact": "020-24567890", "source_name": "City Blood Bank",       "status": "AVAILABLE"},
    {"blood_group": "B+",  "location": "Pimpri",    "units_available": 2, "contact": "020-67891234", "source_name": "Pimpri Seva Blood Bank", "status": "AVAILABLE"},
    {"blood_group": "O+",  "location": "Pune",      "units_available": 8, "contact": "020-11223344", "source_name": "Sahyadri Blood Centre",  "status": "AVAILABLE"},
    {"blood_group": "A+",  "location": "Pune",      "units_available": 6, "contact": "020-22334455", "source_name": "Jehangir Blood Bank",    "status": "AVAILABLE"},
    {"blood_group": "AB+", "location": "Chinchwad", "units_available": 1, "contact": "020-33445566", "source_name": "Chinchwad Life Bank",    "status": "AVAILABLE"},
    {"blood_group": "O-",  "location": "Pune",      "units_available": 0, "contact": "020-44556677", "source_name": "Ruby Hall Blood Bank",   "status": "UNAVAILABLE"},
    {"blood_group": "A-",  "location": "Hadapsar",  "units_available": 3, "contact": "020-55667788", "source_name": "Hadapsar Health Centre", "status": "AVAILABLE"},
    {"blood_group": "B-",  "location": "Pune",      "units_available": 2, "contact": "020-66778899", "source_name": "Poona Blood Bank",       "status": "AVAILABLE"},
]
for b in blood_data:
    db.add(BloodRecord(**b))
db.commit()
print(f"[OK] Inserted {len(blood_data)} blood records")

# ─── Hospitals / Clinics ──────────────────────────────────────────────────────
hospital_data = [
    {"name": "Sassoon General Hospital",  "type": "Hospital",    "address": "Sassoon Road, Pune",              "location": "Pune",      "phone": "020-26128000", "emergency_24h": True,  "speciality": "Multispeciality",  "distance_km": 2.5},
    {"name": "Ruby Hall Clinic",          "type": "Hospital",    "address": "40 Sassoon Road, Pune",           "location": "Pune",      "phone": "020-66455000", "emergency_24h": True,  "speciality": "Multispeciality",  "distance_km": 3.0},
    {"name": "KEM Hospital",              "type": "Hospital",    "address": "Rasta Peth, Pune",                "location": "Pune",      "phone": "020-26127000", "emergency_24h": True,  "speciality": "General",          "distance_km": 1.8},
    {"name": "Jehangir Hospital",         "type": "Hospital",    "address": "32 Sassoon Road, Pune",           "location": "Pune",      "phone": "020-66814444", "emergency_24h": True,  "speciality": "Multispeciality",  "distance_km": 3.2},
    {"name": "Pimpri Chinchwad Hospital", "type": "Hospital",    "address": "Sector 23, Pimpri",              "location": "Pimpri",    "phone": "020-27471200", "emergency_24h": True,  "speciality": "General",          "distance_km": 8.0},
    {"name": "Sahyadri Hospital",         "type": "Hospital",    "address": "Deccan Gymkhana, Pune",           "location": "Pune",      "phone": "020-67213000", "emergency_24h": True,  "speciality": "Multispeciality",  "distance_km": 4.0},
    {"name": "City Blood Bank",           "type": "Blood Bank",  "address": "Camp Area, Pune",                 "location": "Pune",      "phone": "020-24567890", "emergency_24h": False, "speciality": "Blood Storage",    "distance_km": 2.0},
    {"name": "Poona Orthopaedic Hospital","type": "Hospital",    "address": "Camp, Pune",                      "location": "Pune",      "phone": "020-26364567", "emergency_24h": False, "speciality": "Orthopaedics",     "distance_km": 3.5},
    {"name": "Life Care Clinic",          "type": "Clinic",      "address": "Hadapsar Main Road",              "location": "Hadapsar",  "phone": "020-26992222", "emergency_24h": False, "speciality": "General Practice", "distance_km": 5.5},
    {"name": "MedPlus Pharmacy",          "type": "Pharmacy",    "address": "Near Railway Station, Chinchwad", "location": "Chinchwad", "phone": "020-27490000", "emergency_24h": False, "speciality": "Pharmacy",         "distance_km": 9.0},
]
for h in hospital_data:
    db.add(Hospital(**h))
db.commit()
print(f"[OK] Inserted {len(hospital_data)} hospitals/clinics")

db.close()
print("\nSeed data inserted successfully!")
print("   Open http://localhost:8000/docs to explore the API")
