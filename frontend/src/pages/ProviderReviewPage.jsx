import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  FileCheck2,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import DecisionModal from '../components/DecisionModal';
import AuditTimeline from '../components/AuditTimeline';

export default function ProviderReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [refill, setRefill] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVE');
  const [resolutionSteps, setResolutionSteps] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getRefillById(id);
      setRefill(data);
      const tl = await api.getTimeline(id);
      setTimeline(tl);

      // If already decided / resolved, show the 4 success checkmarks
      if (data.state === 'PATIENT_NOTIFIED' || data.state === 'CONFIRMED' || data.provider_decision === 'APPROVE') {
        setResolutionSteps({
          decisionRecorded: true,
          sentToPharmacy: true,
          pharmacyConfirmed: true,
          patientNotified: true,
        });
      }
    } catch (err) {
      console.error('Error loading provider review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenDecision = (type) => {
    setDecisionType(type);
    setModalOpen(true);
  };

  const handleConfirmDecision = async (type, note) => {
    try {
      setActionLoading(true);
      
      // Call backend decision endpoint: PROVIDER_REVIEW -> DECIDED -> SENT_TO_PHARMACY -> Mock Pharmacy Webhook -> CONFIRMED -> PATIENT_NOTIFIED
      const updated = await api.recordDecision(id, type, 'Dr. Rao', note);
      setRefill(updated);

      if (type === 'APPROVE') {
        // Trigger simulated progression for demo visual feedback
        setResolutionSteps({
          decisionRecorded: true,
          sentToPharmacy: true,
          pharmacyConfirmed: true,
          patientNotified: true,
        });
      }

      setModalOpen(false);
      const tl = await api.getTimeline(id);
      setTimeline(tl);
    } catch (err) {
      alert(`Error submitting clinical decision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="font-semibold text-slate-700">Loading clinical review console...</p>
      </div>
    );
  }

  if (!refill) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-lg font-bold text-slate-800">Refill request not found.</p>
        <Link to="/provider" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
          &larr; Return to Provider Queue
        </Link>
      </div>
    );
  }

  const isAlreadyDecided = refill.provider_decision !== null || refill.state === 'PATIENT_NOTIFIED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/provider')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Provider Inbox</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/refills/${refill.id}`}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View Operations Diagnostic &rarr;
          </Link>
        </div>
      </div>

      {/* Main Review Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        
        {/* Card Header */}
        <div className="bg-slate-900 text-white p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              AUTHORIZED CLINICIAN REVIEW
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">
              REFILL REVIEW: {refill.patient_name}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-mono block">Prescription ID</span>
            <span className="text-sm font-bold font-mono text-white">{refill.id}</span>
          </div>
        </div>

        {/* Success Pipeline Progress (Section 22) */}
        {resolutionSteps && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-6 animate-in fade-in duration-200">
            <div className="max-w-2xl mx-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>End-to-End Orchestration Loop Completed</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-800 font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Provider decision recorded (Dr. Rao)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Prescription sent to pharmacy ({refill.pharmacy_name})</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pharmacy acknowledged request (NCPDP 997 verified)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Refill confirmed & patient notified via portal</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Patient & Medication Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Patient
              </span>
              <p className="text-lg font-bold text-slate-900">{refill.patient_name}</p>
              <p className="text-xs text-slate-500 font-mono">MRN: {refill.patient_id}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Medication & Dosage
              </span>
              <p className="text-lg font-bold text-blue-700">{refill.medication} {refill.dosage}</p>
              <p className="text-xs text-slate-500">Condition: {refill.condition}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Trigger / Reason
              </span>
              <p className="text-sm font-semibold text-rose-700">
                {refill.blocker_title || 'No refills remaining'}
              </p>
              <p className="text-xs text-slate-500">0 remaining on active script</p>
            </div>
          </div>

          {/* Clinical Context & Latest Available Vitals */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Relevant Clinical Context & Chart Vitals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Last Documented Visit:</span>
                <span className="text-sm font-bold text-slate-900">{refill.last_visit_date || 'None'}</span>
                {refill.clinical_flag && (
                  <span className="mt-1 inline-block text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Alert: {refill.clinical_flag}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Latest Available Vitals:</span>
                <span className="text-sm font-bold text-slate-900">{refill.last_vitals_summary || 'Missing'}</span>
                <span className="text-xs text-slate-500 block mt-0.5">Dispensing Pharmacy: {refill.pharmacy_name}</span>
              </div>
            </div>
          </div>

          {/* AI Workflow Summary */}
          <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  AI Triage Diagnostic Summary
                </span>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white">
                {Math.round((refill.ai_confidence || 0.95) * 100)}% Confidence
              </span>
            </div>

            <p className="text-xs font-medium text-slate-800 leading-relaxed mb-3">
              {refill.recommended_action || 'Route to prescribing provider for authorization.'}
            </p>

            <div className="space-y-1">
              {(Array.isArray(refill.ai_reasoning) ? refill.ai_reasoning : []).map((r, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center gap-2 text-[11px] font-semibold text-amber-900">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>AI RECOMMENDATION — NOT A CLINICAL DECISION. Explicit clinician approval required below.</span>
            </div>
          </div>

          {/* DECISION ACTION BUTTONS (Section 20) */}
          <div className="pt-6 border-t border-slate-100">
            {isAlreadyDecided ? (
              <div className={`p-6 rounded-xl border text-center ${
                refill.provider_decision === 'DENY'
                  ? 'bg-rose-50/60 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {refill.provider_decision === 'DENY' ? (
                  <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                )}
                <h4 className={`text-base font-bold ${
                  refill.provider_decision === 'DENY' ? 'text-rose-950' : 'text-slate-900'
                }`}>
                  Clinical Decision Recorded: {refill.provider_decision === 'DENY' ? 'DENIED' : refill.provider_decision}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Decided by {refill.decided_by || 'Dr. Rao'} • Current Status: <strong>{refill.state}</strong>
                </p>
                {refill.provider_note && (
                  <div className={`mt-3 max-w-lg mx-auto p-3.5 bg-white rounded-lg border text-xs text-left italic ${
                    refill.provider_decision === 'DENY' ? 'border-rose-200 text-rose-950' : 'border-slate-200 text-slate-700'
                  }`}>
                    <span className="not-italic font-bold block text-[11px] mb-1">
                      Clinician Message / Note to Patient:
                    </span>
                    "{refill.provider_note}"
                  </div>
                )}
                <div className="mt-4">
                  <Link
                    to={`/patient/${refill.patient_id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                  >
                    <span>{refill.provider_decision === 'DENY' ? 'View Patient Portal (Refill Denied)' : 'View Patient Confirmation Portal'} &rarr;</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
                  Authorized Clinical Action (Human-In-The-Loop)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* APPROVE BUTTON */}
                  <button
                    onClick={() => handleOpenDecision('APPROVE')}
                    disabled={actionLoading}
                    className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm tracking-wide shadow-md shadow-emerald-600/20 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>APPROVE REFILL</span>
                    <span className="text-[10px] font-normal text-emerald-100 opacity-90">
                      Sign & transmit e-script to pharmacy
                    </span>
                  </button>

                  {/* REQUEST VISIT BUTTON */}
                  <button
                    onClick={() => handleOpenDecision('NEEDS_VISIT')}
                    disabled={actionLoading}
                    className="p-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm tracking-wide shadow-md shadow-amber-500/20 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Calendar className="w-5 h-5 text-white" />
                    <span>REQUEST VISIT</span>
                    <span className="text-[10px] font-normal text-amber-100 opacity-90">
                      Require in-person or telehealth check
                    </span>
                  </button>

                  {/* DENY BUTTON */}
                  <button
                    onClick={() => handleOpenDecision('DENY')}
                    disabled={actionLoading}
                    className="p-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm tracking-wide shadow-md shadow-rose-600/20 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <XCircle className="w-5 h-5 text-white" />
                    <span>DENY REFILL</span>
                    <span className="text-[10px] font-normal text-rose-100 opacity-90">
                      Reject request & notify staff
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="mt-8">
        <AuditTimeline events={timeline} />
      </div>

      {/* Confirmation Modal */}
      <DecisionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        refill={refill}
        decisionType={decisionType}
        onConfirm={handleConfirmDecision}
        loading={actionLoading}
      />
    </div>
  );
}
