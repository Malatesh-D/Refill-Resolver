import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, X, Check, Building2 } from 'lucide-react';

export default function DecisionModal({
  isOpen,
  onClose,
  refill,
  decisionType, // "APPROVE", "DENY", or "NEEDS_VISIT"
  onConfirm,
  loading
}) {
  const [note, setNote] = useState('');

  if (!isOpen || !refill) return null;

  const isApprove = decisionType === 'APPROVE';
  const isDeny = decisionType === 'DENY';
  const isNeedsVisit = decisionType === 'NEEDS_VISIT';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(decisionType, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 flex items-center justify-between text-white ${
          isApprove ? 'bg-emerald-700' : isDeny ? 'bg-rose-700' : 'bg-amber-700'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-base tracking-tight">
              Confirm Authorized Provider Decision
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <p className="text-xs text-slate-500 font-medium mb-1">
              You are recording an authorized <strong className="text-slate-900 uppercase">{decisionType}</strong> decision for:
            </p>
            <h4 className="text-lg font-bold text-slate-900">
              {refill.patient_name} <span className="text-xs font-normal text-slate-500">({refill.patient_id})</span>
            </h4>
            <p className="text-sm font-semibold text-blue-700 mt-0.5">
              {refill.medication} {refill.dosage}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Condition: {refill.condition} • Pharmacy: {refill.pharmacy_name}
            </p>
          </div>

          {/* Audit & Pharmacy Notice */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-blue-50/70 border border-blue-200 p-3 rounded-lg mb-4">
            <Building2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">
                {isApprove
                  ? 'Clinical sign-off will immediately transmit prescription to pharmacy.'
                  : 'Decision will be communicated to practice staff and patient.'}
              </p>
              <p className="mt-0.5 text-blue-800/90 text-[11px]">
                This explicit clinician action will be immutably recorded in the audit trail under your credentials (Dr. Rao).
              </p>
            </div>
          </div>

          {/* Clinician Note */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinician Message / Note to Patient
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold">Shared directly in Patient Portal & SMS</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isApprove
                  ? 'e.g. Approved for 90-day supply. Please continue monitoring your home blood pressure readings.'
                  : isNeedsVisit
                  ? 'e.g. Please schedule a routine checkup before we issue your next long-term refill.'
                  : 'e.g. Refill denied per clinic protocol. Alternative therapy recommended.'
              }
              rows={2}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isDeny
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? (
                <span>Recording Decision...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {isApprove && 'Confirm Approval & Transmit'}
                    {isDeny && 'Confirm Denial'}
                    {isNeedsVisit && 'Confirm Visit Required'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
