import logging
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from models.refill import RefillRequest
from services.workflow_service import transition_refill
from services.audit_service import log_audit_event

logger = logging.getLogger("refill_resolve.pharmacy")

def notify_pharmacy(
    db: Session,
    refill: RefillRequest,
    simulate_failure: bool = False
) -> Dict[str, Any]:
    """
    Simulates sending electronic prescription renewal to the dispensing pharmacy.
    """
    if simulate_failure:
        log_audit_event(
            db=db,
            refill_id=refill.id,
            actor="Mock Pharmacy Gateway",
            action="TRANSMISSION_FAILED",
            from_state=refill.state,
            to_state=refill.state,
            detail=f"Network timeout contacting {refill.pharmacy_name}. Electronic script held in retry queue."
        )
        return {
            "success": False,
            "error": "Pharmacy gateway timeout. Script queued for retry.",
            "status": "FAILED",
            "refill_id": refill.id
        }

    # Transition to SENT_TO_PHARMACY if in DECIDED, or log idempotent retry if already transmitted
    if refill.state == "DECIDED":
        transition_refill(
            db=db,
            refill=refill,
            to_state="SENT_TO_PHARMACY",
            actor="Workflow Engine",
            action="SENT_TO_PHARMACY",
            detail=f"Electronic prescription (NCPDP SCRIPT standard) transmitted to {refill.pharmacy_name}."
        )
    elif refill.state in ["SENT_TO_PHARMACY", "CONFIRMED", "PATIENT_NOTIFIED"]:
        log_audit_event(
            db=db,
            refill_id=refill.id,
            actor="Workflow Engine",
            action="PHARMACY_RETRANSMIT",
            from_state=refill.state,
            to_state=refill.state,
            detail=f"Prescription re-transmitted/verified with {refill.pharmacy_name}."
        )
    else:
        # Invalid state will be caught and rejected by transition_refill
        transition_refill(
            db=db,
            refill=refill,
            to_state="SENT_TO_PHARMACY",
            actor="Workflow Engine",
            action="SENT_TO_PHARMACY",
            detail=f"Electronic prescription (NCPDP SCRIPT standard) transmitted to {refill.pharmacy_name}."
        )

    return {
        "success": True,
        "status": "SENT_TO_PHARMACY",
        "transmission_id": f"NCPDP-{refill.id}-TX77",
        "pharmacy": refill.pharmacy_name,
        "message": f"Successfully transmitted prescription order to {refill.pharmacy_name}"
    }

def process_pharmacy_webhook(
    db: Session,
    refill_id: str,
    status: str,
    rx_number: str = "RX-8849201",
    message: str = None
) -> RefillRequest:
    """
    Simulates inbound webhook from pharmacy acknowledging the dispensed authorization.
    Transitions: SENT_TO_PHARMACY -> CONFIRMED -> PATIENT_NOTIFIED.
    """
    refill = db.query(RefillRequest).filter(RefillRequest.id == refill_id).first()
    if not refill:
        raise ValueError(f"Refill request {refill_id} not found.")

    if status == "CONFIRMED":
        if refill.state == "SENT_TO_PHARMACY":
            # 1. Advance to CONFIRMED
            transition_refill(
                db=db,
                refill=refill,
                to_state="CONFIRMED",
                actor="Mock Pharmacy",
                action="PHARMACY_CONFIRMED",
                detail=f"Pharmacy verified fill order. Assigned Rx #{rx_number}. {message or 'Ready for processing'}"
            )
        if refill.state == "CONFIRMED":
            # 2. Advance automatically to PATIENT_NOTIFIED to close the resolution loop
            transition_refill(
                db=db,
                refill=refill,
                to_state="PATIENT_NOTIFIED",
                actor="Workflow Engine",
                action="PATIENT_NOTIFIED",
                detail=f"Automated notification dispatched to {refill.patient_name} via SMS / Patient Portal: Refill confirmed at {refill.pharmacy_name}."
            )
        elif refill.state == "PATIENT_NOTIFIED":
            log_audit_event(
                db=db,
                refill_id=refill.id,
                actor="Mock Pharmacy",
                action="PHARMACY_CONFIRMED_DUPLICATE",
                from_state=refill.state,
                to_state=refill.state,
                detail=f"Duplicate confirmation received from pharmacy (Rx #{rx_number}). Refill already completed."
            )
        
        logger.info(f"Refill {refill_id} fully confirmed and patient notified.")
        return refill
    else:
        log_audit_event(
            db=db,
            refill_id=refill.id,
            actor="Mock Pharmacy",
            action="PHARMACY_REJECTED",
            from_state=refill.state,
            to_state=refill.state,
            detail=f"Pharmacy returned negative acknowledgement: {message or 'Unable to dispense'}"
        )
        return refill
