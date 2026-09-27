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

# Clean up initial test appointments
patch(f"/api/appointments/{appt_scheduled['id']}/status", {"status": "Cancelled"})
patch(f"/api/appointments/{appt_new['id']}/status", {"status": "Cancelled"})

# =====================================================================
# AUTOMATIC DOCTOR ASSIGNMENT TESTS (Scenarios 1-9)
# =====================================================================
print("\n" + "="*50)
print("=== AUTOMATIC DOCTOR ASSIGNMENT TEST SUITE ===")
print("="*50 + "\n")

# Use a clean future Monday 3 weeks ahead to guarantee an isolated test slate
test_date = (next_monday + timedelta(days=21)).isoformat()
print(f"Isolated Auto-Assign Test Date: {test_date}")

# Track created test appointments for robust cleanup
auto_test_appts = []

def track_post(path, data):
    res = post(path, data)
    if "id" in res:
        auto_test_appts.append(res["id"])
    return res

try:
    # ── SCENARIO 1: Single available doctor ─────────────────────────
    print("\nAUTO TEST 1: Single available doctor is assigned:")
    # At 09:30 on Monday, Dr. Amit Patil (id=2, 09:00-13:00) is the only doctor working
    res_sc1 = post("/api/appointments/auto-assign", {
        "patient_id": p1_id,
        "appointment_date": test_date,
        "appointment_time": "09:30",
        "reason": "Routine Checkup"
    })
    check("Auto-assign returns doctor object", "doctor" in res_sc1)
    check("Dr. Amit Patil is auto-assigned (only doctor on duty at 09:30)",
          res_sc1["doctor"]["id"] == 2 and "Amit" in res_sc1["doctor"]["name"])
    check("Appointments today count is 0", res_sc1["appointments_today"] == 0)
    check("Reason indicates lowest workload", "lowest" in res_sc1["reason"].lower())

    # ── SCENARIO 2: Multiple available doctors with different workloads ──
    print("\nAUTO TEST 2: Multiple available doctors with different workloads:")
    # At 11:30 on Monday: Dr. Priya (id=1), Dr. Amit (id=2), Dr. Rajesh (id=4), Dr. Ananya (id=5), Dr. Sameer (id=6)
    # Give Dr. Priya 2 active Scheduled appointments
    a1 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 1, "appointment_date": test_date,
        "appointment_time": "10:00", "reason": "Acuity 1", "status": "Scheduled"
    })
    a2 = track_post("/api/appointments/", {
        "patient_id": p2_id, "doctor_id": 1, "appointment_date": test_date,
        "appointment_time": "10:30", "reason": "Acuity 2", "status": "Scheduled"
    })
    # Give Dr. Amit 1 active Scheduled appointment
    a3 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 2, "appointment_date": test_date,
        "appointment_time": "12:00", "reason": "Acuity 3", "status": "Scheduled"
    })
    # Dr. Rajesh (id=4), Dr. Ananya (id=5), Dr. Sameer (id=6) have 0 active appointments.
    # To test workload picking Dr. Amit when others have more:
    # Give Dr. Rajesh 3 appointments, Dr. Ananya 2 appointments, Dr. Sameer 2 appointments:
    a4 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 4, "appointment_date": test_date,
        "appointment_time": "12:30", "reason": "Checkup", "status": "Scheduled"
    })
    a5 = track_post("/api/appointments/", {
        "patient_id": p2_id, "doctor_id": 4, "appointment_date": test_date,
        "appointment_time": "13:00", "reason": "Checkup", "status": "Scheduled"
    })
    a6 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 5, "appointment_date": test_date,
        "appointment_time": "10:30", "reason": "Checkup", "status": "Scheduled"
    })
    a7 = track_post("/api/appointments/", {
        "patient_id": p2_id, "doctor_id": 5, "appointment_date": test_date,
        "appointment_time": "12:00", "reason": "Checkup", "status": "Scheduled"
    })
    a8 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 6, "appointment_date": test_date,
        "appointment_time": "12:00", "reason": "Checkup", "status": "Scheduled"
    })
    # Dr. Sameer now has 1 appointment, Dr. Amit has 1 appointment, Dr. Priya has 2, Dr. Ananya has 2, Dr. Rajesh has 2.
    # Give Dr. Sameer a 2nd appointment:
    a9 = track_post("/api/appointments/", {
        "patient_id": p2_id, "doctor_id": 6, "appointment_date": test_date,
        "appointment_time": "12:30", "reason": "Checkup", "status": "Scheduled"
    })
    # Now:
    # Dr. Amit (id=2): workload = 1
    # Dr. Priya (id=1): workload = 2
    # Dr. Rajesh (id=4): workload = 2
    # Dr. Ananya (id=5): workload = 2
    # Dr. Sameer (id=6): workload = 2
    # All are available at 11:30.
    res_sc2 = post("/api/appointments/auto-assign", {
        "patient_id": p1_id,
        "appointment_date": test_date,
        "appointment_time": "11:30",
        "reason": "Consultation"
    })
    check("Doctor with lowest active workload (Dr. Amit, workload=1) is auto-assigned",
          res_sc2["doctor"]["id"] == 2 and res_sc2["appointments_today"] == 1)

    # ── SCENARIO 3: Doctor with lowest workload is unavailable ───────
    print("\nAUTO TEST 3: Doctor with lowest workload is unavailable (ignored):")
    # Book Dr. Amit at 11:30 (so Dr. Amit is NO LONGER available at 11:30)
    a10 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 2, "appointment_date": test_date,
        "appointment_time": "11:30", "reason": "Slot block", "status": "Scheduled"
    })
    # Now Dr. Amit has workload=2 and is UNAVAILABLE at 11:30.
    # Other doctors (Priya, Rajesh, Ananya, Sameer) all have workload=2.
    # Give Dr. Rajesh another appointment so his workload is 3:
    a11 = track_post("/api/appointments/", {
        "patient_id": p2_id, "doctor_id": 4, "appointment_date": test_date,
        "appointment_time": "13:30", "reason": "Slot block", "status": "Scheduled"
    })
    # Give Dr. Priya another appointment so her workload is 3:
    a12 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 1, "appointment_date": test_date,
        "appointment_time": "12:00", "reason": "Slot block", "status": "Scheduled"
    })
    # Give Dr. Sameer another appointment so his workload is 3:
    a13 = track_post("/api/appointments/", {
        "patient_id": p2_id, "doctor_id": 6, "appointment_date": test_date,
        "appointment_time": "13:00", "reason": "Slot block", "status": "Scheduled"
    })
    # Now available at 11:30:
    # Dr. Ananya (id=5): workload = 2
    # Dr. Priya (id=1): workload = 3
    # Dr. Rajesh (id=4): workload = 3
    # Dr. Sameer (id=6): workload = 3
    # (Dr. Amit has lower workload than some, but is UNAVAILABLE at 11:30)
    res_sc3 = post("/api/appointments/auto-assign", {
        "patient_id": p2_id,
        "appointment_date": test_date,
        "appointment_time": "11:30",
        "reason": "Consultation"
    })
    check("System ignores unavailable doctor and selects Dr. Ananya (workload=2)",
          res_sc3["doctor"]["id"] == 5 and res_sc3["appointments_today"] == 2)

    # ── SCENARIO 4: Equal workloads deterministic tie-breaker ───────
    print("\nAUTO TEST 4: Equal workloads deterministic tie-breaker (lower doctor ID):")
    # On a separate test date where no doctors have appointments:
    tie_date = (next_monday + timedelta(days=28)).isoformat()
    # At 11:30, Dr. Priya (id=1), Dr. Amit (id=2), Dr. Rajesh (id=4), Dr. Ananya (id=5), Dr. Sameer (id=6)
    # all have 0 appointments.
    res_sc4 = post("/api/appointments/auto-assign", {
        "patient_id": p1_id,
        "appointment_date": tie_date,
        "appointment_time": "11:30",
        "reason": "Checkup"
    })
    check("System breaks tie deterministically by selecting lowest doctor ID (Dr. Priya, id=1)",
          res_sc4["doctor"]["id"] == 1 and res_sc4["appointments_today"] == 0)

    # ── SCENARIO 5: No doctors available returns 400 ────────────────
    print("\nAUTO TEST 5: No doctors available returns HTTP 400:")
    no_doc_err = False
    try:
        post("/api/appointments/auto-assign", {
            "patient_id": p1_id,
            "appointment_date": test_date,
            "appointment_time": "23:45",
            "reason": "Midnight query"
        })
    except urllib.error.HTTPError as e:
        if e.code == 400:
            err_body = json.loads(e.read())
            no_doc_err = "No doctors are available" in err_body.get("detail", "")
    check("Returns 400 Bad Request with 'No doctors are available' detail", no_doc_err)

    # ── SCENARIO 6: Doctor availability changes before confirmation ──
    print("\nAUTO TEST 6: Doctor becomes unavailable before user confirms (race condition):")
    # 1. User auto-assigns at 10:00 on tie_date (Dr. Priya id=1 assigned)
    sug_res = post("/api/appointments/auto-assign", {
        "patient_id": p1_id,
        "appointment_date": tie_date,
        "appointment_time": "10:00",
        "reason": "Flu"
    })
    chosen_id = sug_res["doctor"]["id"]

    # 2. In the meantime, another user books Dr. Priya at 10:00 on tie_date:
    interfering = track_post("/api/appointments/", {
        "patient_id": p2_id,
        "doctor_id": chosen_id,
        "appointment_date": tie_date,
        "appointment_time": "10:00",
        "reason": "Urgent consultation",
        "status": "Scheduled"
    })

    # 3. User now clicks Confirm Appointment with the auto-assigned doctor
    race_rejected = False
    race_detail = ""
    try:
        post("/api/appointments/", {
            "patient_id": p1_id,
            "doctor_id": chosen_id,
            "appointment_date": tie_date,
            "appointment_time": "10:00",
            "reason": "Flu",
            "status": "Scheduled"
        })
    except urllib.error.HTTPError as e:
        if e.code == 400:
            race_rejected = True
            race_detail = json.loads(e.read()).get("detail", "")

    check("Confirming appointment is rejected with HTTP 400 when doctor became unavailable", race_rejected)
    check("Rejection message names the doctor and mentions availability",
          sug_res["doctor"]["name"] in race_detail and "no longer available" in race_detail)

    # ── SCENARIO 7: Manual selection still works ─────────────────────
    print("\nAUTO TEST 7: Manual doctor selection still works:")
    manual_appt = track_post("/api/appointments/", {
        "patient_id": p2_id,
        "doctor_id": 2,  # Dr. Amit Patil manually chosen
        "appointment_date": tie_date,
        "appointment_time": "10:30",
        "reason": "Pediatric consultation",
        "status": "Scheduled"
    })
    check("Manual doctor selection successfully creates appointment",
          manual_appt["doctor_id"] == 2 and manual_appt["doctor_name"] is not None)

    # ── SCENARIO 8: Workload calculation accuracy (Scheduled vs Completed vs Cancelled) ──
    print("\nAUTO TEST 8: Workload calculation only counts Scheduled appointments:")
    workload_date = (next_monday + timedelta(days=35)).isoformat()
    # Create 1 Completed and 1 Cancelled appointment for Dr. Amit (id=2)
    c1 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 2, "appointment_date": workload_date,
        "appointment_time": "09:00", "reason": "Completed past", "status": "Completed"
    })
    c2 = track_post("/api/appointments/", {
        "patient_id": p2_id, "doctor_id": 2, "appointment_date": workload_date,
        "appointment_time": "09:30", "reason": "Cancelled slot", "status": "Cancelled"
    })
    # Check available doctors workload
    avail_check = get(f"/api/doctors/available?date={workload_date}&time=10:00")
    amit_item = next((d for d in avail_check["available_doctors"] if d["id"] == 2), None)
    check("Dr. Amit has 0 active appointments today despite Completed & Cancelled appointments",
          amit_item is not None and amit_item["appointments_today"] == 0)

    # Now add 1 Scheduled appointment for Dr. Amit
    s1 = track_post("/api/appointments/", {
        "patient_id": p1_id, "doctor_id": 2, "appointment_date": workload_date,
        "appointment_time": "12:00", "reason": "Active slot", "status": "Scheduled"
    })
    avail_check2 = get(f"/api/doctors/available?date={workload_date}&time=10:00")
    amit_item2 = next((d for d in avail_check2["available_doctors"] if d["id"] == 2), None)
    check("Dr. Amit has exactly 1 active appointment today after adding Scheduled appointment",
          amit_item2 is not None and amit_item2["appointments_today"] == 1)

    # ── SCENARIO 9: Full Auto-Assign -> Explicit Confirmation Workflow ──
    print("\nAUTO TEST 9: Full workflow (Auto-Assign -> Review -> Explicit Confirmation):")
    flow_date = (next_monday + timedelta(days=42)).isoformat()
    # 1. Step 1: Request Auto-Assignment
    assign_suggestion = post("/api/appointments/auto-assign", {
        "patient_id": p1_id,
        "appointment_date": flow_date,
        "appointment_time": "10:30",
        "reason": "Full checkup workflow"
    })
    check("Step 1 (Auto-Assign) returned suggested doctor", "doctor" in assign_suggestion)
    rec_doc_id = assign_suggestion["doctor"]["id"]

    # 2. Step 2: Explicit Confirmation (user clicks Confirm Appointment)
    confirmed_appt = track_post("/api/appointments/", {
        "patient_id": p1_id,
        "doctor_id": rec_doc_id,
        "appointment_date": flow_date,
        "appointment_time": "10:30",
        "reason": "Full checkup workflow",
        "status": "Scheduled"
    })
    check("Step 2 (Explicit Confirmation) creates Scheduled appointment",
          confirmed_appt["id"] is not None and confirmed_appt["status"] == "Scheduled")
    check("Confirmed appointment assigned to suggested doctor",
          confirmed_appt["doctor_id"] == rec_doc_id)

finally:
    # Clean up all created appointments
    print("\nCleaning up automated test appointments...")
    for aid in auto_test_appts:
        try:
            patch(f"/api/appointments/{aid}/status", {"status": "Cancelled"})
        except Exception:
            pass
    print("Cleanup completed.")

print(f"\n=== Test Results: {passed} passed, {failed} failed ===\n")
sys.exit(0 if failed == 0 else 1)

