import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Stethoscope,
  Layers,
  User,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Building2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo, user } = useAuth();

  const [selectedRoleTab, setSelectedRoleTab] = useState('staff');
  const [email, setEmail] = useState('elena.rostova@healthsystem.org');
  const [password, setPassword] = useState('••••••••••••');
  const [patientId, setPatientId] = useState('PT-1042');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync email when tab changes
  const handleRoleTabChange = (roleKey) => {
    setSelectedRoleTab(roleKey);
    setError(null);
    if (roleKey === 'staff') {
      setEmail(DEMO_USERS.staff.email);
    } else if (roleKey === 'provider') {
      setEmail(DEMO_USERS.provider.email);
    } else if (roleKey === 'patient') {
      setEmail(DEMO_USERS.patient.email);
    }
  };

  const handleQuickLogin = (roleKey) => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      const loggedUser = loginAsDemo(roleKey);
      setLoading(false);
      navigate(loggedUser.destination);
    }, 300);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid work email or username.');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      let targetUser;

      if (selectedRoleTab === 'provider' || email.includes('dr.') || email.includes('provider')) {
        targetUser = {
          id: 'user-provider-custom',
          name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
          title: 'Prescribing Clinician',
          email: email.trim(),
          role: 'provider',
          roleLabel: 'Prescribing Clinician',
          avatar: 'MD',
          department: 'Clinical Practice',
          destination: '/provider'
        };
      } else if (selectedRoleTab === 'patient' || email.includes('patient')) {
        targetUser = {
          id: 'user-patient-custom',
          name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
          title: 'Patient',
          email: email.trim(),
          role: 'patient',
          roleLabel: 'Patient Portal',
          avatar: 'PT',
          patientId: patientId.trim().toUpperCase() || 'PT-1042',
          department: `Chart #${patientId.trim().toUpperCase() || 'PT-1042'}`,
          destination: `/patient/${patientId.trim().toUpperCase() || 'PT-1042'}`
        };
      } else {
        targetUser = {
          id: 'user-staff-custom',
          name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
          title: 'Clinical Operations Specialist',
          email: email.trim(),
          role: 'staff',
          roleLabel: 'Practice Staff',
          avatar: 'ST',
          department: 'Central Operations',
          destination: '/dashboard'
        };
      }

      login(targetUser);
      navigate(targetUser.destination);
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/70">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4">
          <RefreshCw className="w-7 h-7 animate-spin-reverse" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Refill Resolve Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          Secure, role-based orchestration for clinics, providers, and patients.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        
        {/* Quick Workspace Switcher Cards */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 mb-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Clinical Workspace
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Instant Access
            </span>
          </div>

          {/* Disclaimer Notice */}
          <div className="mb-4 p-3 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-950">Evaluation Disclaimer:</span> Login credential validation and MFA are bypassed for demonstration and evaluation purposes. Select any role below to launch its dedicated workspace.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Practice Staff Quick Login */}
            <button
              type="button"
              onClick={() => handleQuickLogin('staff')}
              disabled={loading}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/80 hover:bg-blue-50/40 transition group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                  Ops
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700 transition">
                Elena Rostova
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Practice Staff Lead
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition">
                <span>Enter Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* Prescribing Provider Quick Login */}
            <button
              type="button"
              onClick={() => handleQuickLogin('provider')}
              disabled={loading}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/80 hover:bg-emerald-50/40 transition group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                  Clinician
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition">
                Dr. Anita Rao, MD
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Attending Physician
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition">
                <span>Enter Review Queue</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* Patient Portal Quick Login */}
            <button
              type="button"
              onClick={() => handleQuickLogin('patient')}
              disabled={loading}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/80 hover:bg-indigo-50/40 transition group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                  Patient
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-700 transition">
                Sarah Miller
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Patient (PT-1042)
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition">
                <span>Track My Refill</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>

        {/* Standard Credentials Sign-in Box */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Role Switcher Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Your Access Tier
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleTabChange('staff')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRoleTab === 'staff'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Practice Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('provider')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRoleTab === 'provider'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinician</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('patient')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRoleTab === 'patient'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {selectedRoleTab === 'patient' ? 'Patient Email or Chart ID' : 'Clinic Email / Work Username'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRoleTab === 'provider'
                      ? 'dr.rao@healthsystem.org'
                      : selectedRoleTab === 'patient'
                      ? 'sarah.miller@myhealth.net'
                      : 'elena.rostova@healthsystem.org'
                  }
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Optional Patient ID Field if patient tab */}
            {selectedRoleTab === 'patient' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient MRN / ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="PT-1042"
                    className="w-full pl-10 pr-4 py-2.5 text-sm uppercase font-mono font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Authentication bypassed for evaluation
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Notice */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 font-medium">Keep me signed in on this station</span>
              </label>

              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-bit Encrypted
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                selectedRoleTab === 'provider'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : selectedRoleTab === 'patient'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating Station...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {selectedRoleTab === 'provider' ? 'Clinician' : selectedRoleTab === 'patient' ? 'Patient' : 'Staff Coordinator'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Compliance & Audit Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              Refill Resolve Health Network
            </span>
            <span>Audit Logging Active</span>
          </div>

        </div>

        {/* Current Active Session Pill if already authenticated */}
        {user && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user.avatar || 'U'}
              </div>
              <span>
                Currently active: <strong>{user.name}</strong> ({user.title})
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(user.destination || '/dashboard')}
              className="font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
