from typing import Optional
from pydantic import BaseModel, Field

class ProviderDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVE, DENY, or NEEDS_VISIT")
    decided_by: str = Field(default="Dr. Rao", description="Name of the authorized clinician")
    note: Optional[str] = Field(default=None, description="Optional clinical note")

class RequestInfoRequest(BaseModel):
    missing_info_note: str = Field(..., description="Note explaining what information is needed")
    requested_by: str = Field(default="Practice Staff", description="Staff actor")

class SendToProviderRequest(BaseModel):
    assigned_provider: Optional[str] = Field(default="Dr. Rao")
    note: Optional[str] = None
    routed_by: str = Field(default="Practice Staff")

class MockPharmacyNotification(BaseModel):
    refill_id: str
    patient_name: Optional[str] = None
    medication: Optional[str] = None
    dosage: Optional[str] = None
    provider_name: Optional[str] = "Dr. Rao"
    pharmacy_name: Optional[str] = "Walgreens Pharmacy #4120"
    simulate_failure: Optional[bool] = False

class MockPharmacyWebhook(BaseModel):
    refill_id: str
    status: str = Field(..., description="CONFIRMED or FAILED")
    rx_number: Optional[str] = "RX-8849201"
    message: Optional[str] = "Prescription dispensed authorization received and queued"
