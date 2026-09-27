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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 min-h-[82px]">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-5 lg:gap-8">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 tracking-tight text-xl">
                    REFILL RESOLVE
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    B2B RX
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                  From stuck refill to resolved refill.
                </p>
              </div>
            </Link>

            {/* Center: Prominently Highlighted & Big Workspace Switcher */}
            {!isAuthOrLanding && (
              <div className="hidden md:flex items-center gap-2">
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Workspace:</span>
                </div>

                <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-300 shadow-xs gap-2">
                  {/* 1. Practice Staff Tab */}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                      persona === 'staff'
                        ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/35 ring-2 ring-blue-700'
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 shadow-xs hover:shadow-sm'
                    }`}
                    title="Practice Staff Refill Operations Queue"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                      persona === 'staff'
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs sm:text-sm font-black block leading-tight">
                        Practice Staff
                      </span>
                      <span className={`text-[10px] font-bold block leading-tight ${
                        persona === 'staff' ? 'text-blue-100' : 'text-slate-400'
                      }`}>
                        Command Center
                      </span>
                    </div>
                  </button>

                  {/* 2. Clinician / Provider Tab */}
                  <button
                    onClick={() => navigate('/provider')}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                      persona === 'provider'
                        ? 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-600/35 ring-2 ring-emerald-700'
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 font-semibold border border-slate-200 shadow-xs hover:shadow-sm'
                    }`}
                    title="Physician Clinical Review & Sign-Off"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                      persona === 'provider'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                    }`}>
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs sm:text-sm font-black block leading-tight">
                        Clinician / Provider
                      </span>
                      <span className={`text-[10px] font-bold block leading-tight ${
                        persona === 'provider' ? 'text-emerald-100' : 'text-slate-400'
                      }`}>
                        Dr. Rao Review
                      </span>
                    </div>
                  </button>

                  {/* 3. Patient View Tab */}
                  <button
                    onClick={() => navigate('/patient/PT-1042')}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                      persona === 'patient'
                        ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/35 ring-2 ring-indigo-700'
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 font-semibold border border-slate-200 shadow-xs hover:shadow-sm'
                    }`}
                    title="Patient Refill Status & Scheduling Portal"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                      persona === 'patient'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs sm:text-sm font-black block leading-tight">
                        Patient View
                      </span>
                      <span className={`text-[10px] font-bold block leading-tight ${
                        persona === 'patient' ? 'text-indigo-100' : 'text-slate-400'
                      }`}>
                        Track & Schedule
                      </span>
                    </div>
                  </button>
                </nav>
              </div>
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
