import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  ArrowRight,
  User,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  ShieldCheck,
  Stethoscope,
  Edit3,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import KPIStats from '../components/KPIStats';
import NewRefillModal from '../components/NewRefillModal';
import EditPatientModal from '../components/EditPatientModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [refills, setRefills] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingRefill, setEditingRefill] = useState(null);
  const [notificationToast, setNotificationToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState('all'); // 'all', 'needs_review', 'needs_info', 'ready_for_provider', 'recently_resolved'
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [refillsData, metricsData] = await Promise.all([
        api.getRefills(),
        api.getMetrics()
      ]);
      setRefills(refillsData);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteRefill = async (id, patientName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the refill request for ${patientName}?`)) {
      return;
    }
    try {
      await api.deleteRefill(id);
      setNotificationToast(`Successfully deleted refill request for ${patientName}`);
      setTimeout(() => setNotificationToast(null), 4000);
      loadData();
    } catch (err) {
      alert(`Failed to delete refill request: ${err.message}`);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Reset all patient records and audit histories back to pristine demo state?")) {
      return;
    }
    try {
      setRefreshing(true);
      await api.resetDemoData();
      setNotificationToast("Demo database reset: All 8 benchmark records restored!");
      setTimeout(() => setNotificationToast(null), 4000);
      await loadData();
    } catch (err) {
      alert(`Failed to reset demo records: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const isRefillResolved = (r) => {
    return Boolean(
      r.state === 'PATIENT_NOTIFIED' ||
      r.state === 'CONFIRMED' ||
      r.provider_decision === 'DENY' ||
      r.provider_decision === 'APPROVE' ||
      r.appointment_scheduled ||
      r.owner === 'Completed' ||
      r.owner === 'Closed'
    );
  };

  // Filter queues
  const filterRefill = (r) => {
    // Search match
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (r.patient_name || '').toLowerCase().includes(q) ||
        (r.medication || '').toLowerCase().includes(q) ||
        (r.patient_id || '').toLowerCase().includes(q) ||
        ((r.blocker_title || '')).toLowerCase().includes(q);
      if (!match) return false;
    }

    if (selectedQueue === 'recently_resolved') {
      return isRefillResolved(r);
    }
    if (selectedQueue === 'needs_review') {
      return r.state === 'PROVIDER_REVIEW' && !isRefillResolved(r);
    }
    if (selectedQueue === 'ready_for_provider') {
      return r.state === 'TRIAGED' && (r.lane === 'NEEDS_PROVIDER' || r.lane === 'AUTO_CLEAR') && !isRefillResolved(r);
    }
    if (selectedQueue === 'needs_info') {
      return (r.state === 'INFO_GATHERING' || (r.state === 'TRIAGED' && r.lane === 'NEEDS_INFO')) && !isRefillResolved(r);
    }
    if (selectedQueue === 'urgent_stalled') {
      return !isRefillResolved(r) && (r.priority === 'URGENT' || r.is_stalled || r.sla_status === 'BREACHED' || r.sla_status === 'AT_RISK');
    }
    if (selectedQueue === 'prior_auth') {
      return r.prior_auth_status === 'PA_REQUIRED' || r.prior_auth_status === 'APPROVED';
    }
    return true; // 'all'
  };

  const filteredRefills = refills.filter(filterRefill);

  // Grouped counts for badges
  const counts = {
    needs_review: refills.filter(r => r.state === 'PROVIDER_REVIEW' && !isRefillResolved(r)).length,
    needs_info: refills.filter(r => (r.state === 'INFO_GATHERING' || (r.state === 'TRIAGED' && r.lane === 'NEEDS_INFO')) && !isRefillResolved(r)).length,
    ready_for_provider: refills.filter(r => r.state === 'TRIAGED' && (r.lane === 'NEEDS_PROVIDER' || r.lane === 'AUTO_CLEAR') && !isRefillResolved(r)).length,
    urgent_stalled: refills.filter(r => !isRefillResolved(r) && (r.priority === 'URGENT' || r.is_stalled || r.sla_status === 'BREACHED' || r.sla_status === 'AT_RISK')).length,
    prior_auth: refills.filter(r => r.prior_auth_status === 'PA_REQUIRED' || r.prior_auth_status === 'APPROVED').length,
    recently_resolved: refills.filter(isRefillResolved).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Title & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Prescription Refill Operations Command
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Live Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time bottleneck identification, autonomous AI triage, and provider routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={refreshing}
            title="Reset all patients to clean benchmark state"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-xs transition cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-rose-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Refill Request</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <KPIStats metrics={metrics} onFilterQueue={(q) => setSelectedQueue(q)} />

      {/* Queue Filter Bar: 2 Rows so all tabs and search are 100% visible with zero truncation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 mb-6 space-y-3">
        {/* Row 1: Primary Clinical Workflow Queues + Search Box */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold w-full md:w-auto">
            {/* 1. All Requests */}
            <button
              onClick={() => setSelectedQueue('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedQueue === 'all'
                  ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-950'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>All Requests</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                selectedQueue === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {refills.length}
              </span>
            </button>

            {/* 2. Needs Doctor Review */}
            <button
              onClick={() => setSelectedQueue('needs_review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedQueue === 'needs_review'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-700'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
              }`}
              title="Awaiting Dr. Rao's explicit clinical decision"
            >
              <Stethoscope className={`w-3.5 h-3.5 ${selectedQueue === 'needs_review' ? 'text-white' : 'text-rose-600'}`} />
              <span>Needs Doctor Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                selectedQueue === 'needs_review' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
              }`}>
                {counts.needs_review}
              </span>
            </button>

            {/* 3. Needs Provider Routing */}
            <button
              onClick={() => setSelectedQueue('ready_for_provider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedQueue === 'ready_for_provider'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-700'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
              }`}
              title="AI Triage completed; ready for practice staff to route to provider"
            >
              <Sparkles className={`w-3.5 h-3.5 ${selectedQueue === 'ready_for_provider' ? 'text-white' : 'text-blue-600'}`} />
              <span>Needs Provider Routing</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                selectedQueue === 'ready_for_provider' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-900'
              }`}>
                {counts.ready_for_provider}
              </span>
            </button>

            {/* 4. Needs Information */}
            <button
              onClick={() => setSelectedQueue('needs_info')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedQueue === 'needs_info'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-700'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
              title="Blocked pending missing lab results, recent vitals, or patient outreach"
            >
              <HelpCircle className={`w-3.5 h-3.5 ${selectedQueue === 'needs_info' ? 'text-white' : 'text-amber-600'}`} />
              <span>Needs Information</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                selectedQueue === 'needs_info' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {counts.needs_info}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient, drug, ID..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 2: Operational Triage, Risk Queues & Resolution */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Triage & Risk:
            </span>

            {/* 5. Urgent & SLA Risk */}
            <button
              onClick={() => setSelectedQueue('urgent_stalled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedQueue === 'urgent_stalled'
                  ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-800'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300'
              }`}
              title="High priority, stalled requests, or SLA breach warnings"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${selectedQueue === 'urgent_stalled' ? 'text-white' : 'text-rose-600'}`} />
              <span>Urgent & SLA Risk</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                selectedQueue === 'urgent_stalled' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
              }`}>
                {counts.urgent_stalled}
              </span>
            </button>

            {/* 6. Prior Auth (ePA) */}
            <button
              onClick={() => setSelectedQueue('prior_auth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedQueue === 'prior_auth'
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-700'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
              }`}
              title="Insurance Prior Authorization (Reject 75) requests requiring ePA"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${selectedQueue === 'prior_auth' ? 'text-white' : 'text-purple-600'}`} />
              <span>Prior Auth (ePA)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                selectedQueue === 'prior_auth' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {counts.prior_auth}
              </span>
            </button>

            {/* 7. Recently Resolved (Completed Loop) */}
            <button
              onClick={() => setSelectedQueue('recently_resolved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedQueue === 'recently_resolved'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-700'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
              title="Fully resolved, confirmed by pharmacy, and patient notified"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${selectedQueue === 'recently_resolved' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Recently Resolved</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                selectedQueue === 'recently_resolved' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {counts.recently_resolved}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden lg:block">
            Showing <strong className="text-slate-800">{filteredRefills.length}</strong> of <strong className="text-slate-800">{refills.length}</strong> refills in queue
          </div>
        </div>
      </div>

      {/* Refills Table / Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <span>Loading refill queue...</span>
          </div>
        ) : filteredRefills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <p className="font-semibold text-slate-700">No refill requests found in this queue.</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting another filter or clearing the search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Medication & Condition</th>
                  <th className="py-3.5 px-4">Workflow Blocker</th>
                  <th className="py-3.5 px-4">Current State</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4 text-center">AI Confidence</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRefills.map((refill) => {
                  return (
                    <tr
                      key={refill.id}
                      onClick={() => navigate(`/refills/${refill.id}`)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      {/* Patient */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                            {refill.patient_name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm block">{refill.patient_name}</span>
                              {refill.priority === 'URGENT' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                  URGENT
                                </span>
                              )}
                              {refill.priority === 'HIGH' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                  HIGH
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500 font-mono">{refill.patient_id}</span>
                              {refill.is_stalled && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  ⏳ STALLED
                                </span>
                              )}
                              {refill.duplicate_warning && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-100 text-orange-800 border border-orange-200" title={refill.duplicate_warning}>
                                  ⚠️ Duplicate
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Medication */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {refill.medication} <span className="text-slate-600 font-normal text-xs">{refill.dosage}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{refill.condition}</span>
                      </td>

                      {/* Blocker & Next Best Action */}
                      <td className="py-4 px-4 max-w-sm">
                        <div className="flex items-start gap-1.5">
                          {isRefillResolved(refill) ? (
                            refill.provider_decision === 'DENY' ? (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            )
                          ) : refill.lane === 'NEEDS_INFO' ? (
                            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {refill.blocker_title || 'Provider Action Required'}
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block">
                              {refill.blocker_description}
                            </span>
                            {refill.recommended_action && !isRefillResolved(refill) && (
                              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <span className="font-bold">Next Best Action:</span>
                                <span className="truncate max-w-[220px]">{refill.recommended_action}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* State */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          refill.provider_decision === 'DENY'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : refill.state === 'PATIENT_NOTIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : refill.state === 'SENT_TO_PHARMACY'
                            ? 'bg-blue-100 text-blue-800'
                            : refill.state === 'PROVIDER_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : refill.state === 'INFO_GATHERING'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {refill.provider_decision === 'DENY' ? 'DENIED' : refill.state}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-4">
                        <div className="text-slate-900 font-semibold">{refill.owner || 'Dr. Rao'}</div>
                        <span className="text-[10px] text-slate-400">Assigned</span>
                      </td>

                      {/* Confidence */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          {Math.round((refill.ai_confidence || 0.95) * 100)}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            title="Edit Patient Info & Chart Vitals"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRefill(refill);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Delete Refill Request"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRefill(refill.id, refill.patient_name);
                            }}
                            className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/refills/${refill.id}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
          <button
            onClick={() => setNotificationToast(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* New Refill Intake Modal */}
      <NewRefillModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(newRefill) => {
          setNotificationToast(`Created and AI-triaged refill request for ${newRefill.patient_name}`);
          setTimeout(() => setNotificationToast(null), 4000);
          loadData();
        }}
      />

      {/* Edit Patient Info Modal */}
      <EditPatientModal
        isOpen={!!editingRefill}
        onClose={() => setEditingRefill(null)}
        refill={editingRefill}
        onUpdated={(updatedRefill) => {
          setNotificationToast(`Updated chart context for ${updatedRefill.patient_name}`);
          setTimeout(() => setNotificationToast(null), 4000);
          loadData();
        }}
      />
    </div>
  );
}
