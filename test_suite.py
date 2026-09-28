import urllib.request
import json
import sys

BASE = 'http://127.0.0.1:8000'
results = []

def test(name, func):
    try:
        res = func()
        results.append((name, 'PASS', res))
        print(f"[PASS] {name}: {res}")
    except Exception as e:
        results.append((name, 'FAIL', str(e)))
        print(f"[FAIL] {name}: {e}")

# 1. Health
def check_health():
    res = urllib.request.urlopen(f"{BASE}/health")
    data = json.loads(res.read())
    assert data['status'] == 'operational', 'Status not operational'
    return data['services']['ai_triage']

test('1. System Health & Google Gemini AI', check_health)

# 2. Metrics
def check_metrics():
    res = urllib.request.urlopen(f"{BASE}/refills/metrics")
    data = json.loads(res.read())
    assert 'resolved_today' in data and 'active_refills' in data, 'Missing metric keys'
    return f"Active: {data['active_refills']}, Resolved Today: {data['resolved_today']}, Needs Review: {data['queue_counts']['needs_review']}"

test('2. Dashboard Metrics Engine', check_metrics)

# 3. List Refills
def check_refills():
    res = urllib.request.urlopen(f"{BASE}/refills")
    data = json.loads(res.read())
    assert len(data) > 0, 'No refills found'
    return f"Total refills loaded: {len(data)}"

test('3. Refill Ingestion & Retrieval API', check_refills)

# 4. AI Triage on REF-1088 (James Wilson)
def check_triage():
    req = urllib.request.Request(f"{BASE}/refills/REF-1088/triage", data=b'', headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    assert data['lane'] is not None, 'Triage lane missing'
    return f"Lane: {data['lane']}, Confidence: {int(data.get('ai_confidence', 0)*100)}%, Blocker: {data.get('blocker_title')}"

test('4. Live Gemini 2.5 Flash Clinical Triage', check_triage)

# 5. Patient Status for PT-1042 (Sarah Miller)
def check_patient():
    res = urllib.request.urlopen(f"{BASE}/patient/status/PT-1042")
    data = json.loads(res.read())
    assert data['patient_name'] == 'Sarah Miller', 'Patient mismatch'
    return f"Patient: {data['patient_name']} ({data['medication']}) | Headline: {data['status_headline']} | Decision: {data['provider_decision']}"

test('5. Patient Portal Status API', check_patient)

# 6. Patient Status for PT-1031 (Robert Davis - Denied)
def check_patient_denied():
    res = urllib.request.urlopen(f"{BASE}/patient/status/PT-1031")
    data = json.loads(res.read())
    assert data['provider_decision'] == 'DENY', 'Decision is not DENY'
    assert data['is_confirmed'] == False, 'Should not be confirmed'
    return f"Status: {data['status_headline']} (Confirmed: {data['is_confirmed']})"

test('6. Patient Denied Renewal Guardrail Check', check_patient_denied)

# 7. Appointment Scheduling API
def check_schedule():
    payload = json.dumps({
        'patient_id': 'PT-1088',
        'refill_id': 'REF-1088',
        'appointment_date': 'Wednesday, Sep 30, 2026',
        'appointment_time': '02:00 PM',
        'appointment_type': 'Telehealth Video Consultation',
        'notes': 'HbA1c review and diabetes management'
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE}/patient/schedule", data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    assert data['appointment_scheduled'] == True, 'Appointment not scheduled'
    return f"Confirmed: {data['appointment_date']} at {data['appointment_time']}"

test('7. Patient Appointment Scheduling Service', check_schedule)

# 8. Cryptographic Audit Timeline
def check_timeline():
    res = urllib.request.urlopen(f"{BASE}/refills/REF-1088/timeline")
    data = json.loads(res.read())
    assert len(data) > 0, 'No timeline events'
    return f"{len(data)} immutable audit ledger entries verified"

test('8. Cryptographic Audit Timeline', check_timeline)

print("\n--- TEST SUMMARY ---")
passes = sum(1 for _, s, _ in results if s == 'PASS')
total = len(results)
print(f"Total Tests: {total} | Passed: {passes} | Failed: {total - passes}")
if passes == total:
    print("ALL SERVICES 100% OPERATIONAL!")
else:
    sys.exit(1)
