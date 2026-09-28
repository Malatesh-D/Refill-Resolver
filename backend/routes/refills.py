from datetime import datetime, timezone
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.refill import RefillRequest
from models.audit_event import AuditEvent
from schemas.refill import (
    RefillCreate, RefillUpdate, RefillResponse, DashboardMetrics, AuditEventResponse, PriorAuthSubmission
)
from schemas.decision import ProviderDecisionRequest, RequestInfoRequest, SendToProviderRequest
from services.audit_service import log_audit_event
from services.workflow_service import transition_refill
from services.ai_service import run_ai_triage
from services.pharmacy_service import notify_pharmacy, process_pharmacy_webhook

router = APIRouter(prefix="/refills", tags=["Refills"])

def serialize_refill(refill: RefillRequest) -> dict:
    reasoning_list = refill.get_ai_reasoning_list()
    events = [
        AuditEventResponse(
            id=ev.id,
            refill_id=ev.refill_id,
            timestamp=ev.timestamp,
            actor=ev.actor,
            action=ev.action,
            from_state=ev.from_state,
            to_state=ev.to_state,
            detail=ev.detail
        ) for ev in refill.audit_events
    ]
    return {
        "id": refill.id,
        "patient_name": refill.patient_name,
        "patient_id": refill.patient_id,
        "medication": refill.medication,
        "dosage": refill.dosage,
        "condition": refill.condition,
        "last_visit_date": refill.last_visit_date,
        "last_vitals_summary": refill.last_vitals_summary,
        "refills_remaining": refill.refills_remaining,
        "request_channel": refill.request_channel,
        "state": refill.state,
        "lane": refill.lane,
        "ai_reasoning": reasoning_list,
        "ai_confidence": refill.ai_confidence or 0.0,
        "missing_info_note": refill.missing_info_note,
        "recommended_action": refill.recommended_action,
        "draft_message": refill.draft_message,
        "is_fallback": bool(refill.is_fallback),
        "provider_decision": refill.provider_decision,
        "decided_by": refill.decided_by,
        "decided_at": refill.decided_at,
        "provider_note": getattr(refill, "provider_note", None),
        "assigned_provider": refill.assigned_provider or "Dr. Rao",
        "blocker_title": refill.blocker_title or "Pending Triage",
        "blocker_description": refill.blocker_description or "",
        "owner": refill.owner or "Dr. Rao",
        "pharmacy_name": refill.pharmacy_name or "Walgreens Pharmacy #4120",
        "pharmacy_phone": refill.pharmacy_phone or "(555) 234-5678",
        "clinical_flag": refill.clinical_flag,
        "appointment_scheduled": bool(refill.appointment_scheduled),
        "appointment_date": refill.appointment_date,
        "appointment_time": refill.appointment_time,
        "appointment_type": refill.appointment_type,
        "appointment_notes": refill.appointment_notes,
        "insurance_provider": refill.insurance_provider or "Blue Cross Blue Shield",
        "insurance_id": refill.insurance_id or "BCBS-994821",
        "insurance_group": refill.insurance_group or "GRP-4401",
        "rx_bin": refill.rx_bin or "004336",
        "rx_pcn": refill.rx_pcn or "ADV",
        "prior_auth_required": bool(refill.prior_auth_required),
        "prior_auth_status": refill.prior_auth_status or "NOT_REQUIRED",
        "prior_auth_number": refill.prior_auth_number,
        "priority": getattr(refill, "priority", "NORMAL") or "NORMAL",
        "priority_reason": getattr(refill, "priority_reason", None),
        "sla_status": getattr(refill, "sla_status", "ON_TRACK") or "ON_TRACK",
        "sla_target_hours": getattr(refill, "sla_target_hours", 4) or 4,
        "is_stalled": bool(getattr(refill, "is_stalled", False)),
        "stalled_reason": getattr(refill, "stalled_reason", None),
        "duplicate_warning": getattr(refill, "duplicate_warning", None),
        "patient_sms_preview": getattr(refill, "patient_sms_preview", None) or f"Refill Resolve update for {refill.patient_name}: Your {refill.medication} request is {refill.state.replace('_', ' ').lower()}. We will notify you when ready at {refill.pharmacy_name or 'your pharmacy'}.",
        "created_at": refill.created_at,
        "updated_at": refill.updated_at,
        "audit_events": events
    }

