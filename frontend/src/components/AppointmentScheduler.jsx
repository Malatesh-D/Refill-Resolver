import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function AppointmentScheduler({ statusData, onAppointmentScheduled }) {
  const [visitType, setVisitType] = useState('Telehealth Video Consultation');
  const [selectedDate, setSelectedDate] = useState('Tuesday, Sep 29, 2026');
  const [selectedTime, setSelectedTime] = useState('10:15 AM');
  const [notes, setNotes] = useState(`Discuss ${statusData?.medication || 'prescription'} refill renewal and lab status.`);
  const [loading, setLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  const availableDates = [
    { label: 'Tomorrow (Mon, Sep 28)', value: 'Monday, Sep 28, 2026' },
    { label: 'Tue, Sep 29 (Fastest)', value: 'Tuesday, Sep 29, 2026' },
    { label: 'Wed, Sep 30', value: 'Wednesday, Sep 30, 2026' },
    { label: 'Thu, Oct 01', value: 'Thursday, Oct 01, 2026' },
  ];

  const availableTimes = [
    '09:30 AM',
    '10:15 AM',
    '11:00 AM',
    '02:00 PM',
    '03:45 PM',
    '04:30 PM',
  ];

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updated = await api.scheduleAppointment({
        patient_id: statusData.patient_id,
        refill_id: statusData.refill_id,
        appointment_type: visitType,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        notes: notes,
      });
      setSuccessBanner(true);
      setIsRescheduling(false);
      if (onAppointmentScheduled) {
        onAppointmentScheduled(updated);
      }
    } catch (err) {
      alert(`Error scheduling appointment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // If already scheduled and not actively rescheduling: show confirmed appointment view
  if (statusData?.appointment_scheduled && !isRescheduling) {
    return (
      <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm animate-in fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-emerald-800">
                OFFICIAL APPOINTMENT BOOKED
              </span>
              <h3 className="text-base font-extrabold text-emerald-950">
                Consultation Confirmed with {statusData.assigned_provider || 'Dr. Rao, MD'}
              </h3>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs">
            Confirmed & Linked to Refill
          </span>
        </div>

        {/* Appointment Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs text-emerald-950">
          <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Date & Scheduled Time
            </span>
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{statusData.appointment_date || 'Tuesday, Sep 29, 2026'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-slate-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{statusData.appointment_time || '10:15 AM'} EST</span>
            </div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Consultation Modality
            </span>
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              {statusData.appointment_type?.includes('Video') || statusData.appointment_type?.includes('Telehealth') ? (
                <>
                  <Video className="w-4 h-4 text-blue-600" />
                  <span>Telehealth Video Visit</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>In-Person Clinic Visit</span>
                </>
              )}
            </div>
            <p className="mt-1 text-slate-600">
              {statusData.appointment_type?.includes('Video') || statusData.appointment_type?.includes('Telehealth')
                ? 'Secure link active 15 mins prior to visit'
                : 'Downtown Health Pavilion, Suite 400'}
            </p>
          </div>
        </div>

        {/* Prescription Refill Linkage Notice */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5 mb-5">
          <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Refill Workflow Linked:</strong> Your refill request for <strong>{statusData.medication} {statusData.dosage}</strong> is queued in Dr. Rao's clinic workflow for sign-off during this visit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200">
          <button
            onClick={() => alert(`Launching Virtual Exam Room for ${statusData.patient_name}...\nVideo session initialized with Dr. Rao.`)}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Launch Virtual Waiting Room</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
          </button>

          <button
            onClick={() => setIsRescheduling(true)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reschedule Appointment</span>
          </button>
        </div>
      </div>
    );
  }

  // Interactive Booking Form
  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 shadow-md animate-in fade-in">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-blue-600 block mb-0.5">
            ONLINE APPOINTMENT SCHEDULER
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Schedule Required Consultation with {statusData?.assigned_provider || 'Dr. Rao'}</span>
          </h3>
        </div>

        {isRescheduling && (
          <button
            onClick={() => setIsRescheduling(false)}
            className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Cancel Rescheduling
          </button>
        )}
      </div>

      <form onSubmit={handleScheduleSubmit} className="space-y-5">
        
        {/* Modality Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Select Visit Modality
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisitType('Telehealth Video Consultation')}
              className={`p-3.5 rounded-xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                visitType === 'Telehealth Video Consultation'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${visitType === 'Telehealth Video Consultation' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>Telehealth Video Visit</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-600 text-white">
                    FASTEST
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  High-definition video link sent to your device.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisitType('In-Person Clinic Visit')}
              className={`p-3.5 rounded-xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                visitType === 'In-Person Clinic Visit'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${visitType === 'In-Person Clinic Visit' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs">In-Person Clinic Visit</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Downtown Health Pavilion, Suite 400.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            2. Choose Consultation Date
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availableDates.map((d, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(d.value)}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                  selectedDate === d.value
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            3. Choose Timeslot
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {availableTimes.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedTime(t)}
                className={`py-2 px-1 rounded-lg border text-xs font-mono font-bold text-center transition cursor-pointer ${
                  selectedTime === t
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Reason / Message for Dr. Rao
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant booking confirmation linked to your refill order</span>
          </span>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition cursor-pointer"
          >
            {loading ? (
              <span>Scheduling Consultation...</span>
            ) : (
              <>
                <span>Confirm & Book Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
