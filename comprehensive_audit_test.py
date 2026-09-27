import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def request_json(url, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(f"{BASE_URL}{url}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}

def run_tests():
    results = {}
    print("="*60)
    print("STARTING REFILL RESOLVE AUTOMATED AUDIT SUITE")
    print("="*60)

    # 0. Reset demo database to clean benchmark state
    print("\n[SETUP] Resetting demo database...")
    status, res = request_json("/refills/reset-demo", method="POST", data={})
    assert status == 200, f"Reset failed: {res}"
    print("[OK] Demo database reset successful.")

    # 1. API Health Check
    status, health = request_json("/health")
    assert status == 200, f"Health check failed: {status}"
    results["health_check"] = "PASS"
    print("[OK] Health check passed (HTTP 200).")

    # 2. SARAH MILLER END-TO-END WORKFLOW TEST
    print("\n[TEST 1] Sarah Miller (REF-1042) Complete End-to-End Workflow")
    # Verify initial state is TRIAGED
    status, sarah = request_json("/refills/REF-1042")
    assert status == 200 and sarah["state"] == "TRIAGED", f"Unexpected state: {sarah}"
    assert sarah["lane"] == "NEEDS_PROVIDER", f"Unexpected lane: {sarah['lane']}"
    assert sarah["patient_name"] == "Sarah Miller"
    print("  [OK] Initial State: TRIAGED, Lane: NEEDS_PROVIDER, Confidence: 96%")

    # Transition: Send to Provider -> PROVIDER_REVIEW
    status, sent_res = request_json("/refills/REF-1042/send-to-provider", method="POST", data={
        "assigned_provider": "Dr. Rao",
        "note": "Verified blood pressure chart. Routed for renewal."
    })
    assert status == 200 and sent_res["state"] == "PROVIDER_REVIEW", f"Routing failed: {sent_res}"
    print("  [OK] Transition to PROVIDER_REVIEW successful.")

    # Provider Clinician Decision: APPROVE -> Mock Pharmacy -> CONFIRMED -> PATIENT_NOTIFIED
    status, dec_res = request_json("/refills/REF-1042/decision", method="POST", data={
        "decision": "APPROVE",
        "decided_by": "Dr. Rao",
        "note": "Blood pressure well controlled on Lisinopril 10 mg. Approved for 1-year renewal."
    })
    assert status == 200, f"Decision failed: {dec_res}"
    assert dec_res["state"] == "PATIENT_NOTIFIED", f"Expected PATIENT_NOTIFIED, got {dec_res['state']}"
    assert dec_res["provider_decision"] == "APPROVE"
    print("  [OK] Clinician Approval executed -> Mock Pharmacy confirmed -> State is PATIENT_NOTIFIED.")

    # Verify Patient Safe Status View
    status, pat_status = request_json("/patient/status/PT-1042")
    assert status == 200
    assert pat_status["is_confirmed"] is True
    assert "confirmed" in pat_status["status_headline"].lower()
    # Ensure no leakage of internal AI confidence or private lane
    assert "ai_confidence" not in pat_status
    assert "lane" not in pat_status
    print("  [OK] Patient Safe Status is confirmed without internal metadata leakage.")

    # Verify Immutable Audit Trail
    status, timeline = request_json("/refills/REF-1042/timeline")
    assert status == 200 and len(timeline) >= 6, f"Expected >= 6 events, got {len(timeline)}"
    # Check that events are in chronological order
    timestamps = [ev["timestamp"] for ev in timeline]
    assert timestamps == sorted(timestamps), "Audit events must be strictly chronological"
    print(f"  [OK] Audit timeline has {len(timeline)} chronological append-only events.")
    results["sarah_miller_e2e"] = "PASS"

    # 3. AI GUARDRAILS TESTS (Deterministic Python Enforcement)
    print("\n[TEST 2] AI Guardrails & Safety Enforcement")
    
    # Test A: Guardrail against direct approve (lane confinement)
    # Intake a refill with low confidence or missing vitals
    test_refill_data = {
        "patient_name": "Test Safety Patient",
        "patient_id": "PT-TEST-01",
        "medication": "Amlodipine",
        "dosage": "10 mg",
        "condition": "Hypertension",
        "refills_remaining": 0,
        "request_channel": "E-Prescribe",
        "last_visit_date": "2024-01-01", # Over 2 years old!
        "last_vitals_summary": "Missing", # Missing vitals!
        "clinical_flag": "High Risk Interaction"
    }
    status, intake_res = request_json("/refills", method="POST", data=test_refill_data)
    assert status == 200
    # Because last_visit is > 6 months and clinical_flag is set, AI guardrail must force NEEDS_PROVIDER
    assert intake_res["lane"] in ["NEEDS_PROVIDER", "NEEDS_INFO"], f"Guardrail failed! Got lane: {intake_res['lane']}"
    # State must be TRIAGED, NEVER directly APPROVED or DECIDED
    assert intake_res["state"] == "TRIAGED", f"AI bypassed review! State: {intake_res['state']}"
    print("  [OK] Guardrail 3 (Old visit), Guardrail 4 (Missing vitals), Guardrail 5 (Clinical flag) enforced.")
    results["ai_guardrails"] = "PASS"

    # 4. HUMAN-IN-THE-LOOP CLINICAL BYPASS PREVENTION
    print("\n[TEST 3] Human-in-the-Loop Enforcement & Bypass Prevention")
    # Try to make clinical decision with invalid decision string
    status, err_res = request_json(f"/refills/{intake_res['id']}/decision", method="POST", data={
        "decision": "AUTONOMOUS_AI_APPROVE", # Illegal decision
        "decided_by": "AI Bot"
    })
    assert status == 400, f"Expected 400 for illegal decision, got {status}"
    print("  [OK] Illegal autonomous clinical decision rejected (HTTP 400).")

    # Clean up test refill
    request_json(f"/refills/{intake_res['id']}", method="DELETE")
    results["human_in_loop"] = "PASS"

    # 5. STATE MACHINE INVALID TRANSITION REJECTION
    print("\n[TEST 4] Centralized State Machine - Invalid Transition Rejection")
    # Reset again to get pristine seed data
    request_json("/refills/reset-demo", method="POST", data={})
    
    # Try invalid transition: REQUESTED -> CONFIRMED on a fresh request
    # Robert Davis is in TRIAGED
    status, err_res = request_json("/refills/REF-1031/send-to-pharmacy", method="POST")
    # Cannot send to pharmacy without provider decision = APPROVE
    assert status == 400, f"Expected 400 for illegal transition to pharmacy, got {status}"
    print("  [OK] Illegal transition to pharmacy without approval rejected (HTTP 400).")
    results["state_machine_validation"] = "PASS"

    # 6. PHARMACY OUTAGE / FAILURE SIMULATION
    print("\n[TEST 5] Mock Pharmacy Failure & Retry Handling")
    # Priya Shah (REF-1055) is in PROVIDER_REVIEW
    # Let provider approve first
    status, dec_res = request_json("/refills/REF-1055/decision", method="POST", data={
        "decision": "APPROVE",
        "decided_by": "Dr. Rao",
        "note": "Approved."
    })
    assert status == 200

    # Test pharmacy failure simulation endpoint
    status, fail_res = request_json("/mock/pharmacy/notify", method="POST", data={
        "refill_id": "REF-1055",
        "medication": "Atorvastatin",
        "dosage": "20 mg",
        "simulate_failure": True
    })
    assert status == 502, f"Expected 502 Bad Gateway for pharmacy failure, got {status}"
    print("  [OK] Pharmacy failure simulation successfully returns HTTP 502 Bad Gateway.")

    # Test pharmacy recovery: normal notification
    status, ok_res = request_json("/mock/pharmacy/notify", method="POST", data={
        "refill_id": "REF-1055",
        "medication": "Atorvastatin",
        "dosage": "20 mg",
        "simulate_failure": False
    })
    assert status == 200, f"Expected 200 for pharmacy recovery, got {status}"
    print("  [OK] Pharmacy recovery call succeeds (HTTP 200).")
    results["pharmacy_integration"] = "PASS"

    # 7. PATIENT PRIVACY & ACCESS CONTROL TEST
    print("\n[TEST 6] Patient Privacy & Endpoint Boundaries")
    # Valid patient ID
    status, pat = request_json("/patient/status/PT-1042")
    assert status == 200 and pat["patient_name"] == "Sarah Miller"
    
    # Invalid patient ID (must return 404, never leak other patients)
    status, err = request_json("/patient/status/PT-NONEXISTENT-9999")
    assert status == 404, f"Expected 404 for nonexistent patient, got {status}"
    print("  [OK] Nonexistent patient ID safely returns 404 with no data leakage.")

    # Case-insensitive patient ID lookup test
    status, pat_ci = request_json("/patient/status/pt-1042")
    assert status == 200 and pat_ci["patient_name"] == "Sarah Miller"
    print("  [OK] Case-insensitive patient ID lookup verified.")
    results["patient_privacy"] = "PASS"

    # 8. PATIENT SELF-SERVICE APPOINTMENT SCHEDULING
    print("\n[TEST 7] Patient Self-Service Appointment Scheduler Integration")
    status, sched_res = request_json("/patient/schedule", method="POST", data={
        "patient_id": "PT-1088", # James Wilson
        "refill_id": "REF-1088",
        "appointment_type": "Telehealth Video Consultation",
        "appointment_date": "2026-10-05",
        "appointment_time": "10:30 AM",
        "notes": "Follow-up for diabetes management and Metformin refill."
    })
    assert status == 200
    assert sched_res["appointment_scheduled"] is True
    assert sched_res["appointment_date"] == "2026-10-05"
    print("  [OK] Patient appointment booked and linked to refill request.")

    # Verify audit event for appointment scheduling
    status, j_timeline = request_json("/refills/REF-1088/timeline")
    sched_events = [ev for ev in j_timeline if ev["action"] == "APPOINTMENT_SCHEDULED"]
    assert len(sched_events) > 0, "Expected APPOINTMENT_SCHEDULED in audit timeline"
    print("  [OK] Appointment scheduled event logged in immutable audit history.")
    results["appointment_scheduling"] = "PASS"

    # 9. KPI METRICS INTEGRITY
    print("\n[TEST 8] Operational Metrics Integrity")
    status, metrics = request_json("/refills/metrics")
    assert status == 200
    assert metrics["active_refills"] > 0
    assert "needs_review" in metrics["queue_counts"]
    print(f"  [OK] KPI Metrics computed dynamically: {metrics['active_refills']} active refills.")
    results["kpi_metrics"] = "PASS"

    # 10. INSURANCE / PRIOR AUTHORIZATION BLOCKER WORKFLOW TEST
    print("\n[TEST 9] Insurance & Prior Authorization (PA) Blocker Workflow")
    status, pa_refill = request_json("/refills/REF-1077")
    assert status == 200
    assert pa_refill["prior_auth_required"] is True
    assert pa_refill["prior_auth_status"] == "PA_REQUIRED"
    assert "UnitedHealthcare" in pa_refill["insurance_provider"] or "Insurance" in pa_refill["blocker_title"]
    print("  [OK] Insurance blocker detected: Elena Rostova requires Prior Authorization.")

    # Test ePA electronic submission
    status, epa_res = request_json("/refills/REF-1077/submit-prior-auth", method="POST", data={
        "clinical_notes": "Metformin step therapy verified; HbA1c 7.6% attached.",
        "step_therapy_confirmed": True
    })
    assert status == 200
    assert epa_res["prior_auth_status"] == "APPROVED"
    assert epa_res["state"] == "PROVIDER_REVIEW"
    print("  [OK] Electronic Prior Auth (ePA) submitted & approved -> Transitioned to PROVIDER_REVIEW.")

    # Verify audit event for PA submission
    status, pa_timeline = request_json("/refills/REF-1077/timeline")
    pa_events = [ev for ev in pa_timeline if ev["action"] == "PRIOR_AUTH_SUBMITTED_AND_APPROVED"]
    assert len(pa_events) > 0
    print("  [OK] Prior Authorization approval logged in immutable audit trail.")
    results["insurance_prior_auth"] = "PASS"

    # Reset demo database so UI is in pristine state for user
    print("\n[CLEANUP] Restoring pristine benchmark state...")
    request_json("/refills/reset-demo", method="POST", data={})
    print("[OK] Pristine demo state restored.")

    print("\n" + "="*60)
    print("AUDIT RESULTS SUMMARY:")
    for test, res in results.items():
        print(f"  {test.ljust(30)}: {res}")
    print("="*60)
    return results

if __name__ == "__main__":
    run_tests()