def is_refill_resolved(r) -> bool:
    return (
        r.state in ["PATIENT_NOTIFIED", "CONFIRMED"] or
        r.provider_decision in ["DENY", "APPROVE"] or
        getattr(r, "owner", "") in ["Completed", "Closed"] or
        bool(getattr(r, "appointment_scheduled", False))
    )

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    all_refills = db.query(RefillRequest).all()
    
    resolved_today = [r for r in all_refills if is_refill_resolved(r)]
    active_refills = [r for r in all_refills if not is_refill_resolved(r)]
    needs_provider = [r for r in active_refills if r.state in ["PROVIDER_REVIEW", "TRIAGED"] and r.lane in ["NEEDS_PROVIDER", "AUTO_CLEAR"]]
    needs_information = [r for r in active_refills if r.state == "INFO_GATHERING" or r.lane == "NEEDS_INFO"]

    queue_counts = {
        "needs_review": len([r for r in active_refills if r.state == "PROVIDER_REVIEW"]),
        "needs_info": len([r for r in active_refills if r.state == "INFO_GATHERING" or (r.state == "TRIAGED" and r.lane == "NEEDS_INFO")]),
        "ready_for_provider": len([r for r in active_refills if r.state == "TRIAGED" and r.lane in ["NEEDS_PROVIDER", "AUTO_CLEAR"]]),
        "recently_resolved": len(resolved_today)
    }

    urgent_count = len([r for r in active_refills if getattr(r, "priority", "NORMAL") == "URGENT"])
    stalled_count = len([r for r in active_refills if getattr(r, "is_stalled", False)])
    sla_breached_count = len([r for r in active_refills if getattr(r, "sla_status", "ON_TRACK") == "BREACHED"])
    prior_auth_count = len([r for r in active_refills if getattr(r, "prior_auth_status", "NOT_REQUIRED") == "PA_REQUIRED"])

    return DashboardMetrics(
        active_refills=len(active_refills),
        needs_provider=len(needs_provider),
        needs_information=len(needs_information),
        resolved_today=len(resolved_today),
        avg_resolution_time="2h 18m",
        queue_counts=queue_counts,
        urgent_count=urgent_count,
        stalled_count=stalled_count,
        sla_breached_count=sla_breached_count,
        prior_auth_count=prior_auth_count
    )

@router.get("", response_model=List[RefillResponse])
def list_refills(
    lane: Optional[str] = None,
    state: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RefillRequest)
    if lane:
        query = query.filter(RefillRequest.lane == lane)
    if state:
        query = query.filter(RefillRequest.state == state)
    if priority:
        query = query.filter(RefillRequest.priority == priority)
    
    refills = query.order_by(RefillRequest.created_at.desc()).all()
    return [serialize_refill(r) for r in refills]

@router.get("/{id}", response_model=RefillResponse)
def get_refill(id: str, db: Session = Depends(get_db)):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")
    return serialize_refill(refill)

@router.post("", response_model=RefillResponse)
async def create_refill(payload: RefillCreate, db: Session = Depends(get_db)):
    refill_id = f"REF-{int(datetime.now().timestamp() * 1000) % 100000:05d}"
    
    refill = RefillRequest(
        id=refill_id,
        patient_name=payload.patient_name,
        patient_id=payload.patient_id,
        medication=payload.medication,
        dosage=payload.dosage,
        condition=payload.condition,
        last_visit_date=payload.last_visit_date,
        last_vitals_summary=payload.last_vitals_summary,
        refills_remaining=payload.refills_remaining,
        request_channel=payload.request_channel,
        assigned_provider=payload.assigned_provider or "Dr. Rao",
        pharmacy_name=payload.pharmacy_name or "Walgreens Pharmacy #4120",
        pharmacy_phone=payload.pharmacy_phone or "(555) 234-5678",
        clinical_flag=payload.clinical_flag,
        state="REQUESTED",
        lane="NEEDS_PROVIDER",
        blocker_title="Intake Triage Pending",
        blocker_description="New refill request received; initiating AI triage",
        owner="AI Triage"
    )
    db.add(refill)
    db.commit()
    db.refresh(refill)

    # Log initial intake event
    log_audit_event(
        db=db,
        refill_id=refill.id,
        actor=payload.request_channel,
        action="REQUEST_RECEIVED",
        from_state=None,
        to_state="REQUESTED",
        detail=f"Refill request received for {refill.patient_name} ({refill.medication} {refill.dosage}) via {refill.request_channel}."
    )

    # Perform automated AI triage
    refill_dict = {
        "patient_name": refill.patient_name,
        "medication": refill.medication,
        "dosage": refill.dosage,
        "condition": refill.condition,
        "refills_remaining": refill.refills_remaining,
        "last_visit_date": refill.last_visit_date,
        "last_vitals_summary": refill.last_vitals_summary,
        "clinical_flag": refill.clinical_flag
    }
    triage_result = await run_ai_triage(refill_dict)
    
    refill.lane = triage_result.lane
    refill.ai_confidence = triage_result.confidence
    refill.set_ai_reasoning_list(triage_result.reasoning)
    refill.recommended_action = triage_result.recommended_action
    refill.draft_message = triage_result.draft_message
    refill.is_fallback = triage_result.is_fallback

    # Transition REQUESTED -> TRIAGED
    transition_refill(
        db=db,
        refill=refill,
        to_state="TRIAGED",
        actor="AI Triage Engine",
        action="TRIAGE_COMPLETED",
        detail=f"Classified into lane {triage_result.lane} with {int(triage_result.confidence*100)}% confidence. {triage_result.recommended_action}"
    )

    db.refresh(refill)
    return serialize_refill(refill)

