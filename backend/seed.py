import json
from datetime import datetime, timezone, timedelta
from database import SessionLocal, engine, Base
from models.refill import RefillRequest
from models.audit_event import AuditEvent

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    now = datetime.now(timezone.utc)
    t_minus = lambda mins: now - timedelta(minutes=mins)

    seeds = [
        {
            "id": "REF-1042",
            "patient_name": "Sarah Miller",
            "patient_id": "PT-1042",
            "medication": "Lisinopril",
            "dosage": "10 mg",
            "condition": "Hypertension",
            "last_visit_date": "May 14, 2026",
            "last_vitals_summary": "BP 128/82, HR 72",
            "refills_remaining": 0,
            "request_channel": "E-Prescribe",
            "state": "TRIAGED",
            "lane": "NEEDS_PROVIDER",
            "ai_confidence": 0.96,
            "ai_reasoning": json.dumps([
                "No refills remain on active prescription.",
                "Provider authorization is required before the pharmacy can dispense the medication.",
                "Patient is on a stable dosage with recent normal blood pressure (128/82 mmHg)."
            ]),
            "recommended_action": "Route to prescribing provider for authorization.",
            "draft_message": "Dr. Rao: Refill renewal for Sarah Miller (Lisinopril 10 mg). Zero refills remain; last BP is stable at 128/82 mmHg.",
            "blocker_title": "Provider Action Required",
            "blocker_description": "No refills remain on active prescription",
            "owner": "Dr. Rao",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "Walgreens Pharmacy #4120",
            "pharmacy_phone": "(555) 234-5678",
            "clinical_flag": None,
            "priority": "HIGH",
            "priority_reason": "Maintenance antihypertensive; 0 refills remaining; awaiting clinician authorization",
            "sla_status": "ON_TRACK",
            "sla_target_hours": 4,
            "is_stalled": False,
            "patient_sms_preview": "Hi Sarah, Dr. Rao is reviewing your Lisinopril refill request. Walgreens Pharmacy #4120 will be notified once authorized.",
            "created_at": t_minus(65),
            "updated_at": t_minus(60),
            "events": [
                ("E-Prescribe Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Inbound renewal request received from Walgreens Pharmacy #4120.", t_minus(65)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "Triaged to NEEDS_PROVIDER lane (96% confidence). Blocker: No refills remaining.", t_minus(60)),
            ]
        },
        {
            "id": "REF-1088",
            "patient_name": "James Wilson",
            "patient_id": "PT-1088",
            "medication": "Metformin",
            "dosage": "500 mg",
            "condition": "Type 2 Diabetes",
            "last_visit_date": "April 02, 2026",
            "last_vitals_summary": "BP 122/78, Weight 182 lbs",
            "refills_remaining": 0,
            "request_channel": "Pharmacy Fax",
            "state": "INFO_GATHERING",
            "lane": "NEEDS_INFO",
            "ai_confidence": 0.94,
            "ai_reasoning": json.dumps([
                "Refill request for maintenance diabetic medication.",
                "Required clinical protocol: HbA1c lab result missing within past 90 days.",
                "Patient communication recommended to obtain recent laboratory confirmation."
            ]),
            "missing_info_note": "Recent HbA1c lab within 90 days required per clinical diabetes protocol.",
            "recommended_action": "Request updated chart vitals and lab results from patient or lab portal.",
            "draft_message": "Hello James, before Dr. Rao can process your Metformin refill, we need confirmation of your recent HbA1c test.",
            "blocker_title": "Missing Clinical Information",
            "blocker_description": "Recent HbA1c lab test within 90 days required per clinical protocol",
            "owner": "Practice Staff",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "CVS Pharmacy #8821",
            "pharmacy_phone": "(555) 345-6789",
            "clinical_flag": "Missing Required Lab (HbA1c)",
            "priority": "URGENT",
            "priority_reason": "Stalled request: Awaiting patient lab confirmation for 28+ hours; SLA breached",
            "sla_status": "BREACHED",
            "sla_target_hours": 24,
            "is_stalled": True,
            "stalled_reason": "Awaiting patient HbA1c confirmation from Quest; 28h elapsed without patient response",
            "patient_sms_preview": "Hi James, we still need your recent HbA1c test confirmation before Dr. Rao can refill Metformin. Please reply or tap link to upload.",
            "created_at": t_minus(1680),
            "updated_at": t_minus(120),
            "events": [
                ("Pharmacy Fax Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Refill request faxed from CVS Pharmacy #8821.", t_minus(180)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "Identified missing HbA1c lab protocol check (94% confidence).", t_minus(175)),
                ("Practice Staff", "INFO_REQUESTED", "TRIAGED", "INFO_GATHERING", "Requested HbA1c lab order from Quest Diagnostics; patient notified via SMS.", t_minus(120))
            ]
        },
        {
            "id": "REF-1055",
            "patient_name": "Priya Shah",
            "patient_id": "PT-1055",
            "medication": "Atorvastatin",
            "dosage": "20 mg",
            "condition": "Hyperlipidemia",
            "last_visit_date": "June 11, 2026",
            "last_vitals_summary": "BP 118/74, Lipid panel in range",
            "refills_remaining": 0,
            "request_channel": "Patient Portal",
            "state": "PROVIDER_REVIEW",
            "lane": "NEEDS_PROVIDER",
            "ai_confidence": 0.95,
            "ai_reasoning": json.dumps([
                "Zero refills remaining on maintenance statin.",
                "Recent comprehensive metabolic & lipid panels are within normal therapeutic targets.",
                "Ready for provider clinical renewal determination."
            ]),
            "recommended_action": "Route to Dr. Rao for prescription authorization.",
            "draft_message": "Dr. Rao: Refill request for Priya Shah (Atorvastatin 20 mg). Stable lipid panel on file.",
            "blocker_title": "Provider Authorization Pending",
            "blocker_description": "Awaiting clinical review and prescription sign-off",
            "owner": "Dr. Rao",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "Rite Aid #3104",
            "pharmacy_phone": "(555) 456-7890",
            "clinical_flag": None,
            "created_at": t_minus(140),
            "updated_at": t_minus(90),
            "events": [
                ("Patient Portal", "REQUEST_RECEIVED", None, "REQUESTED", "Inbound request submitted via MyChart patient portal.", t_minus(140)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "Classified into NEEDS_PROVIDER lane (95% confidence).", t_minus(138)),
                ("Practice Staff", "ROUTED_TO_PROVIDER", "TRIAGED", "PROVIDER_REVIEW", "Practice staff routed request to Dr. Rao queue.", t_minus(90))
            ]
        },
        {
            "id": "REF-1031",
            "patient_name": "Robert Davis",
            "patient_id": "PT-1031",
            "medication": "Levothyroxine",
            "dosage": "50 mcg",
            "condition": "Hypothyroidism",
            "last_visit_date": "August 28, 2026",
            "last_vitals_summary": "BP 120/80, TSH 1.8 mIU/L (Normal)",
            "refills_remaining": 0,
            "request_channel": "E-Prescribe",
            "state": "TRIAGED",
            "lane": "AUTO_CLEAR",
            "ai_confidence": 0.98,
            "ai_reasoning": json.dumps([
                "Stable maintenance thyroid therapy unchanged for 3+ years.",
                "Recent clinic visit 30 days ago with confirmed normal TSH level (1.8 mIU/L).",
                "Qualified for expedited 1-click provider clearance (satisfies Guardrail 6)."
            ]),
            "recommended_action": "Stage for expedited 1-click provider authorization.",
            "draft_message": "Dr. Rao: Expedited candidate — Robert Davis (Levothyroxine 50 mcg). Recent normal TSH on file.",
            "blocker_title": "Expedited Provider Authorization",
            "blocker_description": "Stable chronic medication; eligible for 1-click provider review",
            "owner": "Dr. Rao",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "Walgreens Pharmacy #4120",
            "pharmacy_phone": "(555) 234-5678",
            "clinical_flag": None,
            "created_at": t_minus(50),
            "updated_at": t_minus(45),
            "events": [
                ("E-Prescribe Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Inbound refill request from Walgreens Pharmacy #4120.", t_minus(50)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "AI classified as AUTO_CLEAR candidate (98% confidence). Staged for clinician 1-click sign-off.", t_minus(45))
            ]
        },
        {
            "id": "REF-1092",
            "patient_name": "Emily Brown",
            "patient_id": "PT-1092",
            "medication": "Amlodipine",
            "dosage": "5 mg",
            "condition": "Hypertension",
            "last_visit_date": "January 15, 2026",
            "last_vitals_summary": "BP 136/88, HR 78",
            "refills_remaining": 0,
            "request_channel": "E-Prescribe",
            "state": "TRIAGED",
            "lane": "NEEDS_PROVIDER",
            "ai_confidence": 0.92,
            "ai_reasoning": json.dumps([
                "No refills remain on active prescription.",
                "GUARDRAIL 3 TRIGGERED: Last documented clinical visit was 8 months ago (>6 months threshold).",
                "Provider authorization required; provider may elect to require an in-person or telehealth visit."
            ]),
            "recommended_action": "Route to Dr. Rao with stale visit alert for clinical determination.",
            "draft_message": "Dr. Rao: Emily Brown refill request. Patient has not had an in-person visit in 8 months. Consider visit requirement.",
            "blocker_title": "Provider Action Required (Visit > 6 mo)",
            "blocker_description": "Last clinical visit exceeds 6-month safety guideline",
            "owner": "Dr. Rao",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "Kroger Pharmacy #118",
            "pharmacy_phone": "(555) 567-8901",
            "clinical_flag": "Stale Visit (>6 Months)",
            "created_at": t_minus(85),
            "updated_at": t_minus(80),
            "events": [
                ("E-Prescribe Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Electronic renewal request received from Kroger Pharmacy #118.", t_minus(85)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "AI Guardrail 3 enforced: Visit > 6 months. Escalated to provider queue.", t_minus(80))
            ]
        },
        {
            "id": "REF-1074",
            "patient_name": "Daniel Lee",
            "patient_id": "PT-1074",
            "medication": "Metformin",
            "dosage": "500 mg",
            "condition": "Type 2 Diabetes",
            "last_visit_date": "March 10, 2026",
            "last_vitals_summary": "Missing",
            "refills_remaining": 0,
            "request_channel": "Pharmacy Fax",
            "state": "INFO_GATHERING",
            "lane": "NEEDS_INFO",
            "ai_confidence": 0.93,
            "ai_reasoning": json.dumps([
                "Refill requested for Metformin 500 mg.",
                "GUARDRAIL 4 TRIGGERED: Required vital signs context is completely missing from chart.",
                "Practice staff action required: Contact patient for home blood glucose log and recent blood pressure."
            ]),
            "missing_info_note": "No recorded vitals found in electronic chart for past 6 months.",
            "recommended_action": "Contact patient to capture recent home readings before provider review.",
            "draft_message": "Hello Daniel, please provide your recent blood pressure and glucose readings to help Dr. Rao review your refill.",
            "blocker_title": "Missing Vitals Context",
            "blocker_description": "Essential clinical vitals missing from electronic chart",
            "owner": "Practice Staff",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "Costco Pharmacy #482",
            "pharmacy_phone": "(555) 678-9012",
            "clinical_flag": "Missing Vitals Context",
            "priority": "NORMAL",
            "priority_reason": "Missing recent blood pressure reading; patient outreach underway",
            "sla_status": "ON_TRACK",
            "sla_target_hours": 8,
            "is_stalled": False,
            "duplicate_warning": "Potential Duplicate: Inbound electronic request received via Costco #482 matching active chart PT-1074 within 24h.",
            "patient_sms_preview": "Hi Daniel, please log your recent blood pressure and glucose readings so Dr. Rao can process your Metformin refill.",
            "created_at": t_minus(210),
            "updated_at": t_minus(195),
            "events": [
                ("Pharmacy Fax Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Faxed refill authorization request received.", t_minus(210)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "Guardrail 4 enforced: Missing vitals. Routed to staff for info gathering.", t_minus(205)),
                ("Practice Staff", "INFO_REQUESTED", "TRIAGED", "INFO_GATHERING", "Outreach message queued to patient requesting home vitals.", t_minus(195))
            ]
        },
        {
            "id": "REF-1019",
            "patient_name": "Maria Garcia",
            "patient_id": "PT-1019",
            "medication": "Losartan",
            "dosage": "50 mg",
            "condition": "Hypertension",
            "last_visit_date": "May 20, 2026",
            "last_vitals_summary": "BP 124/80, HR 68",
            "refills_remaining": 0,
            "request_channel": "E-Prescribe",
            "state": "PATIENT_NOTIFIED",
            "lane": "NEEDS_PROVIDER",
            "ai_confidence": 0.97,
            "ai_reasoning": json.dumps([
                "No refills remaining on active blood pressure maintenance.",
                "Provider authorization required and completed.",
                "Pharmacy confirmed dispense order."
            ]),
            "recommended_action": "Route to prescribing provider for authorization.",
            "draft_message": "Prescription authorized and transmitted.",
            "provider_decision": "APPROVE",
            "decided_by": "Dr. Rao",
            "decided_at": t_minus(150),
            "blocker_title": "Resolved",
            "blocker_description": "Refill authorized, confirmed by pharmacy, and patient notified",
            "owner": "Completed",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "Walgreens Pharmacy #4120",
            "pharmacy_phone": "(555) 234-5678",
            "clinical_flag": None,
            "created_at": t_minus(240),
            "updated_at": t_minus(145),
            "events": [
                ("E-Prescribe Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Refill request received from Walgreens.", t_minus(240)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "Triaged to NEEDS_PROVIDER (97% confidence).", t_minus(235)),
                ("Practice Staff", "ROUTED_TO_PROVIDER", "TRIAGED", "PROVIDER_REVIEW", "Routed to Dr. Rao.", t_minus(200)),
                ("Dr. Rao (Clinician)", "PROVIDER_DECISION_APPROVE", "PROVIDER_REVIEW", "DECIDED", "Clinical decision: APPROVE. Refill authorized for 90-day supply.", t_minus(150)),
                ("Workflow Engine", "SENT_TO_PHARMACY", "DECIDED", "SENT_TO_PHARMACY", "NCPDP script transmitted to Walgreens #4120.", t_minus(149)),
                ("Mock Pharmacy", "PHARMACY_CONFIRMED", "SENT_TO_PHARMACY", "CONFIRMED", "Pharmacy acknowledged order. Assigned Rx #RX-101901.", t_minus(147)),
                ("Workflow Engine", "PATIENT_NOTIFIED", "CONFIRMED", "PATIENT_NOTIFIED", "Automated SMS notification sent to Maria Garcia: Refill confirmed.", t_minus(145))
            ]
        },
        {
            "id": "REF-1008",
            "patient_name": "John Smith",
            "patient_id": "PT-1008",
            "medication": "Simvastatin",
            "dosage": "20 mg",
            "condition": "Hyperlipidemia",
            "last_visit_date": "June 05, 2026",
            "last_vitals_summary": "BP 126/82, Lipids normal",
            "refills_remaining": 0,
            "request_channel": "E-Prescribe",
            "state": "PATIENT_NOTIFIED",
            "lane": "NEEDS_PROVIDER",
            "ai_confidence": 0.96,
            "ai_reasoning": json.dumps([
                "Zero refills remaining on maintenance therapy.",
                "Authorized by Dr. Rao.",
                "Dispensed confirmation received from pharmacy."
            ]),
            "recommended_action": "Route to prescribing provider for authorization.",
            "draft_message": "Prescription authorized and transmitted.",
            "provider_decision": "APPROVE",
            "decided_by": "Dr. Rao",
            "decided_at": t_minus(280),
            "blocker_title": "Resolved",
            "blocker_description": "Refill authorized, confirmed by pharmacy, and patient notified",
            "owner": "Completed",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "CVS Pharmacy #8821",
            "pharmacy_phone": "(555) 345-6789",
            "clinical_flag": None,
            "created_at": t_minus(350),
            "updated_at": t_minus(275),
            "events": [
                ("E-Prescribe Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Refill renewal request received from CVS #8821.", t_minus(350)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "AI Triage completed (96% confidence).", t_minus(345)),
                ("Practice Staff", "ROUTED_TO_PROVIDER", "TRIAGED", "PROVIDER_REVIEW", "Routed to Dr. Rao queue.", t_minus(320)),
                ("Dr. Rao (Clinician)", "PROVIDER_DECISION_APPROVE", "PROVIDER_REVIEW", "DECIDED", "Clinical decision: APPROVE. Refill authorized for 90 days.", t_minus(280)),
                ("Workflow Engine", "SENT_TO_PHARMACY", "DECIDED", "SENT_TO_PHARMACY", "Electronic script transmitted to CVS #8821.", t_minus(279)),
                ("Mock Pharmacy", "PHARMACY_CONFIRMED", "SENT_TO_PHARMACY", "CONFIRMED", "CVS Pharmacy confirmed dispense order. Rx #RX-100801.", t_minus(277)),
                ("Workflow Engine", "PATIENT_NOTIFIED", "CONFIRMED", "PATIENT_NOTIFIED", "Patient notified via SMS and portal.", t_minus(275))
            ]
        },
        {
            "id": "REF-1077",
            "patient_name": "Elena Rostova",
            "patient_id": "PT-1077",
            "medication": "Ozempic (Semaglutide)",
            "dosage": "1 mg/0.74 mL pen",
            "condition": "Type 2 Diabetes",
            "last_visit_date": "August 15, 2026",
            "last_vitals_summary": "BP 124/80, HbA1c 7.6% (Documented)",
            "refills_remaining": 0,
            "request_channel": "E-Prescribe",
            "state": "INFO_GATHERING",
            "lane": "NEEDS_INFO",
            "ai_confidence": 0.95,
            "ai_reasoning": json.dumps([
                "Refill request for maintenance GLP-1 receptor agonist.",
                "INSURANCE CLAIM REJECTION: Payer (UnitedHealthcare) rejected pharmacy claim (Reject 75: Prior Authorization Required).",
                "Clinical documentation needed: Verification of Metformin step therapy trial and HbA1c > 7.0%.",
                "Action needed: Practice staff must submit electronic Prior Authorization (ePA) packet."
            ]),
            "missing_info_note": "Payer (UnitedHealthcare) requires electronic Prior Authorization (ePA) before dispensing.",
            "recommended_action": "Initiate electronic Prior Authorization (ePA via CoverMyMeds) to UnitedHealthcare.",
            "draft_message": "Prior Auth Coordinator: Ozempic refill rejected by UnitedHealthcare. Step therapy and recent HbA1c 7.6% on file; ready for ePA submission.",
            "blocker_title": "Insurance Prior Authorization Required",
            "blocker_description": "Payer claim rejected (Reject 75: Prior Authorization Required); ePA submission needed",
            "owner": "Practice Staff (Prior Auth Coordinator)",
            "assigned_provider": "Dr. Rao",
            "pharmacy_name": "CVS Pharmacy #8821",
            "pharmacy_phone": "(555) 345-6789",
            "clinical_flag": "Insurance Prior Auth Required",
            "insurance_provider": "UnitedHealthcare Choice Plus",
            "insurance_id": "UHC-992144",
            "insurance_group": "GRP-UHC9",
            "rx_bin": "610014",
            "rx_pcn": "UHC",
            "prior_auth_required": True,
            "prior_auth_status": "PA_REQUIRED",
            "prior_auth_number": None,
            "priority": "URGENT",
            "priority_reason": "Payer Reject 75 (Prior Auth Required); step-therapy and lab documentation prepared for submission",
            "sla_status": "AT_RISK",
            "sla_target_hours": 2,
            "is_stalled": False,
            "patient_sms_preview": "Hi Elena, your Ozempic refill requires electronic prior authorization from UnitedHealthcare. Our clinic is submitting clinical documentation today.",
            "created_at": t_minus(110),
            "updated_at": t_minus(95),
            "events": [
                ("CVS Pharmacy Gateway", "REQUEST_RECEIVED", None, "REQUESTED", "Inbound refill request received. Payer claim rejected with Reject Code 75 (Prior Authorization Required).", t_minus(110)),
                ("AI Triage Engine", "TRIAGE_COMPLETED", "REQUESTED", "TRIAGED", "Guardrail 7 applied: Insurance Prior Authorization Required. Triaged to NEEDS_INFO lane (95% confidence).", t_minus(105)),
                ("Practice Staff", "INFO_REQUESTED", "TRIAGED", "INFO_GATHERING", "Insurance PA packet initiated in CoverMyMeds. Chart notes and HbA1c lab attached for payer review.", t_minus(95))
            ]
        }
    ]

    for item in seeds:
        events_data = item.pop("events")
        refill = RefillRequest(**item)
        db.add(refill)
        db.commit()
        db.refresh(refill)

        for actor, action, from_s, to_s, detail, ts in events_data:
            ev = AuditEvent(
                refill_id=refill.id,
                timestamp=ts,
                actor=actor,
                action=action,
                from_state=from_s,
                to_state=to_s,
                detail=detail
            )
            db.add(ev)
        db.commit()

    db.close()
    print("Database successfully seeded with 9 clinical refill records (including Insurance Prior Auth) and full audit histories!")

if __name__ == "__main__":
    seed_database()
