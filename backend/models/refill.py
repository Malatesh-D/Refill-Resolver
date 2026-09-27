from datetime import datetime, timezone
import json
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

class RefillRequest(Base):
    __tablename__ = "refill_requests"

    id = Column(String, primary_key=True, index=True)
    patient_name = Column(String, nullable=False, index=True)
    patient_id = Column(String, nullable=False, index=True)
    medication = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    condition = Column(String, nullable=False)
    last_visit_date = Column(String, nullable=True)
    last_vitals_summary = Column(String, nullable=True)
    refills_remaining = Column(Integer, default=0)
    request_channel = Column(String, default="E-Prescribe")
    
    # State machine and triage lane
    state = Column(String, default="REQUESTED", index=True)
    lane = Column(String, default="NEEDS_PROVIDER", index=True)
    
    # AI outputs
    ai_reasoning = Column(Text, nullable=True)  # JSON-encoded array of strings
    ai_confidence = Column(Float, default=0.0)
    missing_info_note = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    draft_message = Column(Text, nullable=True)
    is_fallback = Column(Boolean, default=False)
    
    # Clinical decision (strictly Human-in-the-loop)
    provider_decision = Column(String, nullable=True)  # APPROVE, DENY, NEEDS_VISIT
    decided_by = Column(String, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    provider_note = Column(Text, nullable=True)
    
    # Operational & assignment context
    assigned_provider = Column(String, default="Dr. Rao")
    blocker_title = Column(String, default="Provider Action Required")
    blocker_description = Column(String, default="No refills remain on active prescription")
    owner = Column(String, default="Dr. Rao")
    pharmacy_name = Column(String, default="Walgreens Pharmacy #4120")
    pharmacy_phone = Column(String, default="(555) 234-5678")
    clinical_flag = Column(String, nullable=True)

    # Patient appointment scheduling context
    appointment_scheduled = Column(Boolean, default=False)
    appointment_date = Column(String, nullable=True)
    appointment_time = Column(String, nullable=True)
    appointment_type = Column(String, nullable=True)
    appointment_notes = Column(Text, nullable=True)

    # Insurance & Prior Authorization (PA) context
    insurance_provider = Column(String, default="Blue Cross Blue Shield")
    insurance_id = Column(String, default="BCBS-994821")
    insurance_group = Column(String, default="GRP-4401")
    rx_bin = Column(String, default="004336")
    rx_pcn = Column(String, default="ADV")
    prior_auth_required = Column(Boolean, default=False)
    prior_auth_status = Column(String, default="NOT_REQUIRED")  # NOT_REQUIRED, PA_REQUIRED, SUBMITTED_PENDING_REVIEW, APPROVED, DENIED
    prior_auth_number = Column(String, nullable=True)

    # Priority, SLA & Operational Intelligence
    priority = Column(String, default="NORMAL")  # URGENT, HIGH, NORMAL, ROUTINE
    priority_reason = Column(String, nullable=True)
    sla_status = Column(String, default="ON_TRACK")  # ON_TRACK, AT_RISK, BREACHED
    sla_target_hours = Column(Integer, default=4)
    is_stalled = Column(Boolean, default=False)
    stalled_reason = Column(String, nullable=True)
    duplicate_warning = Column(String, nullable=True)
    patient_sms_preview = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    audit_events = relationship("AuditEvent", back_populates="refill", cascade="all, delete-orphan", order_by="AuditEvent.timestamp")

    def get_ai_reasoning_list(self):
        if not self.ai_reasoning:
            return []
        try:
            return json.loads(self.ai_reasoning)
        except Exception:
            return [self.ai_reasoning]

    def set_ai_reasoning_list(self, reasoning_list):
        if isinstance(reasoning_list, list):
            self.ai_reasoning = json.dumps(reasoning_list)
        else:
            self.ai_reasoning = json.dumps([str(reasoning_list)])