@router.put("/{id}", response_model=RefillResponse)
async def update_refill(id: str, payload: RefillUpdate, db: Session = Depends(get_db)):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    update_data = payload.dict(exclude_unset=True)
    retrigger_ai = update_data.pop("retrigger_ai", False)

    for field, val in update_data.items():
        if val is not None:
            setattr(refill, field, val)

    # Log audit event
    log_audit_event(
        db=db,
        refill_id=refill.id,
        actor="Practice Staff",
        action="RECORD_UPDATED",
        from_state=refill.state,
        to_state=refill.state,
        detail=f"Patient clinical chart updated: {', '.join(update_data.keys())}"
    )

    if retrigger_ai:
        refill_dict = {
            "patient_name": refill.patient_name,
            "medication": refill.medication,
            "dosage": refill.dosage,
            "condition": refill.condition,
            "refills_remaining": refill.refills_remaining,
            "last_visit_date": refill.last_visit_date,
            "last_vitals_summary": refill.last_vitals_summary,
            "clinical_flag": refill.clinical_flag,
        }
        triage_result = await run_ai_triage(refill_dict)
        refill.lane = triage_result.lane
        refill.ai_confidence = triage_result.confidence
        refill.set_ai_reasoning_list(triage_result.reasoning)
        refill.recommended_action = triage_result.recommended_action
        refill.draft_message = triage_result.draft_message
        refill.is_fallback = triage_result.is_fallback

        log_audit_event(
            db=db,
            refill_id=refill.id,
            actor="AI Triage Engine",
            action="AI_RETRIAGED",
            from_state=refill.state,
            to_state=refill.state,
            detail=f"Re-triaged following chart update. Lane: {triage_result.lane} ({int(triage_result.confidence*100)}% confidence)."
        )

    db.add(refill)
    db.commit()
    db.refresh(refill)
    return serialize_refill(refill)

@router.delete("/{id}")
def delete_refill(id: str, db: Session = Depends(get_db)):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    patient_name = refill.patient_name
    medication = refill.medication

    db.delete(refill)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully deleted refill request {id} for {patient_name} ({medication}).",
        "id": id
    }

@router.post("/reset-demo")
def reset_demo_database():
    from seed import seed_database
    seed_database()
    return {
        "success": True,
        "message": "All patient refill records have been reset to pristine benchmark states."
    }

