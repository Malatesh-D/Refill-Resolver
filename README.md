# REFILL RESOLVE

### Tagline: From stuck refill to resolved refill.

> **"We don't automate the doctor's decision. We automate everything around it."**

Refill Resolve is an AI-powered prescription refill orchestration platform built for physician practices, practice operations teams, and healthcare organizations.

Instead of prescription renewals disappearing into email inboxes, fax queues, and phone tag, Refill Resolve provides transparent, real-time diagnostic visibility:

1. **Current state**
2. **Blocker**
3. **Responsible party**
4. **Required action**
5. **Next step**
6. **Verification status**
7. **Complete immutable audit timeline**

---

## The Problem

Prescription refill workflows frequently become fragmented across EHRs, pharmacy faxes, and patient portals. A refill gets stuck because:
- No refills remain on the active prescription
- Clinician review and authorization is required
- Recent chart vitals or lab panels are missing or stale
- An office visit or telehealth checkup is overdue
- Pharmacy transmission acknowledgement is pending
- Information between clinic staff and the patient is unclear

The root problem is not simply "communication" — **nobody has a clear, shared view of why the refill is stuck, who owns the next action, and whether the workflow has actually reached completion.**

---

## The Solution: UNDERSTAND → ROUTE → ACT → VERIFY → RESOLVE

Refill Resolve organizes the lifecycle into five distinct, auditable phases:

```text
  UNDERSTAND       AI triage analyzes clinical context & isolates root blocker
      ↓
    ROUTE          Classified into triage lanes (NEEDS_PROVIDER, NEEDS_INFO, AUTO_CLEAR)
      ↓
     ACT           Authorized provider explicitly reviews & records clinical decision
      ↓
    VERIFY         Electronic script transmitted & pharmacy confirms fulfillment (NCPDP 997)
      ↓
   RESOLVE         Patient is automatically notified with clear next steps; audit trail closes
```

---

## Core Product Question

Refill Resolve answers the single most important question in healthcare refill operations:

> **"Why is this refill stuck, who needs to act, and how do we get it resolved?"**

---

## System Architecture

```text
                    ┌─────────────────────────────────────────┐
                    │       React + Vite Frontend             │
                    │                                         │
                    │  • Operations Dashboard (/dashboard)    │
                    │  • Refill Diagnostic (/refills/:id)     │
                    │  • Clinician Review (/provider)         │
                    │  • Patient Portal (/patient)            │
                    └────────────────────┬────────────────────┘
                                         │
                                         │ REST API (JSON)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │         FastAPI Backend Engine          │
                    └────────────────────┬────────────────────┘
                                         │
             ┌───────────────────────────┼───────────────────────────┐
             │                           │                           │
             ▼                           ▼                           ▼
    Centralized Workflow         AI Triage Engine           Immutable Audit
       State Machine             (Claude + Fallback)            Service
             │                           │                           │
             └───────────────────────────┼───────────────────────────┘
                                         │
                                         ▼
                                  SQLite Database
                                         │
                                         ▼
                               Mock Pharmacy Gateway
                                (SCRIPT / Webhook)
```

---

## State Machine & Valid Transitions

Workflow state transitions are centralized and strictly enforced in backend Python code. Any invalid transition (e.g., attempting to jump directly from `REQUESTED` to `CONFIRMED`) is rejected with HTTP 400.

```text
REQUESTED ─────────► TRIAGED
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
INFO_GATHERING                     PROVIDER_REVIEW
       │                                 │
       └──────────────► TRIAGED          ▼
                                      DECIDED
                                         │
                                         ▼
                                 SENT_TO_PHARMACY
                                         │
                                         ▼
                                     CONFIRMED
                                         │
                                         ▼
                                 PATIENT_NOTIFIED
```

