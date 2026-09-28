import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  HelpCircle,
  Shield,
  ArrowRight,
  Phone,
  RefreshCw,
  Calendar,
  Stethoscope
} from 'lucide-react';
import { api } from '../services/api';
import AppointmentScheduler from '../components/AppointmentScheduler';

export default function PatientStatusPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [inputPatientId, setInputPatientId] = useState(patientId || 'PT-1042');
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGeneralScheduler, setShowGeneralScheduler] = useState(false);

  const fetchStatus = async (idToQuery) => {
    if (!idToQuery || !idToQuery.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPatientStatus(idToQuery.trim());
      setStatusData(res);
    } catch (err) {
      console.warn('Patient fetch error:', err);
      setError(err.message || 'No refill status found for this patient ID.');
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      setInputPatientId(patientId);
      fetchStatus(patientId);
    } else {
      // Default to PT-1042 for easy demo
      fetchStatus('PT-1042');
    }
  }, [patientId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputPatientId.trim()) {
      navigate(`/patient/${inputPatientId.trim()}`);
      fetchStatus(inputPatientId.trim());
    }
  };

  const handleAppointmentScheduled = (updated) => {
    setStatusData(prev => ({
      ...prev,
      ...updated,
      appointment_scheduled: true,
      appointment_date: updated?.appointment_date || prev?.appointment_date,
      appointment_time: updated?.appointment_time || prev?.appointment_time,
      appointment_type: updated?.appointment_type || prev?.appointment_type,
      status_headline: updated?.status_headline || 'Appointment confirmed',
      status_explanation: updated?.status_explanation || `Your appointment has been scheduled with ${prev?.assigned_provider || 'Dr. Rao'}.`,
      next_step: updated?.next_step || 'A confirmation link has been sent to your portal.',
      last_updated: 'Just now'
    }));
    setShowGeneralScheduler(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Patient Portal Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
          <Shield className="w-3.5 h-3.5" />
          <span>Patient Self-Service Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Prescription Refill
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Transparent, real-time updates directly from your clinical care team and pharmacy.
        </p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={inputPatientId}
              onChange={(e) => setInputPatientId(e.target.value)}
              placeholder="Enter Patient ID (e.g. PT-1042)"
              className="w-full text-sm pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase font-mono font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Lookup Status</span>
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Demo Patient IDs: <strong>PT-1042</strong> (Sarah Miller), <strong>PT-1088</strong>, <strong>PT-1019</strong></span>
          {statusData && (
            <button
              onClick={() => fetchStatus(inputPatientId)}
              className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl mb-8 text-center animate-in fade-in">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="font-bold text-base">Patient Not Found</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <p className="text-[11px] text-slate-500 mt-3">
            Please check your Patient ID card or try looking up <strong>PT-1042</strong>.
          </p>
        </div>
      )}

      {/* Patient Safe Status Card (Section 23) */}
      {statusData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in duration-200">
          
          {/* Status Header Banner */}
          <div className={`p-6 text-white ${
            statusData.is_confirmed
              ? 'bg-emerald-600'
              : statusData.state === 'SENT_TO_PHARMACY'
              ? 'bg-blue-600'
              : 'bg-slate-800'
          }`}>
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/80 block mb-1">
              YOUR REFILL STATUS
            </span>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  {statusData.medication} {statusData.dosage}
                </h2>
                <p className="text-xs text-white/90 mt-0.5">
                  Prescribed for {statusData.patient_name} • ID: {statusData.patient_id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {statusData.is_confirmed ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-emerald-800 text-xs font-black shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    CONFIRMED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30">
                    <Clock className="w-4 h-4 text-amber-300" />
                    IN PROGRESS
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Explanation Body */}
          <div className="p-8 space-y-6">
            
            {/* Primary Status Headline */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {statusData.is_confirmed ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {statusData.status_headline}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {statusData.status_explanation}
                </p>
              </div>
            </div>

            {/* Doctor's Personal Clinical Message to Patient */}
            {statusData.provider_note && (
              <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-xl p-4 text-xs text-emerald-950 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold">
                  <Stethoscope className="w-4 h-4 text-emerald-700" />
                  <span className="text-sm">Personal Note from {statusData.assigned_provider || 'Dr. Rao'} (Prescribing Clinician):</span>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-emerald-200 text-slate-800 text-xs leading-relaxed italic font-medium">
                  "{statusData.provider_note}"
                </div>
                <div className="mt-2 text-[10px] text-emerald-700 font-semibold flex items-center justify-between">
                  <span>✓ Verified Clinical Sign-off</span>
                  <span>Direct Doctor Communication</span>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                What Happens Next?
              </h4>
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-xs text-slate-800 leading-relaxed font-medium">
                {statusData.next_step}
              </div>
            </div>

            {/* Interactive Appointment Scheduling Section */}
            {(statusData.provider_decision === 'NEEDS_VISIT' ||
              (statusData.status_headline || '').toLowerCase().includes('visit') ||
              statusData.appointment_scheduled) && (
              <div className="pt-2">
                <AppointmentScheduler
                  statusData={statusData}
                  onAppointmentScheduled={handleAppointmentScheduled}
                />
              </div>
            )}

            {/* Optional Scheduler for Any Refill */}
            {!(statusData.provider_decision === 'NEEDS_VISIT' ||
              (statusData.status_headline || '').toLowerCase().includes('visit') ||
              statusData.appointment_scheduled) && (
              <div className="pt-2">
                {!showGeneralScheduler ? (
                  <button
                    onClick={() => setShowGeneralScheduler(true)}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Need to consult your doctor? Schedule an appointment with {statusData.assigned_provider || 'Dr. Rao'}</span>
                  </button>
                ) : (
                  <AppointmentScheduler
                    statusData={statusData}
                    onAppointmentScheduled={handleAppointmentScheduled}
                  />
                )}
              </div>
            )}

            {/* Timestamps & Security Notice */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <span>Last updated: <strong className="text-slate-700">{statusData.last_updated}</strong></span>
              <span className="flex items-center gap-1 text-slate-400">
                <Shield className="w-3 h-3 text-emerald-600" />
                Patient Privacy Protected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Patient SMS Channel Simulator */}
      {statusData && (
        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                Live Patient SMS Channel Simulator
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Automated Twilio Dispatch</span>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                RX
              </div>
              <div className="bg-slate-800 text-slate-100 p-3.5 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-lg shadow-xs">
                <p className="font-bold text-blue-400 mb-1">Refill Resolve Clinical Alert</p>
                <p className="text-slate-200">{statusData.status_explanation}</p>
                {statusData.provider_note && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-200 text-[11px] leading-snug">
                    <span className="font-bold text-emerald-400 block text-[10px] uppercase tracking-wider mb-0.5">
                      Note from {statusData.assigned_provider || 'Dr. Rao'}:
                    </span>
                    "{statusData.provider_note}"
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Delivered via SMS • (555) 019-2831</span>
                  <span>{statusData.last_updated || 'Just now'}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Proactive transparency reduces clinic inbound call volume by an estimated 65%.
          </p>
        </div>
      )}
    </div>
  );
}