@router.post("/{id}/triage", response_model=RefillResponse)
async def triage_refill(id: str, db: Session = Depends(get_db)):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    refill_dict = {
        "patient_name": refill.patient_name,
        "medication": refill.medication,
        "dosage": refill.dosage,
        "condition": refill.condition,
        "refills_remaining": refill.refills_remaining,
        "last_visit_date": refill.last_visit_date,
        "last_vitals_summary": refill.last_vitals_summary,
        "clinical_flag": refill.clinical_flag,
        "missing_info_note": refill.missing_info_note
    }

    triage_result = await run_ai_triage(refill_dict)
    refill.lane = triage_result.lane
    refill.ai_confidence = triage_result.confidence
    refill.set_ai_reasoning_list(triage_result.reasoning)
    refill.recommended_action = triage_result.recommended_action
    refill.draft_message = triage_result.draft_message
    refill.is_fallback = triage_result.is_fallback

    if refill.state in ["REQUESTED", "INFO_GATHERING"]:
        transition_refill(
            db=db,
            refill=refill,
            to_state="TRIAGED",
            actor="AI Triage Engine",
            action="TRIAGE_EVALUATED",
            detail=f"Re-evaluated triage. Lane: {triage_result.lane}. Confidence: {int(triage_result.confidence*100)}%."
        )
    else:
        log_audit_event(
            db=db,
            refill_id=refill.id,
            actor="AI Triage Engine",
            action="TRIAGE_UPDATED",
            from_state=refill.state,
            to_state=refill.state,
            detail=f"Triage updated. Lane: {triage_result.lane} ({int(triage_result.confidence*100)}% confidence)."
        )
        db.add(refill)
        db.commit()

    db.refresh(refill)
    return serialize_refill(refill)

@router.post("/{id}/send-to-provider", response_model=RefillResponse)
def send_to_provider(
    id: str,
    payload: SendToProviderRequest = SendToProviderRequest(),
    db: Session = Depends(get_db)
):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    if payload.assigned_provider:
        refill.assigned_provider = payload.assigned_provider

    # Valid transition: TRIAGED -> PROVIDER_REVIEW
    transition_refill(
        db=db,
        refill=refill,
        to_state="PROVIDER_REVIEW",
        actor=payload.routed_by or "Practice Staff",
        action="ROUTED_TO_PROVIDER",
        detail=payload.note or f"Practice staff routed refill to {refill.assigned_provider} for clinical review."
    )

    db.refresh(refill)
    return serialize_refill(refill)

@router.post("/{id}/request-info", response_model=RefillResponse)
def request_info(
    id: str,
    payload: RequestInfoRequest,
    db: Session = Depends(get_db)
):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    refill.missing_info_note = payload.missing_info_note
    refill.lane = "NEEDS_INFO"

    # Valid transition: TRIAGED -> INFO_GATHERING
    transition_refill(
        db=db,
        refill=refill,
        to_state="INFO_GATHERING",
        actor=payload.requested_by,
        action="INFO_REQUESTED",
        detail=f"Information request initiated: {payload.missing_info_note}"
    )

    db.refresh(refill)
    return serialize_refill(refill)

@router.post("/{id}/decision", response_model=RefillResponse)
def record_provider_decision(
    id: str,
    payload: ProviderDecisionRequest,
    db: Session = Depends(get_db)
):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    decision_norm = payload.decision.upper()
    if decision_norm not in ["APPROVE", "DENY", "NEEDS_VISIT"]:
        raise HTTPException(status_code=400, detail="Invalid decision. Must be APPROVE, DENY, or NEEDS_VISIT.")

    refill.provider_decision = decision_norm
    refill.decided_by = payload.decided_by or "Dr. Rao"
    refill.decided_at = datetime.now(timezone.utc)
    refill.provider_note = payload.note

    # Transition PROVIDER_REVIEW -> DECIDED
    transition_refill(
        db=db,
        refill=refill,
        to_state="DECIDED",
        actor=f"Dr. {refill.decided_by.replace('Dr. ', '')} (Clinician)",
        action=f"PROVIDER_DECISION_{decision_norm}",
        detail=f"Clinical decision recorded: {decision_norm}. {payload.note or ''}".strip()
    )

    # If APPROVED: seamlessly complete workflow loop: DECIDED -> SENT_TO_PHARMACY -> Mock Pharmacy -> CONFIRMED -> PATIENT_NOTIFIED
    if decision_norm == "APPROVE":
        notify_res = notify_pharmacy(db=db, refill=refill, simulate_failure=False)
        if notify_res.get("success"):
            # Mock pharmacy acknowledges and verifies
            process_pharmacy_webhook(
                db=db,
                refill_id=refill.id,
                status="CONFIRMED",
                rx_number=f"RX-{refill.id.replace('REF-', '')}01",
                message=f"Dispense authorization acknowledged by {refill.pharmacy_name}."
            )
    elif decision_norm == "DENY":
        refill.blocker_title = "Renewal Not Approved"
        refill.blocker_description = f"Prescription renewal denied by {refill.decided_by}. Patient advised to schedule clinical consultation."
        refill.owner = "Completed"
        refill.patient_sms_preview = f"Refill Resolve update for {refill.patient_name}: Your {refill.medication} renewal was not authorized by {refill.decided_by}. Please contact our clinic to discuss alternative care."
        db.add(refill)
        db.commit()
    elif decision_norm == "NEEDS_VISIT":
        refill.blocker_title = "Office Visit Requested"
        refill.blocker_description = f"Clinician requested consultation prior to renewal. Awaiting appointment booking."
        refill.owner = "Patient"
        refill.patient_sms_preview = f"Refill Resolve update for {refill.patient_name}: Dr. {refill.decided_by.replace('Dr. ', '')} requested a consultation before renewing your {refill.medication}. Please tap your portal link to schedule."
        db.add(refill)
        db.commit()

    db.refresh(refill)
    return serialize_refill(refill)

