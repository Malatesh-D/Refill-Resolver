from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.refill import RefillRequest
from schemas.decision import MockPharmacyNotification, MockPharmacyWebhook
from services.pharmacy_service import notify_pharmacy, process_pharmacy_webhook
from services.audit_service import log_audit_event

router = APIRouter(prefix="/mock/pharmacy", tags=["Mock Pharmacy Gateway"])

@router.post("/notify")
def pharmacy_notify_endpoint(payload: MockPharmacyNotification, db: Session = Depends(get_db)):
    """
    Simulates outbound electronic prescription notification to pharmacy system.
    """
    refill = db.query(RefillRequest).filter(RefillRequest.id == payload.refill_id).first()
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found.")

    res = notify_pharmacy(db=db, refill=refill, simulate_failure=payload.simulate_failure or False)
    if not res.get("success"):
        raise HTTPException(
            status_code=502,
            detail="Pharmacy notification failed. The refill remains pending until confirmation."
        )

    return {
        "status": "ACCEPTED",
        "message": f"Pharmacy gateway received prescription for {payload.medication} {payload.dosage}",
        "refill_id": refill.id,
        "pharmacy": payload.pharmacy_name or refill.pharmacy_name
    }

@router.post("/webhook")
def pharmacy_webhook_endpoint(payload: MockPharmacyWebhook, db: Session = Depends(get_db)):
    """
    Simulates inbound webhook callback from dispensing pharmacy confirming dispense authorization.
    """
    try:
        refill = process_pharmacy_webhook(
            db=db,
            refill_id=payload.refill_id,
            status=payload.status,
            rx_number=payload.rx_number or "RX-992144",
            message=payload.message
        )
        return {
            "status": "PROCESSED",
            "refill_id": refill.id,
            "new_state": refill.state
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
