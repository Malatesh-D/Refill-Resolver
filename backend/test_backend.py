import asyncio
from fastapi.testclient import TestClient
from main import app
from seed import seed_database

def run_tests():
    # Fresh seed
    seed_database()
    client = TestClient(app)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print("[PASS] Health check OK:", health_data["services"])

    # 2. Get metrics
    res = client.get("/refills/metrics")
    assert res.status_code == 200
    metrics = res.json()
    print("[PASS] Metrics OK:", metrics)

    # 3. List refills
    res = client.get("/refills")
    assert res.status_code == 200
    refills = res.json()
    assert len(refills) >= 8, f"Expected at least 8 refills, got {len(refills)}"
    print(f"[PASS] Listed {len(refills)} refills OK")

    # 4. Sarah Miller initial state
    res = client.get("/refills/REF-1042")
    assert res.status_code == 200
    sarah = res.json()
    assert sarah["patient_name"] == "Sarah Miller"
    assert sarah["state"] == "TRIAGED"
    assert sarah["lane"] == "NEEDS_PROVIDER"
    print("[PASS] Sarah Miller initial state verified OK")

    # 5. Route Sarah Miller to provider: TRIAGED -> PROVIDER_REVIEW
    res = client.post("/refills/REF-1042/send-to-provider", json={
        "assigned_provider": "Dr. Rao",
        "note": "Routing Sarah Miller to Dr. Rao for Lisinopril authorization."
    })
    assert res.status_code == 200
    sarah_routed = res.json()
    assert sarah_routed["state"] == "PROVIDER_REVIEW"
    print("[PASS] Sarah Miller routed to provider OK (state: PROVIDER_REVIEW)")

    # 6. Provider decision: PROVIDER_REVIEW -> DECIDED -> SENT_TO_PHARMACY -> CONFIRMED -> PATIENT_NOTIFIED
    res = client.post("/refills/REF-1042/decision", json={
        "decision": "APPROVE",
        "decided_by": "Dr. Rao",
        "note": "Approved 90-day refill. Blood pressure is well controlled."
    })
    assert res.status_code == 200
    sarah_decided = res.json()
    assert sarah_decided["provider_decision"] == "APPROVE"
    assert sarah_decided["state"] == "PATIENT_NOTIFIED"
    print("[PASS] Sarah Miller approved & automated loop completed OK (state: PATIENT_NOTIFIED)")

    # 7. Audit timeline check
    res = client.get("/refills/REF-1042/timeline")
    assert res.status_code == 200
    timeline = res.json()
    assert len(timeline) >= 6, f"Expected at least 6 audit events, got {len(timeline)}"
    print(f"[PASS] Audit timeline OK: {len(timeline)} events recorded")
    for ev in timeline:
        print(f"   [{ev['timestamp'][:19]}] {ev['actor']}: {ev['action']} ({ev['from_state']} -> {ev['to_state']})")

    # 8. Patient status check
    res = client.get("/patient/status/PT-1042")
    assert res.status_code == 200
    pat_status = res.json()
    assert pat_status["is_confirmed"] is True
    assert "confirmed" in pat_status["status_headline"].lower()
    print("[PASS] Patient status endpoint OK:", pat_status["status_headline"])

    # 9. Invalid transition guardrail check
    from database import SessionLocal
    from models.refill import RefillRequest
    from services.workflow_service import transition_refill
    from fastapi import HTTPException
    
    db = SessionLocal()
    refill_james = db.query(RefillRequest).filter(RefillRequest.id == "REF-1088").first() # in INFO_GATHERING
    try:
        transition_refill(db, refill_james, "CONFIRMED", actor="Hacker", action="BYPASS")
        assert False, "Should have failed invalid transition!"
    except HTTPException as e:
        assert e.status_code == 400
        print("[PASS] Guardrail OK: Invalid workflow transition successfully rejected with 400")
    finally:
        db.close()

    # Re-seed back to initial state for demo
    seed_database()
    print("\n>>> ALL BACKEND ACCEPTANCE TESTS PASSED! Database reset to clean demo state.")

if __name__ == "__main__":
    run_tests()
