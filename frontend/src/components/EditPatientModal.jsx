import React, { useState, useEffect } from 'react';
import { Edit3, X, Sparkles, User, FileText, HeartPulse, Check } from 'lucide-react';
import { api } from '../services/api';

export default function EditPatientModal({ isOpen, onClose, refill, onUpdated }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_id: '',
    medication: '',
    dosage: '',
    condition: '',
    last_visit_date: '',
    last_vitals_summary: '',
    refills_remaining: 0,
    assigned_provider: 'Dr. Rao',
    clinical_flag: '',
    retrigger_ai: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (refill) {
      setFormData({
        patient_name: refill.patient_name || '',
        patient_id: refill.patient_id || '',
        medication: refill.medication || '',
        dosage: refill.dosage || '',
        condition: refill.condition || '',
        last_visit_date: refill.last_visit_date || '',
        last_vitals_summary: refill.last_vitals_summary || '',
        refills_remaining: refill.refills_remaining ?? 0,
        assigned_provider: refill.assigned_provider || 'Dr. Rao',
        clinical_flag: refill.clinical_flag || '',
        retrigger_ai: true,
      });
    }
  }, [refill]);

  if (!isOpen || !refill) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const updated = await api.updateRefill(refill.id, {
        ...formData,
        refills_remaining: parseInt(formData.refills_remaining, 10) || 0,
      });
      if (onUpdated) {
        onUpdated(updated);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update patient record');
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Edit Patient & Clinical Context</h3>
              <p className="text-[11px] text-slate-400">Update chart vitals, medication details, or visit history</p>
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

          {/* Patient Identity */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Patient Identity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Patient Name</label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Patient MRN / ID</label>
                <input
                  type="text"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Medication & Condition */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Medication & Dosage
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Medication</label>
                <input
                  type="text"
                  name="medication"
                  value={formData.medication}
                  onChange={handleChange}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dosage</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Condition</label>
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Clinical Context & Chart Vitals */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              Chart Vitals & Office Visit Date
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Last Clinic Visit Date</label>
                <input
                  type="text"
                  name="last_visit_date"
                  value={formData.last_visit_date}
                  onChange={handleChange}
                  placeholder="e.g. May 14, 2026"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Latest Available Vitals / Labs</label>
                <input
                  type="text"
                  name="last_vitals_summary"
                  value={formData.last_vitals_summary}
                  onChange={handleChange}
                  placeholder="e.g. BP 128/82, HR 72 or HbA1c 6.8%"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Provider & Safety Flag */}
          <div className="pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned Clinician</label>
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
                <label className="block text-slate-600 font-semibold mb-1">Clinical Safety Flag (Optional)</label>
                <input
                  type="text"
                  name="clinical_flag"
                  value={formData.clinical_flag}
                  onChange={handleChange}
                  placeholder="e.g. Stale Labs or None"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Retrigger AI Option */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                name="retrigger_ai"
                checked={formData.retrigger_ai}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Automatically re-evaluate AI Triage with updated clinical parameters</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              {loading ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Clinical Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
