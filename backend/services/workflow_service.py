from typing import Set, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.refill import RefillRequest
from services.audit_service import log_audit_event

VALID_TRANSITIONS: Set[Tuple[str, str]] = {
    ("REQUESTED", "TRIAGED"),
    ("TRIAGED", "INFO_GATHERING"),
    ("TRIAGED", "PROVIDER_REVIEW"),
    ("TRIAGED", "DECIDED"),
    ("INFO_GATHERING", "TRIAGED"),
    ("INFO_GATHERING", "PROVIDER_REVIEW"),
    ("INFO_GATHERING", "DECIDED"),
    ("PROVIDER_REVIEW", "DECIDED"),
    ("DECIDED", "SENT_TO_PHARMACY"),
    ("SENT_TO_PHARMACY", "CONFIRMED"),
    ("CONFIRMED", "PATIENT_NOTIFIED"),
}

def validate_transition(from_state: str, to_state: str) -> bool:
    return (from_state, to_state) in VALID_TRANSITIONS

def transition_refill(
    db: Session,
    refill: RefillRequest,
    to_state: str,
    actor: str,
    action: str,
    detail: str = None
) -> RefillRequest:
    from_state = refill.state

    if not validate_transition(from_state, to_state):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid workflow transition: Cannot transition from '{from_state}' to '{to_state}'."
        )

    refill.state = to_state

    # Update blocker and owner context based on the new state
    if to_state == "TRIAGED":
        if refill.lane == "NEEDS_INFO":
            refill.blocker_title = "Missing Information"
            refill.blocker_description = refill.missing_info_note or "Additional patient/lab details required"
            refill.owner = "Practice Staff"
        else:
            refill.blocker_title = "Provider Action Required"
            refill.blocker_description = "Provider authorization required before dispensing"
            refill.owner = refill.assigned_provider or "Dr. Rao"
    elif to_state == "INFO_GATHERING":
        refill.blocker_title = "Information Request Pending"
        refill.blocker_description = refill.missing_info_note or "Contacting patient or records for chart update"
        refill.owner = "Practice Staff"
    elif to_state == "PROVIDER_REVIEW":
        refill.blocker_title = "Provider Authorization Pending"
        refill.blocker_description = "Awaiting clinical review and prescription sign-off"
        refill.owner = refill.assigned_provider or "Dr. Rao"
    elif to_state == "DECIDED":
        if refill.provider_decision == "APPROVE":
            refill.blocker_title = "Pharmacy Transmission Pending"
            refill.blocker_description = f"Approved by {refill.decided_by or 'Provider'}; queued for pharmacy gateway"
            refill.owner = "Workflow Engine"
        elif refill.provider_decision == "DENY":
            refill.blocker_title = "Prescription Refill Denied"
            refill.blocker_description = f"Denied by {refill.decided_by or 'Provider'}"
            refill.owner = "Closed"
        elif refill.provider_decision == "NEEDS_VISIT":
            refill.blocker_title = "Office Visit Required"
            refill.blocker_description = f"Provider requires in-person or telehealth visit prior to refill"
            refill.owner = "Practice Staff"
    elif to_state == "SENT_TO_PHARMACY":
        refill.blocker_title = "Pharmacy Confirmation Pending"
        refill.blocker_description = f"Electronic script sent to {refill.pharmacy_name}; awaiting NCPDP 997 ack"
        refill.owner = refill.pharmacy_name
    elif to_state == "CONFIRMED":
        refill.blocker_title = "Dispatching Patient Notification"
        refill.blocker_description = "Refill confirmed by pharmacy; closing the loop with patient"
        refill.owner = "Notification Gateway"
    elif to_state == "PATIENT_NOTIFIED":
        refill.blocker_title = "Resolved"
        refill.blocker_description = "Refill authorized, confirmed by pharmacy, and patient notified"
        refill.owner = "Completed"

    db.add(refill)
    db.commit()
    db.refresh(refill)

    # Log audit event
    log_audit_event(
        db=db,
        refill_id=refill.id,
        actor=actor,
        action=action,
        from_state=from_state,
        to_state=to_state,
        detail=detail,
    )

    return refill