### Transition Matrix
- `REQUESTED → TRIAGED` (AI Triage intake)
- `TRIAGED → INFO_GATHERING` (Missing info requested)
- `TRIAGED → PROVIDER_REVIEW` (Routed to physician)
- `INFO_GATHERING → TRIAGED` (Context acquired)
- `PROVIDER_REVIEW → DECIDED` (Clinician explicit decision)
- `DECIDED → SENT_TO_PHARMACY` (E-script transmission)
- `SENT_TO_PHARMACY → CONFIRMED` (Pharmacy NCPDP acknowledgement)
- `CONFIRMED → PATIENT_NOTIFIED` (Automated loop closure)

---

## Critical AI Safety & Human-in-the-Loop Principle

Refill Resolve strictly enforces the legal and operational separation between **AI assistance** and **Clinical decision-making**.

### What AI MAY Do:
- Classify refill requests and identify workflow blockers
- Extract clinical context (vitals, visit dates, lab history)
- Recommend routing lanes (`AUTO_CLEAR`, `NEEDS_INFO`, `NEEDS_PROVIDER`)
- Generate draft clinical messages and patient notices
- Assign calibrated confidence scores

### What AI MUST NEVER Do:
- Prescribe medication
- Diagnose a patient
- Alter medication dosage
- Independently approve or deny a refill
- Bypass licensed clinician review
- Directly transition any request into an approved clinical state

### The 6 Backend AI Guardrails (Enforced in Python):
1. **Guardrail 1 (No Autonomous Approval):** AI output can never set `provider_decision = APPROVE`.
2. **Guardrail 2 (Confidence Threshold):** If AI confidence score < 0.70, request is strictly routed to `NEEDS_PROVIDER`.
3. **Guardrail 3 (Stale Visit):** If last documented clinic visit is older than 6 months, forced to `NEEDS_PROVIDER`.
4. **Guardrail 4 (Missing Context):** If essential chart vitals or labs are missing/stale, routed to `NEEDS_INFO`.
5. **Guardrail 5 (Clinical Flags):** If clinical safety flag is active, forced to `NEEDS_PROVIDER`.
6. **Guardrail 6 (AUTO_CLEAR Restrictions):** `AUTO_CLEAR` lane is strictly restricted to stable chronic medications with recent normal vitals, no clinical flags, and confidence &ge; 0.70. Even in `AUTO_CLEAR`, explicit provider sign-off is mandatory.

---

## Resilient AI Provider Abstraction & Fallback Mode

Refill Resolve supports:
1. **Anthropic Claude 3.5 Sonnet API:** Structured JSON prompts when `ANTHROPIC_API_KEY` is provided.
2. **Deterministic Clinical Rule Engine (Fallback):** If API keys are missing, network timeouts occur, or malformed JSON is returned, the system automatically falls back to deterministic healthcare rules. The platform remains 100% operational with safe fallback reasoning clearly marked in the UI.

---

## The Primary 2-Minute Demo Flow (Sarah Miller)

The entire application supports this end-to-end workflow without any code modifications:

1. **Open Dashboard (`/dashboard`):**
   - View top 5 KPI cards (Active Refills: 6, Needs Provider: 4, Needs Info: 2, Resolved Today: 2, Avg Time: 2h 18m).
   - Locate **Sarah Miller (Lisinopril 10 mg)** in the "Ready for Provider" queue.
2. **Open Sarah Miller Diagnostic (`/refills/REF-1042`):**
   - Hero card displays: **WHY IS THIS REFILL STUCK?**
   - Blocker: *"No refills remain on active prescription."*
   - Responsible Party: *"Dr. Rao"*; Action: *"Provider authorization"*; AI Confidence: *"96%"*.
   - View AI Assessment Panel marked with: `AI RECOMMENDATION — NOT A CLINICAL DECISION`.
3. **Practice Staff Routes Refill:**
   - Click primary CTA: **[ SEND TO PROVIDER ]**.
   - State updates to `PROVIDER_REVIEW`.
4. **Switch to Clinician Review (`/provider` / `/provider/refills/REF-1042`):**
   - Dr. Rao sees focused clinical context: BP 128/82, HR 72, last visit May 14, 2026.
   - Provider clicks **[ APPROVE REFILL ]**.
   - Confirmation dialog verifies human-in-the-loop sign-off.
