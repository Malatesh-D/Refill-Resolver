import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Layers,
  User,
  Stethoscope,
  ChevronDown,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [systemHealth, setSystemHealth] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then(data => setSystemHealth(data))
      .catch(err => console.warn('Health check unavailable:', err));
  }, []);

  const getActivePersona = () => {
    if (location.pathname.startsWith('/provider')) return 'provider';
    if (location.pathname.startsWith('/patient')) return 'patient';
    if (location.pathname === '/' || location.pathname === '/login') return 'auth';
    return 'staff';
  };

  const persona = getActivePersona();
  const isLandingPage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isAuthOrLanding = isLandingPage || isLoginPage;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">
                  REFILL RESOLVE
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  CLINICAL
                </span>
              </div>
            </Link>

            {/* Center: Prominently Highlighted Clinical Workspace Switcher */}
            {!isAuthOrLanding && (
              <nav className="hidden md:flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-300/80 shadow-xs gap-1.5 text-xs">
                <div className="hidden xl:flex items-center gap-1 pl-1.5 pr-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Workspace:</span>
                </div>

                {/* 1. Practice Staff Queue */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    persona === 'staff'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-1 ring-blue-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-200 shadow-2xs hover:shadow-xs'
                  }`}
                  title="Practice Staff Refill Operations Queue"
                >
                  <span className={`w-2 h-2 rounded-full ${persona === 'staff' ? 'bg-white' : 'bg-blue-600'}`}></span>
                  <Layers className={`w-3.5 h-3.5 ${persona === 'staff' ? 'text-white' : 'text-blue-600'}`} />
                  <span>Practice Staff</span>
                </button>

                {/* 2. Clinician / Provider Review */}
                <button
                  onClick={() => navigate('/provider')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    persona === 'provider'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200 shadow-2xs hover:shadow-xs'
                  }`}
                  title="Physician Clinical Review & Sign-Off"
                >
                  <span className={`w-2 h-2 rounded-full ${persona === 'provider' ? 'bg-white' : 'bg-emerald-600'}`}></span>
                  <Stethoscope className={`w-3.5 h-3.5 ${persona === 'provider' ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Clinician (Dr. Rao)</span>
                </button>

                {/* 3. Patient Portal */}
                <button
                  onClick={() => navigate('/patient/PT-1042')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    persona === 'patient'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-indigo-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 border border-slate-200 shadow-2xs hover:shadow-xs'
                  }`}
                  title="Patient Refill Status & Scheduling Portal"
                >
                  <span className={`w-2 h-2 rounded-full ${persona === 'patient' ? 'bg-white' : 'bg-indigo-600'}`}></span>
                  <User className={`w-3.5 h-3.5 ${persona === 'patient' ? 'text-white' : 'text-indigo-600'}`} />
                  <span>Patient Portal</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right: User Profile, System Status & Session Control */}
          <div className="flex items-center gap-3">
            
            {/* Landing page portal link */}
            {isLandingPage && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Authenticated User Station Pill */}
            {user && !isLoginPage && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
                    user.role === 'provider'
                      ? 'bg-emerald-600'
                      : user.role === 'patient'
                      ? 'bg-indigo-600'
                      : 'bg-blue-600'
                  }`}>
                    {user.avatar || 'U'}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <div className="text-xs font-bold text-slate-800">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {user.roleLabel || 'Authorized'}
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Sign out of station"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Status Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowStatusModal(!showStatusModal)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 transition cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium hidden sm:inline text-[11px]">Operational</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Status Popover */}
              {showStatusModal && (
                <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-xs">System Health</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Live
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">AI Triage</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">
                        {systemHealth?.services?.ai_triage?.includes('Gemini') ? 'Google Gemini 2.5 Flash' : 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Workflow Engine</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">Operational</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Pharmacy Gateway</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">Mock SCRIPT Live</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Audit Database</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">SQLite (Immutable)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
