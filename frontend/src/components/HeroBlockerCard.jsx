import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  XCircle,
  Clock,
  Send,
  HelpCircle,
  FileText,
  Building2,
  Check
} from 'lucide-react';

export default function HeroBlockerCard({ refill, onSendToProvider, onRequestInfo, onOpenDecisionModal, loading }) {
  if (!refill) return null;

  const isResolved = refill.state === 'PATIENT_NOTIFIED' || (refill.state === 'DECIDED' && refill.provider_decision === 'DENY');
  const isNeedsProvider = refill.state === 'PROVIDER_REVIEW' || (refill.state === 'TRIAGED' && refill.lane === 'NEEDS_PROVIDER');
  const isNeedsInfo = refill.state === 'INFO_GATHERING' || (refill.state === 'TRIAGED' && refill.lane === 'NEEDS_INFO');
  const isAutoClear = refill.lane === 'AUTO_CLEAR';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-blue-400 font-semibold block mb-1">
            CORE WORKFLOW DIAGNOSTIC
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            WHY IS THIS REFILL STUCK?
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority & SLA Badges */}
          {refill.priority === 'URGENT' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              URGENT PRIORITY
            </span>
          )}
          {refill.priority === 'HIGH' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              HIGH PRIORITY
            </span>
          )}
          {refill.is_stalled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-orange-500/20 text-orange-300 border border-orange-500/40">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              STALLED (24h+)
            </span>
          )}
          {refill.sla_status === 'BREACHED' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              SLA BREACHED
            </span>
          ) : refill.sla_status === 'AT_RISK' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              SLA AT RISK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              SLA ON TRACK
            </span>
          )}

          {/* Status Badge */}
          {refill.state === 'PATIENT_NOTIFIED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              RESOLVED & NOTIFIED
            </span>
          )}
          {refill.state === 'SENT_TO_PHARMACY' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              <Clock className="w-4 h-4 text-blue-400 animate-spin" />
              TRANSMITTED TO PHARMACY
            </span>
          )}
          {refill.state === 'PROVIDER_REVIEW' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              IN PROVIDER QUEUE
            </span>
          )}
          {refill.state === 'TRIAGED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              ACTION REQUIRED
            </span>
          )}
          {refill.appointment_scheduled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              VISIT BOOKED: {refill.appointment_date}
            </span>
          )}
          {refill.state === 'INFO_GATHERING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
              <HelpCircle className="w-4 h-4 text-orange-400" />
              INFO GATHERING
            </span>
          )}
        </div>
      </div>

      {/* Main Diagnostic Body */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-slate-100">
          
          {/* 1. WHY / Blocker */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">WHY (BLOCKER)</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {refill.blocker_description || 'Zero refills remain on active prescription.'}
            </p>
            {refill.clinical_flag && (
              <span className="mt-2 inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                {refill.clinical_flag}
              </span>
            )}
          </div>

          {/* 2. WHO / Owner */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-blue-700">
              <User className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">WHO (RESPONSIBLE PARTY)</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {refill.owner || refill.assigned_provider || 'Dr. Rao'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Assigned Clinician: {refill.assigned_provider || 'Dr. Rao'}
            </p>
          </div>

          {/* 3. ACTION / Required Step */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-indigo-700">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">REQUIRED ACTION</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {refill.state === 'TRIAGED' && 'Route to provider for authorization'}
              {refill.state === 'PROVIDER_REVIEW' && 'Provider clinical decision (Approve/Deny)'}
              {refill.state === 'INFO_GATHERING' && 'Obtain chart vitals / lab confirmation'}
              {refill.state === 'SENT_TO_PHARMACY' && 'Await pharmacy transmission ack'}
              {refill.state === 'PATIENT_NOTIFIED' && 'None — Completed & closed'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Channel: {refill.request_channel}
            </p>
          </div>

          {/* 4. AI CONFIDENCE & RECOMMENDATION */}
          <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                AI TRIAGE
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white">
                {Math.round((refill.ai_confidence || 0.95) * 100)}% CONFIDENCE
              </span>
            </div>
            <p className="text-xs font-medium text-slate-800 leading-relaxed">
              {refill.recommended_action || 'Route to prescribing provider for authorization.'}
            </p>
            {refill.is_fallback && (
              <p className="text-[10px] text-amber-700 font-semibold mt-1">
                * Evaluated via deterministic clinical workflow rules
              </p>
            )}
          </div>
        </div>

        {/* Duplicate Warning Banner if applicable */}
        {refill.duplicate_warning && (
          <div className="mt-4 p-3.5 bg-orange-50 border border-orange-300 rounded-lg flex items-center justify-between text-xs text-orange-950 font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              <span><strong>Duplicate Detection Alert:</strong> {refill.duplicate_warning}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-200 text-orange-900 px-2 py-0.5 rounded shrink-0">
              Review Advised
            </span>
          </div>
        )}

        {/* Operational Intelligence & Next Best Action Callout */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                NEXT BEST ACTION
              </span>
              <span className="text-xs font-bold text-slate-800">
                {refill.recommended_action || 'Review and route to provider'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              <strong>Priority Reason:</strong> {refill.priority_reason || 'Standard operational routing'} • <strong>SLA Target:</strong> {refill.sla_target_hours || 4}h target ({refill.sla_status === 'BREACHED' ? 'Breached' : refill.sla_status === 'AT_RISK' ? 'At Risk' : 'On Track'})
            </p>
          </div>

          {refill.patient_sms_preview && (
            <div className="text-right hidden md:block max-w-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Live Patient SMS Channel</span>
              <span className="text-[11px] font-medium text-slate-700 italic">"{refill.patient_sms_preview}"</span>
            </div>
          )}
        </div>

        {/* Action Button Strip */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Current Lifecycle:</span>
            <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 border border-slate-200">
              {refill.state}
            </span>
            <span className="text-slate-300">|</span>
            <span>Lane: <strong className="text-slate-700">{refill.lane}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            {/* If in TRIAGED state, PRIMARY CTA IS "SEND TO PROVIDER" */}
            {refill.state === 'TRIAGED' && (
              <>
                <button
                  onClick={onRequestInfo}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Request Information
                </button>
                <button
                  onClick={onSendToProvider}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-sm shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>SEND TO PROVIDER</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* If in PROVIDER_REVIEW state, clinician actions are handled in the dedicated section below */}
            {refill.state === 'PROVIDER_REVIEW' && (
              <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold bg-amber-50 px-3.5 py-2 rounded-lg border border-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Awaiting Clinician Action ({refill.assigned_provider || 'Dr. Rao'})</span>
              </div>
            )}

            {/* If in INFO_GATHERING, re-evaluate triage */}
            {refill.state === 'INFO_GATHERING' && (
              <button
                onClick={onSendToProvider}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide flex items-center gap-2 cursor-pointer"
              >
                <span>Information Acquired → Route to Provider</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* If resolved */}
            {refill.state === 'PATIENT_NOTIFIED' && (
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Workflow complete. Pharmacy confirmed and patient notified.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
