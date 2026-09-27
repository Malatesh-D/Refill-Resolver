import React, { useState } from 'react';
import { Plus, X, Sparkles, User, FileText, HeartPulse, Building2 } from 'lucide-react';
import { api } from '../services/api';

export default function NewRefillModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
    medication: '',
    dosage: '',
    condition: '',
    last_visit_date: 'May 15, 2026',
    last_vitals_summary: 'BP 124/80, HR 72',
    refills_remaining: 0,
    request_channel: 'E-Prescribe',
    assigned_provider: 'Dr. Rao',
    pharmacy_name: 'Walgreens Pharmacy #4120',
    pharmacy_phone: '(555) 234-5678',
    clinical_flag: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_name || !formData.medication || !formData.dosage) {
      setError('Please fill in patient name, medication, and dosage.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const created = await api.createRefill({
        ...formData,
        refills_remaining: parseInt(formData.refills_remaining, 10) || 0,
      });
      if (onCreated) {
        onCreated(created);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create refill request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">New Prescription Refill Intake</h3>
              <p className="text-[11px] text-slate-400">Creates patient request and triggers autonomous AI triage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
              {error}
            </div>
          )}

          {/* Section: Patient Identity */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Patient Identity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  placeholder="e.g. Carlos Mendoza"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Patient ID / MRN *</label>
                <input
                  type="text"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  placeholder="e.g. PT-2041"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section: Medication & Condition */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Prescription Order Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Medication Name *</label>
                <input
                  type="text"
                  name="medication"
                  value={formData.medication}
                  onChange={handleChange}
                  placeholder="e.g. Atorvastatin"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dosage *</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g. 40 mg"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Medical Condition</label>
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  placeholder="e.g. Hyperlipidemia"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Clinical Context & Vitals */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              Clinical Chart Vitals & Visit
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Last Clinic Visit Date</label>
                <input
                  type="text"
                  name="last_visit_date"
                  value={formData.last_visit_date}
                  onChange={handleChange}
                  placeholder="e.g. May 15, 2026"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Latest Chart Vitals Summary</label>
                <input
                  type="text"
                  name="last_vitals_summary"
                  value={formData.last_vitals_summary}
                  onChange={handleChange}
                  placeholder="e.g. BP 124/80, HR 72"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section: Channel & Pharmacy */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Routing & Pharmacy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Intake Channel</label>
                <select
                  name="request_channel"
                  value={formData.request_channel}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="E-Prescribe">E-Prescribe (SCRIPT 2017071)</option>
                  <option value="Pharmacy Fax">Pharmacy Fax</option>
                  <option value="Patient Portal">Patient Portal</option>
                  <option value="Phone Intake">Phone Intake</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned Physician</label>
                <select
                  name="assigned_provider"
                  value={formData.assigned_provider}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Dr. Rao">Dr. Rao, MD</option>
                  <option value="Dr. Chen">Dr. Chen, MD</option>
                  <option value="Dr. Patel">Dr. Patel, MD</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Refills Remaining</label>
                <input
                  type="number"
                  name="refills_remaining"
                  value={formData.refills_remaining}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI triage will immediately analyze blockers</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                {loading ? (
                  <span>Processing AI Triage...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Run AI Triage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
