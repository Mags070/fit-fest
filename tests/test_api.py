"""
Basic API smoke tests including all features & severity.
Run with: python tests/test_api.py  (while backend is running on port 8000)
"""
import urllib.request
import json
import sys

BASE = "http://localhost:8000"

passed = 0
failed = 0


def check(label, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {label}")
        passed += 1
    else:
        print(f"  [FAIL] {label}{' -- ' + detail if detail else ''}")
        failed += 1


def get(path):
    with urllib.request.urlopen(f"{BASE}{path}") as r:
        return json.loads(r.read())


def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=body,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def patch(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=body,
        headers={"Content-Type": "application/json"}, method="PATCH"
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


print("\n=== Healthcare Coordinator API Tests ===\n")

# Health
print("Health check:")
r = get("/health")
check("GET /health returns ok", r["status"] == "ok")

# Dashboard
print("\nDashboard:")
d = get("/api/dashboard/")
check("Has total_patients key",     "total_patients"      in d)
check("Has today_appointments",     "today_appointments"    in d)
check("Has pending_ambulances",     "pending_ambulances"    in d)
check("Has available_blood",        "available_blood"     in d)
check("Has followups_due_today",    "followups_due_today" in d)
check("Has total_units",            "total_units"         in d)
check("Has total_hospitals",        "total_hospitals"     in d)

# Patients
print("\nPatients:")
patients = get("/api/patients/")
check("Returns list", isinstance(patients, list))
check("Has at least 1 patient", len(patients) >= 1)

# Patient History
print("\nPatient Visit History:")
if patients:
    p_id = patients[0]["id"]
    hist = get(f"/api/appointments/history/{p_id}")
    check("History returns list", isinstance(hist, list))
    if hist:
        check("History record includes severity", "severity" in hist[0])

# Appointments & Severity
print("\nAppointments & Severity:")
from datetime import date
today = date.today().isoformat()
appts = get(f"/api/appointments/?date_filter={today}")
check("Today appointments returns list", isinstance(appts, list))
if appts:
    check("Appointment has severity field", "severity" in appts[0])

critical_appts = get("/api/appointments/?severity=CRITICAL")
check("Severity filter returns list", isinstance(critical_appts, list))

followups = get("/api/appointments/followups?upcoming_days=30")
check("Follow-ups endpoint returns list", isinstance(followups, list))

# Ambulance & Fleet Units
print("\nAmbulance Requests & Fleet Units:")
amb = get("/api/ambulance/")
check("Ambulance requests returns list", isinstance(amb, list))

units = get("/api/ambulance/units/")
check("Ambulance fleet units returns list", isinstance(units, list))
check("At least 1 unit in fleet", len(units) >= 1)

# Blood search
print("\nBlood search:")
blood = get("/api/blood/?group=B%2B&location=Pune")
check("Blood search returns list", isinstance(blood, list))

# Hospitals Directory
print("\nHospitals Directory:")
hospitals = get("/api/hospitals/")
check("Hospitals endpoint returns list", isinstance(hospitals, list))
check("At least 1 hospital in directory", len(hospitals) >= 1)

# Create patient test
print("\nCreate patient:")
new_p = post("/api/patients/", {
    "name": "Test Patient", "age": 25, "gender": "Male",
    "phone": "9000000001", "blood_group": "O+", "location": "Pune"
})
check("Created successfully", new_p["id"] is not None)

# Create appointment with severity
print("\nCreate appointment with CRITICAL severity:")
new_appt = post("/api/appointments/", {
    "patient_id": new_p["id"],
    "appointment_date": today,
    "appointment_time": "16:00",
    "reason": "Chest Pain Evaluation",
    "status": "Scheduled",
    "severity": "CRITICAL"
})
check("Appointment created", new_appt["id"] is not None)
check("Severity matches CRITICAL", new_appt["severity"] == "CRITICAL")

# Create hospital test
print("\nCreate hospital facility:")
new_h = post("/api/hospitals/", {
    "name": "Test Clinic Facility",
    "type": "Clinic",
    "address": "123 Test St",
    "location": "Pune",
    "phone": "020-99998888",
    "emergency_24h": True,
    "speciality": "General"
})
check("Hospital created successfully", new_h["id"] is not None)

print(f"\n=== Results: {passed} passed, {failed} failed ===\n")
sys.exit(0 if failed == 0 else 1)
