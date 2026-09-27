"""
Automated Test Suite for Healthcare Coordinator
Specifically testing Doctor Availability Engine, Categorized Availability,
Conflict Checks, Edge Cases 1-9 from the specification, and existing core modules.
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


print("\n=== Healthcare Coordinator Doctor Availability & System Tests ===\n")

# Health
r = get("/health")
check("GET /health returns ok", r["status"] == "ok")

# Dashboard
d = get("/api/dashboard/")
check("Dashboard has total_doctors", "total_doctors" in d)
check("Dashboard has available_doctors", "available_doctors" in d)

# Doctors
doctors = get("/api/doctors/")
check("List doctors returns data", len(doctors) >= 5)
priya = next((doc for doc in doctors if "Priya" in doc["name"]), None)
check("Dr. Priya Sharma (Mon-Fri 10:00-14:00) exists", priya is not None)

# Calculate testing dates (future Monday & Sunday)
today_date = date.today()
days_until_mon = (0 - today_date.weekday() + 7) % 7
if days_until_mon == 0:
    days_until_mon = 7
next_monday = today_date + timedelta(days=days_until_mon)
next_sunday = next_monday + timedelta(days=6)

mon_str = next_monday.isoformat()
sun_str = next_sunday.isoformat()

print(f"\nTesting with dates: Monday = {mon_str}, Sunday = {sun_str}")

# TEST 1: Doctor works today, time is inside working hours, no appointment exists -> Available
print("\nTEST 1: Doctor works on date, inside hours, no appointment:")
res1 = get(f"/api/doctors/available?date={mon_str}&time=10:30")
avail1_ids = [d["id"] for d in res1.get("available_doctors", [])]
check("Dr. Priya is AVAILABLE on Monday at 10:30", priya["id"] in avail1_ids)

# TEST 2: Doctor does not work on selected day -> Unavailable with reason
print("\nTEST 2: Doctor does not work on selected day (Sunday):")
res2 = get(f"/api/doctors/available?date={sun_str}&time=10:30")
unavail2 = {d["id"]: d for d in res2.get("unavailable_doctors", [])}
check("Dr. Priya is UNAVAILABLE on Sunday", priya["id"] in unavail2)
if priya["id"] in unavail2:
    check("Reason is 'Doctor is not working on this day.'",
          unavail2[priya["id"]]["reason"] == "Doctor is not working on this day.")

# TEST 3: Requested time is outside working hours -> Unavailable with reason
print("\nTEST 3: Requested time is outside working hours (16:00 for 10:00-14:00):")
res3 = get(f"/api/doctors/available?date={mon_str}&time=16:00")
unavail3 = {d["id"]: d for d in res3.get("unavailable_doctors", [])}
check("Dr. Priya is UNAVAILABLE at 16:00", priya["id"] in unavail3)
if priya["id"] in unavail3:
    check("Reason is 'Outside doctor's working hours.'",
          unavail3[priya["id"]]["reason"] == "Outside doctor's working hours.")

# TEST 4: Doctor already has a Scheduled appointment at that date/time -> Unavailable with reason
print("\nTEST 4: Doctor has a Scheduled appointment at that date/time:")
patients = get("/api/patients/")
p1_id = patients[0]["id"]
p2_id = patients[1]["id"]

# Book an appointment for Dr. Priya at 10:30 on Monday
appt_scheduled = post("/api/appointments/", {
    "patient_id": p1_id,
    "doctor_id": priya["id"],
    "appointment_date": mon_str,
    "appointment_time": "10:30",
    "reason": "Consultation",
    "status": "Scheduled"
})
check("Booked Scheduled appointment for Dr. Priya at 10:30", appt_scheduled["id"] is not None)

# Now check availability for Monday at 10:30
res4 = get(f"/api/doctors/available?date={mon_str}&time=10:30")
unavail4 = {d["id"]: d for d in res4.get("unavailable_doctors", [])}
check("Dr. Priya is now UNAVAILABLE at 10:30", priya["id"] in unavail4)
if priya["id"] in unavail4:
    check("Reason is 'Already booked at this time.'",
          unavail4[priya["id"]]["reason"] == "Already booked at this time.")

# TEST 5: Doctor has a Cancelled appointment at that date/time -> Available
print("\nTEST 5: Doctor has a Cancelled appointment at that date/time:")
# Change appointment to Cancelled
patch(f"/api/appointments/{appt_scheduled['id']}/status", {"status": "Cancelled"})
res5 = get(f"/api/doctors/available?date={mon_str}&time=10:30")
avail5_ids = [d["id"] for d in res5.get("available_doctors", [])]
check("Dr. Priya is AVAILABLE again after appointment is Cancelled", priya["id"] in avail5_ids)

# TEST 6: Doctor has a Completed appointment at that date/time -> Available
print("\nTEST 6: Doctor has a Completed appointment at that date/time:")
# Change appointment to Completed
patch(f"/api/appointments/{appt_scheduled['id']}/status", {"status": "Completed"})
res6 = get(f"/api/doctors/available?date={mon_str}&time=10:30")
avail6_ids = [d["id"] for d in res6.get("available_doctors", [])]
check("Dr. Priya is AVAILABLE when appointment is Completed", priya["id"] in avail6_ids)

# Re-schedule to Scheduled to test backend double booking prevention
patch(f"/api/appointments/{appt_scheduled['id']}/status", {"status": "Scheduled"})

# Final Backend Validation test
print("\nFinal Backend Validation: Prevent booking unavailable doctor:")
rejected = False
try:
    post("/api/appointments/", {
        "patient_id": p2_id,
        "doctor_id": priya["id"],
        "appointment_date": mon_str,
        "appointment_time": "10:30",
        "reason": "Double booking attempt",
        "status": "Scheduled"
    })
except urllib.error.HTTPError as e:
    if e.code == 400:
        rejected = True
check("Backend prevents creating conflicting appointment with HTTP 400", rejected)

# TEST 7: Multiple doctors are available
print("\nTEST 7: Multiple doctors are available:")
# On Monday at 11:00, doctors working morning shifts (e.g. Dr. Amit Patil, Dr. Rajesh Deshmukh, Dr. Ananya Sen)
res7 = get(f"/api/doctors/available?date={mon_str}&time=11:00")
check("Multiple doctors available returned", len(res7.get("available_doctors", [])) >= 2)

# TEST 8: No doctors available
print("\nTEST 8: No doctors available (e.g. late night 23:00):")
res8 = get(f"/api/doctors/available?date={mon_str}&time=23:00")
check("Available doctors list is empty", len(res8.get("available_doctors", [])) == 0)
check("Unavailable doctors list has all doctors", len(res8.get("unavailable_doctors", [])) >= 5)

# TEST 9: Existing appointment booking flow still works
print("\nTEST 9: Existing appointment booking with selected doctor:")
appt_new = post("/api/appointments/", {
    "patient_id": p2_id,
    "doctor_id": priya["id"],
    "appointment_date": mon_str,
    "appointment_time": "13:00",
    "reason": "New checkup",
    "status": "Scheduled",
    "severity": "ROUTINE"
})
check("New appointment created successfully", appt_new["id"] is not None)
check("Doctor name enriched in response", appt_new["doctor_name"] == priya["name"])

# Verify schedule view
sched = get(f"/api/doctors/{priya['id']}/schedule?date={mon_str}")
slot_1300 = next((s for s in sched["slots"] if s["time"] == "13:00"), None)
check("Doctor schedule reflects booked appointment at 13:00",
      slot_1300 is not None and slot_1300["available"] is False)

# Clean up test appointment
patch(f"/api/appointments/{appt_scheduled['id']}/status", {"status": "Cancelled"})
patch(f"/api/appointments/{appt_new['id']}/status", {"status": "Cancelled"})

print(f"\n=== Test Results: {passed} passed, {failed} failed ===\n")
sys.exit(0 if failed == 0 else 1)
