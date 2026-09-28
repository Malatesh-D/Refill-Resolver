import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  HeartPulse,
  Pill,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Send,
  RefreshCw,
  HelpCircle,
  Stethoscope,
  Sparkles,
  Phone,
  Edit3,
  Trash2,
  XCircle,
  ArrowRight,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import HeroBlockerCard from '../components/HeroBlockerCard';
import AIAssessmentPanel from '../components/AIAssessmentPanel';
import AuditTimeline from '../components/AuditTimeline';
import DecisionModal from '../components/DecisionModal';
import EditPatientModal from '../components/EditPatientModal';

export default function RefillDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [refill, setRefill] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVE');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoNote, setInfoNote] = useState('');
  const [notificationBanner, setNotificationBanner] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getRefillById(id);
      setRefill(data);
      const tl = await api.getTimeline(id);
      setTimeline(tl);
    } catch (err) {
      console.error('Error loading refill detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Primary CTA: Send to Provider
  const handleSendToProvider = async () => {
    try {
      setActionLoading(true);
      await api.sendToProvider(id, {
        assigned_provider: refill.assigned_provider || 'Dr. Rao',
        note: `Practice staff verified blocker; routed to ${refill.assigned_provider || 'Dr. Rao'} for prescription authorization.`
      });
      setNotificationBanner({
        type: 'success',
        text: `Refill routed to ${refill.assigned_provider || 'Dr. Rao'}. State is now PROVIDER_REVIEW.`
      });
      await loadData();
    } catch (err) {
      alert(`Error routing to provider: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Request Information
  const handleRequestInfoSubmit = async (e) => {
    e.preventDefault();
    if (!infoNote.trim()) return;
    try {
      setActionLoading(true);
      await api.requestInfo(id, infoNote);
      setInfoModalOpen(false);
      setInfoNote('');
      setNotificationBanner({
        type: 'info',
        text: 'Information request queued. State is now INFO_GATHERING.'
      });
      await loadData();
    } catch (err) {
      alert(`Error requesting info: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Provider Decision
  const handleConfirmDecision = async (decType, note) => {
    try {
      setActionLoading(true);
      const updated = await api.recordDecision(id, decType, refill.assigned_provider || 'Dr. Rao', note);
      setShowDecisionModal(false);
      const isApproved = decType === 'APPROVE';
      const isDenied = decType === 'DENY';
      setNotificationBanner({
        type: isApproved ? 'success' : isDenied ? 'error' : 'info',
        text: isApproved
          ? 'Provider decision [APPROVE] recorded! Electronic prescription authorized and sent to pharmacy.'
          : isDenied
          ? 'Provider decision [DENY] recorded. Prescription renewal not authorized; patient notified.'
          : 'Provider decision [NEEDS_VISIT] recorded. Office consultation requested from patient.'
      });
      await loadData();
    } catch (err) {
      alert(`Error recording decision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Refill Request
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete this refill request for ${refill.patient_name}? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await api.deleteRefill(id);
      navigate('/dashboard');
    } catch (err) {
      alert(`Failed to delete refill request: ${err.message}`);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="font-semibold text-slate-700">Loading refill diagnostic...</p>
      </div>
    );
  }

  if (!refill) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-lg font-bold text-slate-800">Refill request not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button and quick breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Queue</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Patient Info</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete</span>
          </button>

          {refill.state === 'PROVIDER_REVIEW' && (
            <Link
              to={`/provider/refills/${refill.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Switch to Clinician Review View</span>
            </Link>
          )}

          <Link
            to={`/patient/${refill.patient_id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Switch to Patient Safe View</span>
          </Link>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationBanner && (
        <div className={`p-4 rounded-xl mb-6 flex items-center justify-between text-xs font-semibold ${
          notificationBanner.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notificationBanner.text}</span>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Appointment Scheduled Alert Banner */}
      {refill.appointment_scheduled && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950 font-semibold shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-emerald-900 block">
                Patient Scheduled Consultation with {refill.assigned_provider || 'Dr. Rao'}
              </span>
              <span className="text-emerald-800 text-[11px]">
                {refill.appointment_type} • <strong>{refill.appointment_date}</strong> at <strong>{refill.appointment_time}</strong>
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
            Refill Linked to Visit
          </span>
        </div>
      )}

      {/* Clinician Decision & Note Alert if already decided */}
      {refill.provider_decision && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl mb-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-extrabold text-sm text-emerald-950 block">
                  Clinician Decision Recorded: {refill.provider_decision} by {refill.decided_by || 'Dr. Rao'}
                </span>
                {refill.provider_note && (
                  <p className="mt-1 text-xs text-emerald-900 font-medium italic">
                    <span className="font-bold not-italic text-emerald-950">Note to Patient: </span>
                    "{refill.provider_note}"
                  </p>
                )}
              </div>
            </div>
            <Link
              to={`/patient/${refill.patient_id}`}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs whitespace-nowrap"
            >
              Verify Patient View &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* HERO COMPONENT: WHY IS THIS REFILL STUCK? */}
      <HeroBlockerCard
        refill={refill}
        onSendToProvider={handleSendToProvider}
        onRequestInfo={() => setInfoModalOpen(true)}
        onOpenDecisionModal={(type = 'APPROVE') => {
          setDecisionType(type);
          setShowDecisionModal(true);
        }}
        loading={actionLoading}
      />

      {/* Two Column Layout: Clinical Context & AI Assessment vs Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Patient Context, Medication, Clinical Details, AI Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Patient & Medication Context Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                CLINICAL & PHARMACY CONTEXT
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Update Vitals / Details</span>
                </button>
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  Source: EHR & SCRIPT Gateway
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Patient Profile */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Patient Identity
                </span>
                <div className="space-y-1">
                  <div className="text-base font-extrabold text-slate-900">
                    {refill.patient_name}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    MRN / ID: <span className="font-semibold text-slate-900">{refill.patient_id}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Channel: <span className="font-medium text-slate-800">{refill.request_channel}</span>
                  </div>
                </div>
              </div>

              {/* Medication Details */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Prescription Details
                </span>
                <div className="space-y-1">
                  <div className="text-base font-extrabold text-blue-700">
                    {refill.medication} {refill.dosage}
                  </div>
                  <div className="text-xs text-slate-600">
                    Indication: <span className="font-medium text-slate-800">{refill.condition}</span>
                  </div>
                  <div className="text-xs text-rose-600 font-bold">
                    Refills Remaining: {refill.refills_remaining} (EXPIRED)
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Context / Vitals */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Clinical Context & Chart Vitals
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Last Office Visit:</span>
                  <span className="text-xs font-bold text-slate-900">{refill.last_visit_date || 'None on file'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Latest Available Vitals:</span>
                  <span className="text-xs font-bold text-slate-900">{refill.last_vitals_summary || 'Missing'}</span>
                </div>
              </div>

              {/* Strict Medical Disclaimer from Section 18 */}
              <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 bg-slate-100/70 p-2.5 rounded border border-slate-200 italic">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  Clinical information shown here is contextual information for authorized provider review. The software does not independently determine whether medication should be prescribed.
                </span>
              </div>
            </div>

            {/* Pharmacy Information */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-slate-800">{refill.pharmacy_name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{refill.pharmacy_phone}</span>
              </div>
            </div>

            {/* Insurance Payer & Pharmacy Billing Details */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Insurance Payer & Billing Adjudication
                </span>
                {refill.prior_auth_status === 'PA_REQUIRED' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                    Prior Auth Required (Reject 75)
                  </span>
                ) : refill.prior_auth_status === 'APPROVED' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PA Approved (#{refill.prior_auth_number || 'PA-AUTH-9921'})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    Standard Payer Copay
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payer / Plan</span>
                  <span className="font-bold text-slate-900">{refill.insurance_provider || 'Commercial Health Plan'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Member ID / Group</span>
                  <span className="font-mono font-semibold text-slate-800">{refill.insurance_id || 'ID-992144'} • {refill.insurance_group || 'GRP-01'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rx Routing (BIN / PCN)</span>
                  <span className="font-mono font-semibold text-slate-800">BIN {refill.rx_bin || '004336'} / PCN {refill.rx_pcn || 'ADV'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Electronic Prior Authorization (ePA) Action Card if PA Required */}
          {refill.prior_auth_status === 'PA_REQUIRED' && (
            <div className="bg-amber-50/80 rounded-xl border-2 border-amber-400/80 shadow-xs p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    ePA
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      ELECTRONIC PRIOR AUTHORIZATION (ePA) REQUIRED
                    </h3>
                    <p className="text-xs text-amber-800">
                      Payer ({refill.insurance_provider}) requires electronic clinical documentation before dispensing.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-200 text-amber-900 font-mono text-[11px] font-bold border border-amber-300">
                  NCPDP Reject 75
                </span>
              </div>

              <div className="bg-white p-4 rounded-lg border border-amber-200 mb-4 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-slate-900">Clinical Justification Checklist:</div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Step-therapy verification: Documented prior trial of Metformin on file.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Recent diagnostic lab: HbA1c 7.6% confirmed within past 90 days.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>NCPDP ePA 2017071 standard payload prepared via CoverMyMeds gateway.</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    setActionLoading(true);
                    await api.submitPriorAuth(refill.id, {
                      clinical_notes: 'Metformin trial verified; HbA1c 7.6% attached.',
                      step_therapy_confirmed: true
                    });
                    setNotificationBanner({
                      type: 'success',
                      text: `Electronic Prior Authorization submitted & approved by ${refill.insurance_provider}! Routed to Dr. Rao for prescription sign-off.`
                    });
                    await loadData();
                  } catch (err) {
                    alert(`Error submitting ePA: ${err.message}`);
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold tracking-wide shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>SUBMIT ELECTRONIC PRIOR AUTH (ePA) NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI Assessment Panel */}
          <AIAssessmentPanel refill={refill} />

          {/* Clinician Action Section when in PROVIDER_REVIEW */}
          {refill.state === 'PROVIDER_REVIEW' && (
            <div className="bg-white rounded-xl border-2 border-emerald-500/30 shadow-xs p-6">
              <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      AUTHORIZED CLINICIAN ACTION ({refill.assigned_provider || 'DR. ANITA RAO'})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Prescriptive authority remains with the licensed clinician. Choose an authorized action:
                    </p>
                  </div>
                </div>
                <Link
                  to={`/provider/refills/${refill.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  <span>Open Full Provider Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setDecisionType('APPROVE');
                    setShowDecisionModal(true);
                  }}
                  disabled={actionLoading}
                  className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-sm shadow-emerald-600/20 flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>APPROVE REFILL</span>
                  <span className="text-[10px] font-normal text-emerald-100 opacity-90">
                    Sign & transmit to pharmacy
                  </span>
                </button>

                <button
                  onClick={() => {
                    setDecisionType('NEEDS_VISIT');
                    setShowDecisionModal(true);
                  }}
                  disabled={actionLoading}
                  className="p-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs tracking-wide shadow-sm shadow-amber-500/20 flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>REQUEST VISIT</span>
                  <span className="text-[10px] font-normal text-amber-100 opacity-90">
                    Require clinical visit first
                  </span>
                </button>

                <button
                  onClick={() => {
                    setDecisionType('DENY');
                    setShowDecisionModal(true);
                  }}
                  disabled={actionLoading}
                  className="p-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide shadow-sm shadow-rose-600/20 flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>DENY REFILL</span>
                  <span className="text-[10px] font-normal text-rose-100 opacity-90">
                    Reject & record reason
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Clinician Decision Recorded Banner */}
          {refill.provider_decision && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">
                    Clinical Decision Recorded: {refill.provider_decision}
                  </span>
                  <span className="text-xs text-slate-500">
                    Authorized by {refill.decided_by || 'Dr. Rao'} • Current Status: <strong>{refill.state}</strong>
                  </span>
                </div>
              </div>
              <Link
                to={`/patient/${refill.patient_id}`}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shrink-0"
              >
                Track Patient View &rarr;
              </Link>
            </div>
          )}

        </div>

        {/* Right Column (1 Col): Append-Only Vertical Audit Timeline */}
        <div className="lg:col-span-1">
          <AuditTimeline events={timeline} />
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      <DecisionModal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        refill={refill}
        decisionType={decisionType}
        onConfirm={handleConfirmDecision}
        loading={actionLoading}
      />

      {/* Request Information Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Request Missing Information</h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify what data is required before provider review (e.g. updated blood pressure reading, recent lab results).
            </p>
            <form onSubmit={handleRequestInfoSubmit}>
              <textarea
                value={infoNote}
                onChange={(e) => setInfoNote(e.target.value)}
                placeholder="e.g. Patient needs to provide home blood pressure log or recent lab confirmation."
                rows={3}
                required
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInfoModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Confirm Information Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Info Modal */}
      <EditPatientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        refill={refill}
        onUpdated={(updatedRefill) => {
          setRefill(updatedRefill);
          setNotificationBanner({
            type: 'success',
            text: `Patient chart context updated for ${updatedRefill.patient_name}.`
          });
          loadData();
        }}
      />
    </div>
  );
}