5. **Automated Verification Loop:**
   - Provider decision recorded (`DECIDED`).
   - E-script sent to mock pharmacy (`SENT_TO_PHARMACY`).
   - Pharmacy verifies and confirms (`CONFIRMED`).
   - Automated notification dispatched (`PATIENT_NOTIFIED`).
6. **Inspect Patient Safe Portal (`/patient/PT-1042`):**
   - Patient view displays: *"✓ Refill confirmed. Your pharmacy (Walgreens #4120) has received the refill authorization."*
   - Strictly shields internal AI confidence, triage lanes, and staff notes.
7. **Inspect Immutable Audit Timeline:**
   - View complete 7-step append-only timeline with timestamps, actors, and state transitions.

---

## Local Setup & Quickstart

### Prerequisites
- Python 3.10+ (tested with Python 3.13)
- Node.js 18+ and npm (tested with Node v22.17)

### 1. Backend Setup
```bash
cd backend

# (Optional) Create virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed SQLite database with 8 demo records
python seed.py

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be live at `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend application will be live at `http://localhost:3000` (or `http://localhost:5173`).

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health status for all sub-services |
| `GET` | `/refills/metrics` | Top 5 KPI operations statistics |
| `GET` | `/refills` | List all refill requests with optional lane/state filters |
| `GET` | `/refills/{id}` | Detailed refill diagnostic and context |
| `POST` | `/refills` | Create new refill intake and run AI triage |
| `POST` | `/refills/{id}/triage` | Re-run AI triage diagnostic |
| `POST` | `/refills/{id}/send-to-provider` | Route refill from staff to clinician queue |
| `POST` | `/refills/{id}/decision` | Record provider decision (`APPROVE`, `DENY`, `NEEDS_VISIT`) |
| `POST` | `/refills/{id}/request-info` | Request missing patient vitals or lab records |
| `POST` | `/refills/{id}/send-to-pharmacy` | Dispatch prescription to mock pharmacy gateway |
| `GET` | `/refills/{id}/timeline` | Append-only audit trail for refill |
| `GET` | `/patient/status/{patient_id}` | Patient-safe status lookup (shields internal AI metadata) |
| `POST` | `/mock/pharmacy/notify` | Outbound electronic pharmacy transmission |
| `POST` | `/mock/pharmacy/webhook` | Inbound pharmacy dispense confirmation callback |

---

## Production Roadmap vs Implemented MVP

### Implemented MVP (Current):
- Centralized workflow state machine with guardrails
- AI Triage service with Claude 3.5 Sonnet & Deterministic Fallback
- Append-only audit trail logging every actor, timestamp, and state delta
- Mock NCPDP SCRIPT e-prescribing gateway and confirmation webhooks
- Practice staff dashboard, clinician review console, and patient portal
- Realistic 8-patient demo suite with Sarah Miller hero scenario

### Future Production Architecture:
- **Standards & Protocols:** HL7 FHIR US Core profiles (`MedicationRequest`, `Patient`, `Observation`)
- **E-Prescribing Networks:** Surescripts integration for real-time script routing and census validation
- **PBM / Insurance Gateways:** Real-time Benefit Check (RTBC) and electronic Prior Authorization (ePA)
- **EHR Integrations:** Epic FHIR App Orchard, Cerner SMART on FHIR launch flows
- **Identity & Compliance:** SAML 2.0 / OAuth2 SSO, role-based access control (RBAC), HIPAA BAA-compliant encrypted data at rest (AES-256) and in transit (TLS 1.3).

---

## What Not To Build (Explicit Hackathon Scope)

To ensure maximum focus on the end-to-end user experience and safety architecture, this MVP deliberately excludes unnecessary infrastructure:
- Autonomous diagnosis or uncontrolled prescribing agents
- Heavyweight microservices or distributed event brokers
- Production SMS gateways (clean in-app portal notifications used instead)
- Giant enterprise administrative portals

---

## License & Credits

Built for the Healthcare Refill Hackathon.  
**REFILL RESOLVE** — *From stuck refill to resolved refill.*
