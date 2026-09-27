from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    refill_id = Column(String, ForeignKey("refill_requests.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    actor = Column(String, nullable=False)  # e.g., "AI Triage", "Practice Staff", "Dr. Rao", "Mock Pharmacy Gateway"
    action = Column(String, nullable=False) # e.g., "REQUESTED", "TRIAGED", "ROUTED_TO_PROVIDER", "PROVIDER_DECISION_APPROVE", "SENT_TO_PHARMACY", "PHARMACY_CONFIRMED", "PATIENT_NOTIFIED"
    from_state = Column(String, nullable=True)
    to_state = Column(String, nullable=True)
    detail = Column(Text, nullable=True)

    refill = relationship("RefillRequest", back_populates="audit_events")