@router.post("/{id}/send-to-pharmacy")
def trigger_send_to_pharmacy(
    id: str,
    simulate_failure: bool = False,
    db: Session = Depends(get_db)
):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    if refill.provider_decision != "APPROVE":
        raise HTTPException(
            status_code=400,
            detail="Cannot transmit to pharmacy without explicit provider clinical approval."
        )

    result = notify_pharmacy(db=db, refill=refill, simulate_failure=simulate_failure)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail="Pharmacy notification failed. The refill remains pending until confirmation.")

    # In mock mode, complete the confirmation webhook
    process_pharmacy_webhook(
        db=db,
        refill_id=refill.id,
        status="CONFIRMED",
        rx_number=f"RX-{refill.id.replace('REF-', '')}99",
        message=f"Prescription verified and queued at {refill.pharmacy_name}."
    )
    
    db.refresh(refill)
    return serialize_refill(refill)

@router.post("/{id}/submit-prior-auth", response_model=RefillResponse)
def submit_electronic_prior_auth(
    id: str,
    payload: PriorAuthSubmission = PriorAuthSubmission(),
    db: Session = Depends(get_db)
):
    """
    Simulates electronic Prior Authorization (ePA via CoverMyMeds/NCPDP 2017071 standard)
    submission to the insurance payer. Payer returns electronic determination.
    """
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    refill.prior_auth_status = "APPROVED"
    refill.prior_auth_number = f"PA-{refill.id.replace('REF-', '')}-882"
    refill.lane = "NEEDS_PROVIDER"
    refill.blocker_title = "Prior Auth Approved - Ready for Provider Sign-Off"
    refill.blocker_description = f"Electronic Prior Authorization approved by {refill.insurance_provider} (Auth #{refill.prior_auth_number}). Staged for clinician sign-off."
    refill.owner = refill.assigned_provider or "Dr. Rao"

    # Log audit event
    log_audit_event(
        db=db,
        refill_id=refill.id,
        actor=payload.submitted_by or "Practice Staff (Prior Auth Coordinator)",
        action="PRIOR_AUTH_SUBMITTED_AND_APPROVED",
        from_state=refill.state,
        to_state=refill.state,
        detail=f"Electronic Prior Authorization (ePA NCPDP standard via CoverMyMeds) submitted to {refill.insurance_provider}. Payer returned immediate electronic approval #{refill.prior_auth_number}. {payload.clinical_notes or ''}".strip()
    )

    # Transition to PROVIDER_REVIEW
    if refill.state in ["INFO_GATHERING", "TRIAGED"]:
        transition_refill(
            db=db,
            refill=refill,
            to_state="PROVIDER_REVIEW",
            actor="Workflow Engine",
            action="ROUTED_AFTER_PA_APPROVAL",
            detail=f"Insurance coverage verified with {refill.insurance_provider} (Auth #{refill.prior_auth_number}). Routed to {refill.assigned_provider} for clinical review."
        )

    db.add(refill)
    db.commit()
    db.refresh(refill)
    return serialize_refill(refill)

@router.get("/{id}/timeline", response_model=List[AuditEventResponse])
def get_refill_timeline(id: str, db: Session = Depends(get_db)):
    refill = db.query(RefillRequest).filter(RefillRequest.id == id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")
    
    events = db.query(AuditEvent).filter(AuditEvent.refill_id == id).order_by(AuditEvent.timestamp.asc()).all()
    return events
