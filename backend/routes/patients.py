from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.refill import RefillRequest
from schemas.refill import PatientStatusResponse, ScheduleAppointmentRequest
from services.audit_service import log_audit_event

router = APIRouter(prefix="/patient", tags=["Patient"])

def build_patient_status_response(refill: RefillRequest) -> PatientStatusResponse:
    is_confirmed = refill.state in ["CONFIRMED", "PATIENT_NOTIFIED"]
    
    if is_confirmed:
        status_headline = "Refill confirmed"
        status_explanation = (
            f"Your pharmacy ({refill.pharmacy_name}) has received the refill authorization for {refill.medication} {refill.dosage}. "
            "They will notify you when it is ready for pickup or delivery."
        )
        next_step = f"Contact {refill.pharmacy_name} at {refill.pharmacy_phone} or check their mobile app for pickup readiness."
    elif refill.state == "SENT_TO_PHARMACY":
        status_headline = "Prescription sent to pharmacy"
        status_explanation = f"Your provider approved your refill. The prescription has been sent electronically to {refill.pharmacy_name}."
        next_step = "Pharmacy is reviewing and preparing the prescription."
    elif refill.state == "DECIDED" and refill.provider_decision == "DENY":
        status_headline = "Prescription renewal not approved"
        status_explanation = "Your clinician reviewed this refill request and determined a clinical follow-up is necessary."
        next_step = "Please call our office to discuss alternative therapies or schedule a consultation."
    elif refill.state == "DECIDED" and refill.provider_decision == "NEEDS_VISIT":
        if refill.appointment_scheduled:
            status_headline = "Appointment confirmed"
            status_explanation = (
                f"Your {refill.appointment_type or 'consultation'} has been scheduled with {refill.assigned_provider or 'Dr. Rao'} "
                f"for {refill.appointment_date} at {refill.appointment_time}. Your {refill.medication} {refill.dosage} refill will be reviewed and authorized during this visit."
            )
            next_step = f"Join your {refill.appointment_type or 'consultation'} on {refill.appointment_date} at {refill.appointment_time}. A confirmation link has been sent to your portal."
        else:
            status_headline = "Office visit requested"
            status_explanation = "Your provider requires an in-person or telehealth visit before refilling this prescription."
            next_step = "Please select a date and time below to schedule your appointment with your doctor."
    elif refill.prior_auth_status == "PA_REQUIRED":
        status_headline = "Awaiting insurance coverage approval"
        status_explanation = f"Your clinic is submitting required Prior Authorization paperwork to your insurance plan ({refill.insurance_provider or 'your insurance'}) so your medication is covered."
        next_step = "No action needed from you. We will update you as soon as your insurance responds."
    elif refill.state == "INFO_GATHERING":
        status_headline = "Information needed"
        status_explanation = "We are gathering additional context (such as recent vitals or lab confirmation) needed to safely process your refill."
        next_step = "Our office staff may reach out to you, or you can send recent readings through the patient portal."
    else:
        # REQUESTED, TRIAGED, PROVIDER_REVIEW
        status_headline = "Waiting for provider review"
        status_explanation = f"Your refill request for {refill.medication} {refill.dosage} has been sent to your prescribing provider ({refill.assigned_provider or 'your doctor'}) for review."
        next_step = "Your provider needs to review the request."

    last_updated_time = refill.updated_at.strftime("%I:%M %p") if refill.updated_at else "Recently"

    return PatientStatusResponse(
        refill_id=refill.id,
        patient_id=refill.patient_id,
        patient_name=refill.patient_name,
        medication=refill.medication,
        dosage=refill.dosage,
        status_headline=status_headline,
        status_explanation=status_explanation,
        next_step=next_step,
        last_updated=last_updated_time,
        is_confirmed=is_confirmed,
        state=refill.state,
        provider_decision=refill.provider_decision,
        assigned_provider=refill.assigned_provider or "Dr. Rao",
        appointment_scheduled=bool(refill.appointment_scheduled),
        appointment_date=refill.appointment_date,
        appointment_time=refill.appointment_time,
        appointment_type=refill.appointment_type,
        appointment_notes=refill.appointment_notes,
        insurance_provider=refill.insurance_provider or "Blue Cross Blue Shield",
        prior_auth_status=refill.prior_auth_status or "NOT_REQUIRED",
        provider_note=refill.provider_note,
    )

@router.get("/status/{patient_id}", response_model=PatientStatusResponse)
def get_patient_status(patient_id: str, db: Session = Depends(get_db)):
    refill = (
        db.query(RefillRequest)
        .filter(RefillRequest.patient_id.ilike(patient_id.strip()))
        .order_by(RefillRequest.updated_at.desc())
        .first()
    )

    if not refill:
        raise HTTPException(
            status_code=404,
            detail="No refill status found for this patient ID."
        )

    return build_patient_status_response(refill)

@router.post("/schedule", response_model=PatientStatusResponse)
def schedule_patient_appointment(
    payload: ScheduleAppointmentRequest,
    db: Session = Depends(get_db)
):
    """
    Allows a patient to directly schedule their required clinical consultation
    (telehealth or clinic visit) when their refill requires a visit.
    """
    query = db.query(RefillRequest)
    if payload.refill_id:
        refill = query.filter(RefillRequest.id == payload.refill_id).first()
    else:
        refill = (
            query.filter(RefillRequest.patient_id.ilike(payload.patient_id.strip()))
            .order_by(RefillRequest.updated_at.desc())
            .first()
        )

    if not refill:
        raise HTTPException(status_code=404, detail="Refill record not found for scheduling.")

    refill.appointment_scheduled = True
    refill.appointment_date = payload.appointment_date
    refill.appointment_time = payload.appointment_time
    refill.appointment_type = payload.appointment_type
    refill.appointment_notes = payload.notes
    refill.blocker_title = f"Visit Scheduled: {payload.appointment_date}"
    refill.blocker_description = (
        f"Patient scheduled {payload.appointment_type} with {refill.assigned_provider or 'Dr. Rao'} "
        f"on {payload.appointment_date} at {payload.appointment_time}."
    )

    db.add(refill)
    db.commit()
    db.refresh(refill)

    # Log in immutable audit trail
    log_audit_event(
        db=db,
        refill_id=refill.id,
        actor=f"{refill.patient_name} (Patient)",
        action="APPOINTMENT_SCHEDULED",
        from_state=refill.state,
        to_state=refill.state,
        detail=(
            f"Patient scheduled {payload.appointment_type} with {refill.assigned_provider or 'Dr. Rao'} "
            f"for {payload.appointment_date} at {payload.appointment_time}. Clinical refill hold active pending visit."
        )
    )

    return build_patient_status_response(refill)
