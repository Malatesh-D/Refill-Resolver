import requests
import json

BASE = "http://127.0.0.1:8000"

def test_full_system():
    print("--- 1. Testing System Health ---")
    r = requests.get(f"{BASE}/health")
    assert r.status_code == 200
    print("[PASS] /health operational:", r.json()["services"])

    print("\n--- 2. Testing Operations Dashboard Metrics ---")
    r = requests.get(f"{BASE}/refills/metrics")
    assert r.status_code == 200
    metrics = r.json()
    assert metrics["active_refills"] > 0
    print("[PASS] /refills/metrics:", metrics)

    print("\n--- 3. Testing Refills List ---")
    r = requests.get(f"{BASE}/refills")
    assert r.status_code == 200
    refills = r.json()
    print(f"[PASS] /refills returned {len(refills)} records")

    print("\n--- 4. Primary Demo Flow: Sarah Miller (REF-1042) ---")
    r = requests.get(f"{BASE}/refills/REF-1042")
    assert r.status_code == 200
    sarah = r.json()
    assert sarah["patient_name"] == "Sarah Miller"
    assert sarah["state"] == "TRIAGED"
    print(f"[PASS] Sarah Miller initial state: {sarah['state']}, Lane: {sarah['lane']}, Blocker: {sarah['blocker_title']}")

    # Step: Send to provider
    print("   -> Routing Sarah Miller to Dr. Rao...")
    r = requests.post(f"{BASE}/refills/REF-1042/send-to-provider", json={
        "assigned_provider": "Dr. Rao",
        "note": "Sarah Miller Lisinopril refill routed to Dr. Rao."
    })
    assert r.status_code == 200
    sarah_routed = r.json()
    assert sarah_routed["state"] == "PROVIDER_REVIEW"
    print(f"[PASS] State transitioned: {sarah_routed['state']}")

    # Step: Provider reviews and confirms approval
    print("   -> Dr. Rao recording APPROVE decision...")
    r = requests.post(f"{BASE}/refills/REF-1042/decision", json={
        "decision": "APPROVE",
        "decided_by": "Dr. Rao",
        "note": "Clinical approval for 90-day maintenance supply."
    })
    assert r.status_code == 200
    sarah_decided = r.json()
    assert sarah_decided["provider_decision"] == "APPROVE"
    assert sarah_decided["state"] == "PATIENT_NOTIFIED"
    print(f"[PASS] Provider decision recorded and full loop closed: State is {sarah_decided['state']}")

    # Step: Verify timeline updated with all events
    print("   -> Fetching immutable audit timeline...")
    r = requests.get(f"{BASE}/refills/REF-1042/timeline")
    assert r.status_code == 200
    timeline = r.json()
    print(f"[PASS] Audit timeline has {len(timeline)} events recorded")
    for ev in timeline:
        print(f"      * [{ev['actor']}] -> {ev['action']}: {ev['detail']}")

    # Step: Verify patient safe view
    print("   -> Testing Patient Safe Status Endpoint for PT-1042...")
    r = requests.get(f"{BASE}/patient/status/PT-1042")
    assert r.status_code == 200
    patient_status = r.json()
    assert patient_status["is_confirmed"] is True
    assert "confirmed" in patient_status["status_headline"].lower()
    # Confirm private context is NOT in response
    assert "ai_confidence" not in patient_status
    assert "lane" not in patient_status
    assert "internal_notes" not in patient_status
    print(f"[PASS] Patient portal status: '{patient_status['status_headline']}' (Safe: AI confidence shielded)")

    print("\n--- 5. Testing Mock Pharmacy Notification & Failure Handling ---")
    # Test pharmacy simulated failure & retry
    r = requests.post(f"{BASE}/mock/pharmacy/notify", json={
        "refill_id": "REF-1042",
        "patient_name": "Sarah Miller",
        "medication": "Lisinopril",
        "dosage": "10 mg",
        "provider_name": "Dr. Rao",
        "simulate_failure": True
    })
    assert r.status_code == 502
    print("[PASS] Pharmacy simulated failure caught properly (502 Bad Gateway)")

    print("\n--- 6. Testing AI Guardrail Enforcement ---")
    # Test AI triage on new refill with missing vitals -> Guardrail 4 -> NEEDS_INFO
    r = requests.post(f"{BASE}/refills", json={
        "patient_name": "Test Guardrail Patient",
        "patient_id": "PT-9999",
        "medication": "Metformin",
        "dosage": "500 mg",
        "condition": "Diabetes",
        "last_visit_date": "2026-05-01",
        "last_vitals_summary": "Missing",
        "refills_remaining": 0,
        "request_channel": "E-Prescribe",
        "assigned_provider": "Dr. Rao"
    })
    assert r.status_code == 200
    new_refill = r.json()
    assert new_refill["lane"] == "NEEDS_INFO"
    print(f"[PASS] Guardrail 4 (Missing Vitals) verified: Lane forced to {new_refill['lane']}")

    # Clean reset back to demo initial state
    print("\n--- 7. Resetting Database to Clean Initial Demo State ---")
    from seed import seed_database
    seed_database()
    print("[PASS] Database seeded back to initial clean demo state")

    print("\n==========================================")
    print("ALL API & WORKFLOW VALIDATION TESTS PASSED")
    print("==========================================")

if __name__ == "__main__":
    test_full_system()
