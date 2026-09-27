from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class AuditEventResponse(BaseModel):
    id: int
    refill_id: str
    timestamp: datetime
    actor: str
    action: str
    from_state: Optional[str] = None
    to_state: Optional[str] = None
    detail: Optional[str] = None

    class Config:
        from_attributes = True

class RefillBase(BaseModel):
    patient_name: str
    patient_id: str
    medication: str
    dosage: str
    condition: str
    last_visit_date: Optional[str] = None
    last_vitals_summary: Optional[str] = None
    refills_remaining: int = 0
    request_channel: str = "E-Prescribe"
    assigned_provider: str = "Dr. Rao"
    pharmacy_name: str = "Walgreens Pharmacy #4120"
    pharmacy_phone: Optional[str] = "(555) 234-5678"
    clinical_flag: Optional[str] = None
    insurance_provider: Optional[str] = "Blue Cross Blue Shield"
    insurance_id: Optional[str] = "BCBS-994821"
    insurance_group: Optional[str] = "GRP-4401"
    rx_bin: Optional[str] = "004336"
    rx_pcn: Optional[str] = "ADV"
    prior_auth_required: Optional[bool] = False
    prior_auth_status: Optional[str] = "NOT_REQUIRED"
    prior_auth_number: Optional[str] = None

class RefillCreate(RefillBase):
    pass

class RefillUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    medication: Optional[str] = None
    dosage: Optional[str] = None
    condition: Optional[str] = None
    last_visit_date: Optional[str] = None
    last_vitals_summary: Optional[str] = None
    refills_remaining: Optional[int] = None
    clinical_flag: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_group: Optional[str] = None
    rx_bin: Optional[str] = None
    rx_pcn: Optional[str] = None
    prior_auth_required: Optional[bool] = None
    prior_auth_status: Optional[str] = None
    prior_auth_number: Optional[str] = None
    retrigger_ai: Optional[bool] = False

class PriorAuthSubmission(BaseModel):
    clinical_notes: Optional[str] = None
    step_therapy_confirmed: Optional[bool] = True
    submitted_by: Optional[str] = "Practice Staff (Prior Auth Coordinator)"

class RefillResponse(RefillBase):
    id: str
    state: str
    lane: str
    ai_reasoning: List[str] = []
    ai_confidence: float = 0.0
    missing_info_note: Optional[str] = None
    recommended_action: Optional[str] = None
    draft_message: Optional[str] = None
    is_fallback: bool = False
    
    provider_decision: Optional[str] = None
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    provider_note: Optional[str] = None
    
    blocker_title: str
    blocker_description: str
    owner: str
    created_at: datetime
    updated_at: datetime
    audit_events: List[AuditEventResponse] = []

    appointment_scheduled: bool = False
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_type: Optional[str] = None
    appointment_notes: Optional[str] = None

    # Priority, SLA & Operational Intelligence
    priority: str = "NORMAL"
    priority_reason: Optional[str] = None
    sla_status: str = "ON_TRACK"
    sla_target_hours: int = 4
    is_stalled: bool = False
    stalled_reason: Optional[str] = None
    duplicate_warning: Optional[str] = None
    patient_sms_preview: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    active_refills: int
    needs_provider: int
    needs_information: int
    resolved_today: int
    avg_resolution_time: str
    queue_counts: dict
    urgent_count: int = 0
    stalled_count: int = 0
    sla_breached_count: int = 0
    prior_auth_count: int = 0

class PatientStatusResponse(BaseModel):
    refill_id: str
    patient_id: str
    patient_name: str
    medication: str
    dosage: str
    status_headline: str
    status_explanation: str
    next_step: str
    last_updated: str
    is_confirmed: bool
    state: str
    provider_decision: Optional[str] = None
    assigned_provider: str = "Dr. Rao"
    appointment_scheduled: bool = False
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_type: Optional[str] = None
    appointment_notes: Optional[str] = None
    insurance_provider: Optional[str] = "Blue Cross Blue Shield"
    prior_auth_status: Optional[str] = "NOT_REQUIRED"
    provider_note: Optional[str] = None

class ScheduleAppointmentRequest(BaseModel):
    patient_id: str
    refill_id: Optional[str] = None
    appointment_type: str = "Telehealth Video Consultation"
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None
