from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from models.audit_event import AuditEvent

logger = logging.getLogger("refill_resolve.audit")

def log_audit_event(
    db: Session,
    refill_id: str,
    actor: str,
    action: str,
    from_state: str = None,
    to_state: str = None,
    detail: str = None,
) -> AuditEvent:
    """
    Append-only audit event logging.
    Never modifies existing records.
    """
    event = AuditEvent(
        refill_id=refill_id,
        timestamp=datetime.now(timezone.utc),
        actor=actor,
        action=action,
        from_state=from_state,
        to_state=to_state,
        detail=detail,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    logger.info(
        f"[AUDIT] Refill: {refill_id} | Actor: {actor} | Action: {action} | "
        f"Transition: {from_state} -> {to_state} | Detail: {detail}"
    )
    return event
