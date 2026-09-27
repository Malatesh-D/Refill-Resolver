const API_BASE = 'http://127.0.0.1:8000';

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
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
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
