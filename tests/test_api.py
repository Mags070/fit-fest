"""
Comprehensive API test suite including Doctor Management, Availability,
Scheduling, Edge Cases, Double-Booking, Working Hours validation,
and existing features.
Run with: python tests/test_api.py (while backend is running on port 8000)
"""
import urllib.request
import urllib.error
import json
import sys
from datetime import date, timedelta

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

# 1. Health check
print("1. Health check:")
r = get("/health")
check("GET /health returns ok", r["status"] == "ok")

# 2. Dashboard with Doctor Stats
print("\n2. Dashboard & Metrics:")
d = get("/api/dashboard/")
check("Has total_patients",       "total_patients"      in d)
check("Has total_doctors",        "total_doctors"       in d and d["total_doctors"] >= 5)
check("Has available_doctors",    "available_doctors"   in d)
check("Has today_appointments",   "today_appointments"  in d)
check("Has pending_ambulances",   "pending_ambulances"  in d)
check("Has available_blood",      "available_blood"     in d)
check("Has available_units",      "available_units"     in d)

# 3. Doctor Management & Listing
print("\n3. Doctor Management & Listing:")
doctors = get("/api/doctors/")
check("Returns list of doctors", isinstance(doctors, list))
check("At least 5 doctors loaded", len(doctors) >= 5)
priya = next((doc for doc in doctors if "Priya" in doc["name"]), None)
check("Dr. Priya Sharma exists", priya is not None)
if priya:
    check("Dr. Priya working days are Mon-Fri", priya["available_days"] == "Mon-Fri")
    check("Dr. Priya hours are 10:00-14:00", priya["start_time"] == "10:00" and priya["end_time"] == "14:00")

# 4. Create Doctor
print("\n4. Create New Doctor:")
new_doc = post("/api/doctors/", {
    "name": "Dr. Sameer Joshi",
    "specialization": "Dermatologist",
    "phone": "9899001122",
    "available_days": "Mon-Fri",
    "start_time": "11:00",
    "end_time": "15:00",
    "status": "Available"
})
check("Created doctor successfully", new_doc["id"] is not None)
check("Specialization matches", new_doc["specialization"] == "Dermatologist")

# 5. Doctor Availability Check
print("\n5. Doctor Availability Check:")
# Find next Monday to test Monday-Friday availability
today_date = date.today()
days_ahead = (0 - today_date.weekday() + 7) % 7
if days_ahead == 0:
    days_ahead = 7
next_monday = today_date + timedelta(days=days_ahead)
next_sunday = next_monday + timedelta(days=6)

mon_str = next_monday.isoformat()
sun_str = next_sunday.isoformat()

# Monday at 10:30 -> Dr. Priya Sharma should be available
avail_mon = get(f"/api/doctors/available?date={mon_str}&time=10:30")
check("Available doctors returned for Monday 10:30", isinstance(avail_mon, list))
priya_avail = any("Priya" in d["name"] for d in avail_mon)
check("Dr. Priya is available on Monday 10:30", priya_avail)

# Sunday at 10:30 -> Dr. Priya Sharma (Mon-Fri) should NOT be available
avail_sun = get(f"/api/doctors/available?date={sun_str}&time=10:30")
priya_sun = any("Priya" in d["name"] for d in avail_sun)
check("Dr. Priya is NOT available on Sunday (Edge Case C: unavailable day)", not priya_sun)

# 6. Doctor Schedule View
print("\n6. Doctor Schedule View:")
if priya:
    sched = get(f"/api/doctors/{priya['id']}/schedule?date={mon_str}")
    check("Schedule returned", "slots" in sched)
    check("Slots count >= 6 (10:00 to 14:00)", len(sched["slots"]) >= 6)
    check("Works today is True for Monday", sched["works_today"] is True)

# 7. Create Appointment with Doctor Assignment
print("\n7. Appointment Creation with Doctor Assignment:")
patients = get("/api/patients/")
p_id = patients[0]["id"]

new_appt = post("/api/appointments/", {
    "patient_id": p_id,
    "doctor_id": priya["id"],
    "appointment_date": mon_str,
    "appointment_time": "11:30",
    "reason": "Consultation with Dr. Priya",
    "status": "Scheduled",
    "severity": "ROUTINE"
})
check("Appointment booked with doctor", new_appt["id"] is not None)
check("Doctor name enriched in response", new_appt["doctor_name"] == priya["name"])

# Verify schedule updated
sched_after = get(f"/api/doctors/{priya['id']}/schedule?date={mon_str}")
slot_1130 = next((s for s in sched_after["slots"] if s["time"] == "11:30"), None)
check("Schedule slot 11:30 is now booked", slot_1130 is not None and slot_1130["available"] is False)

# 8. Attempt Double Booking (Edge Case B: prevent double booking)
print("\n8. Attempt Double Booking (Edge Case B):")
double_book_rejected = False
try:
    post("/api/appointments/", {
        "patient_id": patients[1]["id"],
        "doctor_id": priya["id"],
        "appointment_date": mon_str,
        "appointment_time": "11:30",
        "reason": "Conflicting appointment",
        "status": "Scheduled",
        "severity": "URGENT"
    })
except urllib.error.HTTPError as e:
    if e.code == 400:
        double_book_rejected = True
check("Double booking rejected with HTTP 400", double_book_rejected)

# 9. Attempt Booking Outside Working Hours (Edge Case D)
print("\n9. Attempt Booking Outside Working Hours (Edge Case D):")
outside_hours_rejected = False
try:
    post("/api/appointments/", {
        "patient_id": p_id,
        "doctor_id": priya["id"],
        "appointment_date": mon_str,
        "appointment_time": "16:00",  # Priya works 10:00-14:00
        "reason": "Late appointment",
        "status": "Scheduled"
    })
except urllib.error.HTTPError as e:
    if e.code == 400:
        outside_hours_rejected = True
check("Booking outside working hours rejected with HTTP 400", outside_hours_rejected)

# 10. Attempt Booking on Unavailable Day (Edge Case C)
print("\n10. Attempt Booking on Unavailable Day (Edge Case C):")
wrong_day_rejected = False
try:
    post("/api/appointments/", {
        "patient_id": p_id,
        "doctor_id": priya["id"],
        "appointment_date": sun_str,  # Priya works Mon-Fri
        "appointment_time": "11:00",
        "reason": "Sunday appointment",
        "status": "Scheduled"
    })
except urllib.error.HTTPError as e:
    if e.code == 400:
        wrong_day_rejected = True
check("Booking on doctor unavailable day rejected with HTTP 400", wrong_day_rejected)

# 11. Appointment Status Transition
print("\n11. Appointment Status Transition:")
patched = patch(f"/api/appointments/{new_appt['id']}/status", {"status": "Completed"})
check("Appointment status transitioned to Completed", patched["status"] == "Completed")

# 12. Verify Existing Patient, Emergency, Fleet, and Blood Functionality
print("\n12. Verify Existing Features:")
searched_p = get("/api/patients/?search=Rahul")
check("Patient search works", len(searched_p) >= 1)

amb_list = get("/api/ambulance/?status=PENDING")
check("Ambulance filter works", isinstance(amb_list, list))

fleet = get("/api/ambulance/units/")
check("Fleet units work", len(fleet) >= 1)

blood = get("/api/blood/?group=B%2B&location=Pune")
check("Blood search works", len(blood) >= 1)

hospitals = get("/api/hospitals/")
check("Hospitals directory works", len(hospitals) >= 1)

print(f"\n=== Test Results: {passed} passed, {failed} failed ===\n")
sys.exit(0 if failed == 0 else 1)
