import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../services/api';

export default function ProviderQueuePage() {
  const navigate = useNavigate();
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('pending'); // 'pending', 'all'

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getRefills();
      setRefills(data);
    } catch (err) {
      console.error('Failed to load provider queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRefills = refills.filter(
    (r) => r.state === 'PROVIDER_REVIEW' || (r.state === 'TRIAGED' && (r.lane === 'NEEDS_PROVIDER' || r.lane === 'AUTO_CLEAR'))
  );

  const decidedToday = refills.filter(
    (r) => r.provider_decision !== null || r.state === 'PATIENT_NOTIFIED'
  );

  const displayedList = filterMode === 'pending' ? pendingRefills : refills;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Clinician Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Dr. Rao, MD — Clinician Review Queue
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Authorized Prescriber
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI prepares clinical context and identifies blockers. You maintain 100% prescriptive authority.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Pending Review</span>
              <span className="text-2xl font-black text-rose-600">{pendingRefills.length} Requests</span>
            </div>
            <button
              onClick={loadData}
              className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pending Clinical Review ({pendingRefills.length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Practice Requests ({refills.length})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Showing {displayedList.length} items
        </span>
      </div>

      {/* Queue Card Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
          <span>Loading clinician queue...</span>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-slate-800">Inbox Zero: All refill authorizations completed!</p>
          <p className="text-xs text-slate-400 mt-1">Check back later or view completed orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedList.map((refill) => {
            const isSarah = refill.patient_name.includes('Sarah');
            const isAutoClear = refill.lane === 'AUTO_CLEAR';
            return (
              <div
                key={refill.id}
                onClick={() => navigate(`/provider/refills/${refill.id}`)}
                className={`bg-white rounded-xl border transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSarah
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : isAutoClear
                    ? 'border-emerald-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Strip */}
                <div className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between ${
                  isAutoClear
                    ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                    : isSarah
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-700 border-b border-slate-100'
                }`}>
                  <span>{isAutoClear ? 'EXPEDITED 1-CLICK CANDIDATE' : 'CLINICAL REVIEW REQUIRED'}</span>
                  <span className="font-mono text-[11px] opacity-90">{refill.id}</span>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {refill.patient_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {refill.patient_id} • {refill.condition}
                      </p>
                    </div>

                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {Math.round((refill.ai_confidence || 0.95) * 100)}% AI
                    </span>
                  </div>

                  {/* Prescription */}
                  <div className="my-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-sm font-extrabold text-blue-700">
                      {refill.medication} {refill.dosage}
                    </div>
                    <div className="text-xs text-rose-600 font-semibold mt-0.5">
                      0 refills remaining on active script
                    </div>
                  </div>

                  {/* Vitals Summary */}
                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Clinic Visit:</span>
                      <span className="font-semibold text-slate-800">{refill.last_visit_date || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latest Vitals:</span>
                      <span className="font-semibold text-slate-800">{refill.last_vitals_summary || 'N/A'}</span>
                    </div>
                  </div>

                  {/* AI Recommendation Summary */}
                  <p className="text-[11px] text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-100">
                    <strong>AI Triage:</strong> {refill.recommended_action}
                  </p>
                </div>

                {/* Card Footer Button */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Status: <strong className="text-slate-800">{refill.state}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition">
                    <span>Open Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
