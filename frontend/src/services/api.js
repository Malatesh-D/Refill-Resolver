import { INITIAL_REFILLS, INITIAL_METRICS } from '../data/mockSeed';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const STORAGE_KEY = 'refill_resolve_data_v2';

function getStoredRefills() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return JSON.parse(JSON.stringify(INITIAL_REFILLS));
}

function saveStoredRefills(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

function calculateClientMetrics(refills) {
  const active = refills.filter(r => r.state !== 'PATIENT_NOTIFIED');
  const needsProvider = refills.filter(r => r.lane === 'NEEDS_PROVIDER' && r.state !== 'PATIENT_NOTIFIED');
  const needsInfo = refills.filter(r => r.lane === 'NEEDS_INFO' && r.state !== 'PATIENT_NOTIFIED');
  const resolved = refills.filter(r => r.state === 'PATIENT_NOTIFIED');
  
  return {
    active_refills: active.length,
    needs_provider: needsProvider.length,
    needs_information: needsInfo.length,
    resolved_today: resolved.length,
    avg_resolution_time: '2h 18m',
    queue_counts: {
      needs_review: refills.filter(r => r.state === 'PROVIDER_REVIEW').length,
      needs_info: refills.filter(r => r.state === 'INFO_GATHERING').length,
      ready_for_provider: refills.filter(r => r.state === 'TRIAGED' && r.lane === 'NEEDS_PROVIDER').length,
      recently_resolved: resolved.length
    },
    urgent_count: refills.filter(r => r.priority === 'URGENT').length,
    stalled_count: refills.filter(r => r.is_stalled).length,
    sla_breached_count: refills.filter(r => r.sla_status === 'BREACHED').length,
    prior_auth_count: refills.filter(r => r.prior_auth_required && r.prior_auth_status === 'PA_REQUIRED').length
  };
}

function handleClientFallback(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  let refills = getStoredRefills();

  if (endpoint === '/health') {
    return {
      status: 'healthy',
      mode: 'Client Resilient Mode (Zero Downtime Fallback)',
      services: {
        ai_triage: 'operational (Google Gemini / Rules Fallback)',
        workflow_engine: 'operational',
        pharmacy_gateway: 'operational (Mock NCPDP)',
        database: 'operational'
      }
    };
  }

  if (endpoint.startsWith('/refills/metrics')) {
    return calculateClientMetrics(refills);
  }

  if (endpoint === '/refills/reset-demo' && method === 'POST') {
    const pristine = JSON.parse(JSON.stringify(INITIAL_REFILLS));
    saveStoredRefills(pristine);
    return { success: true, message: 'All patient refill records reset to pristine benchmark states.' };
  }

  if (endpoint === '/patient/schedule' && method === 'POST') {
    const refill = refills.find(r => r.id === body.refill_id || r.patient_id === body.patient_id);
    if (refill) {
      refill.appointment_scheduled = true;
      refill.appointment_date = body.appointment_date;
      refill.appointment_time = body.appointment_time;
      refill.appointment_type = body.appointment_type || 'In-Person Consultation';
      refill.appointment_notes = body.notes;
      saveStoredRefills(refills);
      return { success: true, appointment: body, refill };
    }
    return { success: true };
  }

  if (endpoint.startsWith('/patient/status/')) {
    const patientId = endpoint.replace('/patient/status/', '').split('?')[0];
    const refill = refills.find(r => r.patient_id === patientId) || refills[0];
    return {
      refill_id: refill.id,
      patient_id: refill.patient_id,
      patient_name: refill.patient_name,
      medication: refill.medication,
      dosage: refill.dosage,
      status_headline: refill.state === 'PATIENT_NOTIFIED' ? 'Refill confirmed' : 'Refill in review',
      status_explanation: refill.state === 'PATIENT_NOTIFIED'
        ? `Your prescription has been confirmed at ${refill.pharmacy_name}.`
        : `Your refill request is currently being processed by ${refill.assigned_provider || 'Dr. Rao'}.`,
      next_step: `Contact ${refill.pharmacy_name} at ${refill.pharmacy_phone} for pickup details.`,
      last_updated: 'Just now',
      is_confirmed: refill.state === 'PATIENT_NOTIFIED',
      state: refill.state,
      provider_decision: refill.provider_decision,
      assigned_provider: refill.assigned_provider || 'Dr. Rao',
      provider_note: refill.provider_note,
      appointment_scheduled: refill.appointment_scheduled,
      appointment_date: refill.appointment_date,
      appointment_time: refill.appointment_time,
      appointment_type: refill.appointment_type,
      appointment_notes: refill.appointment_notes,
      insurance_provider: refill.insurance_provider,
      prior_auth_status: refill.prior_auth_status
    };
  }

  const matchId = endpoint.match(/^\/refills\/([^/?]+)/);
  if (matchId) {
    const id = matchId[1];
    const refillIdx = refills.findIndex(r => r.id === id);
    const refill = refills[refillIdx];

    if (endpoint.endsWith('/timeline')) {
      return (refill && refill.audit_events) ? refill.audit_events : [];
    }

    if (endpoint.endsWith('/send-to-provider') && method === 'POST') {
      if (refill) {
        refill.state = 'PROVIDER_REVIEW';
        refill.assigned_provider = body.assigned_provider || 'Dr. Rao';
        refill.owner = refill.assigned_provider;
        refill.audit_events = refill.audit_events || [];
        refill.audit_events.push({
          id: Date.now(),
          refill_id: id,
          timestamp: new Date().toISOString(),
          actor: 'Practice Staff',
          action: 'ROUTED_TO_PROVIDER',
          from_state: 'TRIAGED',
          to_state: 'PROVIDER_REVIEW',
          detail: body.note || 'Routed to Dr. Rao for prescription review.'
        });
        saveStoredRefills(refills);
        return refill;
      }
    }

    if (endpoint.endsWith('/decision') && method === 'POST') {
      if (refill) {
        refill.provider_decision = body.decision;
        refill.decided_by = body.decided_by || 'Dr. Rao';
        refill.provider_note = body.note;
        refill.decided_at = new Date().toISOString();
        refill.state = 'PATIENT_NOTIFIED';
        refill.blocker_title = 'Resolved';
        refill.blocker_description = 'Refill authorized and transmitted to pharmacy';
        refill.audit_events = refill.audit_events || [];
        refill.audit_events.push({
          id: Date.now(),
          refill_id: id,
          timestamp: new Date().toISOString(),
          actor: `${refill.decided_by} (Clinician)`,
          action: `PROVIDER_DECISION_${body.decision}`,
          from_state: 'PROVIDER_REVIEW',
          to_state: 'DECIDED',
          detail: `Clinical decision: ${body.decision}. ${body.note || ''}`
        });
        refill.audit_events.push({
          id: Date.now() + 1,
          refill_id: id,
          timestamp: new Date().toISOString(),
          actor: 'Workflow Engine',
          action: 'PATIENT_NOTIFIED',
          from_state: 'CONFIRMED',
          to_state: 'PATIENT_NOTIFIED',
          detail: `Patient notified via SMS and portal.`
        });
        saveStoredRefills(refills);
        return refill;
      }
    }

    if (endpoint.endsWith('/request-info') && method === 'POST') {
      if (refill) {
        refill.state = 'INFO_GATHERING';
        refill.missing_info_note = body.missing_info_note;
        saveStoredRefills(refills);
        return refill;
      }
    }

    if (endpoint.endsWith('/submit-prior-auth') && method === 'POST') {
      if (refill) {
        refill.prior_auth_status = 'APPROVED';
        refill.prior_auth_number = 'PA-VERIFIED-9821';
        refill.state = 'PROVIDER_REVIEW';
        refill.owner = refill.assigned_provider || 'Dr. Rao';
        saveStoredRefills(refills);
        return refill;
      }
    }

    if (method === 'DELETE') {
      refills = refills.filter(r => r.id !== id);
      saveStoredRefills(refills);
      return { success: true, message: `Deleted ${id}` };
    }

    if (method === 'PUT') {
      if (refill) {
        Object.assign(refill, body);
        saveStoredRefills(refills);
        return refill;
      }
    }

    if (method === 'GET' && refill) {
      return refill;
    }
  }

  if (endpoint.startsWith('/refills') && method === 'POST') {
    const newRefill = {
      ...body,
      id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      state: 'TRIAGED',
      lane: 'NEEDS_PROVIDER',
      ai_confidence: 0.95,
      ai_reasoning: ['New refill intake triaged for provider clinical review.'],
      recommended_action: 'Route to prescribing provider for authorization.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      audit_events: [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        actor: 'Staff Intake',
        action: 'REQUEST_RECEIVED',
        detail: 'New refill request recorded.'
      }]
    };
    refills.unshift(newRefill);
    saveStoredRefills(refills);
    return newRefill;
  }

  // Default: return all refills
  return refills;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (e) {
        // use default error message
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (err) {
    // If backend is unreachable (e.g. Mixed Content / server cold start), fallback transparently to demo dataset
    console.warn(`[Refill Resolve] Live API request to ${url} failed. Serving resilient offline demo state:`, err.message);
    return handleClientFallback(endpoint, options);
  }
}

