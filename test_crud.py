import urllib.request
import json

# 1. Health check
res = urllib.request.urlopen('http://127.0.0.1:8000/health')
print('Health check:', res.status)

# 2. Refills list
res = urllib.request.urlopen('http://127.0.0.1:8000/refills')
data = json.loads(res.read().decode())
print(f'Initial Refills Count: {len(data)}')

# 3. Create a test patient refill (POST /refills)
new_patient = {
    'patient_name': 'Eleanor Vance',
    'patient_id': 'PT-9988',
    'medication': 'Levothyroxine',
    'dosage': '50 mcg',
    'condition': 'Hypothyroidism',
    'refills_remaining': 0,
    'request_channel': 'PATIENT_PORTAL',
    'last_visit_date': '2025-08-10',
    'last_vitals_summary': 'BP 118/76, HR 70',
    'assigned_provider': 'Dr. Rao',
    'pharmacy_name': 'CVS Pharmacy #1042',
    'pharmacy_phone': '(555) 432-1098'
}
req = urllib.request.Request(
    'http://127.0.0.1:8000/refills',
    data=json.dumps(new_patient).encode(),
    headers={'Content-Type': 'application/json'}
)
created = json.loads(urllib.request.urlopen(req).read().decode())
created_id = created['id']
print(f"Created Patient: {created['patient_name']} (ID: {created_id}, Lane: {created['lane']})")

# 4. Update the patient record (PUT /refills/{id})
update_payload = {
    'last_vitals_summary': 'BP 120/78, TSH 2.1 (Normal)',
    'dosage': '75 mcg',
    'retrigger_ai': True
}
req = urllib.request.Request(
    f"http://127.0.0.1:8000/refills/{created_id}",
    data=json.dumps(update_payload).encode(),
    headers={'Content-Type': 'application/json'},
    method='PUT'
)
updated = json.loads(urllib.request.urlopen(req).read().decode())
print(f"Updated Patient Vitals: {updated['last_vitals_summary']}, Dosage: {updated['dosage']}")

# 5. Delete the test record (DELETE /refills/{id})
req = urllib.request.Request(f"http://127.0.0.1:8000/refills/{created_id}", method='DELETE')
res = urllib.request.urlopen(req)
print('Deleted Status:', res.status)

# 6. Verify refill count returns to 8
res = urllib.request.urlopen('http://127.0.0.1:8000/refills')
data = json.loads(res.read().decode())
print(f'Verified Refills Count: {len(data)}')