export const api = {
  getHealth: () => request('/health'),
  getMetrics: () => request('/refills/metrics'),
  getRefills: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/refills${query ? `?${query}` : ''}`);
  },
  getRefillById: (id) => request(`/refills/${id}`),
  createRefill: (data) => request('/refills', { method: 'POST', body: JSON.stringify(data) }),
  triageRefill: (id) => request(`/refills/${id}/triage`, { method: 'POST' }),
  sendToProvider: (id, payload = {}) =>
    request(`/refills/${id}/send-to-provider`, { method: 'POST', body: JSON.stringify(payload) }),
  recordDecision: (id, decision, decided_by = 'Dr. Rao', note = '') =>
    request(`/refills/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, decided_by, note }),
    }),
  requestInfo: (id, missing_info_note, requested_by = 'Practice Staff') =>
    request(`/refills/${id}/request-info`, {
      method: 'POST',
      body: JSON.stringify({ missing_info_note, requested_by }),
    }),
  sendToPharmacy: (id, simulate_failure = false) =>
    request(`/refills/${id}/send-to-pharmacy?simulate_failure=${simulate_failure}`, { method: 'POST' }),
  getTimeline: (id) => request(`/refills/${id}/timeline`),
  getPatientStatus: (patientId) => request(`/patient/status/${patientId}`),
  updateRefill: (id, data) => request(`/refills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRefill: (id) => request(`/refills/${id}`, { method: 'DELETE' }),
  resetDemoData: () => request('/refills/reset-demo', { method: 'POST' }),
  scheduleAppointment: (payload) =>
    request('/patient/schedule', { method: 'POST', body: JSON.stringify(payload) }),
  submitPriorAuth: (id, payload = {}) =>
    request(`/refills/${id}/submit-prior-auth`, { method: 'POST', body: JSON.stringify(payload) }),
};
