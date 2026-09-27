import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Layers,
  UserCheck,
  User,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Stethoscope,
  ChevronDown,
  Eye,
  HeartPulse,
  ArrowRight,
  LogIn,
  LogOut,
  UserCircle
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
    if (location.pathname === '/') return 'landing';
    return 'staff';
  };

  const persona = getActivePersona();
  const isLandingPage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isAuthOrLanding = isLandingPage || isLoginPage;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:h-20">
            
            {/* Left: Brand & Tagline */}
            <div className="flex items-center gap-4 lg:gap-8">
              <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 tracking-tight text-xl">REFILL RESOLVE</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      B2B RX
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                    From stuck refill to resolved refill.
                  </p>
                </div>
              </Link>

              {/* High-Visibility Evaluator Persona Navigation Switcher (Hidden on Landing and Login Pages) */}
              {!isAuthOrLanding && (
                <div className="hidden md:flex items-center gap-2">
                  <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border border-slate-200">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Role View:</span>
                  </div>

                  <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/90 shadow-inner gap-2">
                    {/* 1. Practice Staff Tab */}
                    <button
                      onClick={() => navigate('/dashboard')}
                      className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
                        persona === 'staff'
                          ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/30 ring-2 ring-blue-700'
                          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 shadow-2xs hover:shadow-xs'
                      }`}
                      title="Operations Command Center: Manage live queue, identify bottlenecks, triage refills"
                    >
                      <div className={`p-1.5 rounded-md transition ${
                        persona === 'staff' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                      }`}>
                        <Layers className="w-5 h-5 shrink-0" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs sm:text-sm font-bold block leading-tight">Practice Staff</span>
                        <span className={`text-[10px] font-semibold block leading-tight ${persona === 'staff' ? 'text-blue-100' : 'text-slate-400'}`}>
                          Command Center
                        </span>
                      </div>
                    </button>

                    {/* 2. Clinician / Provider Tab */}
                    <button
                      onClick={() => navigate('/provider')}
                      className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
                        persona === 'provider'
                          ? 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-700'
                          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 font-semibold border border-slate-200 shadow-2xs hover:shadow-xs'
                      }`}
                      title="Clinician Review Queue: Dr. Rao sign-off interface (Approve, Deny, Request Visit)"
                    >
                      <div className={`p-1.5 rounded-md transition ${
                        persona === 'provider' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                      }`}>
                        <Stethoscope className="w-5 h-5 shrink-0" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs sm:text-sm font-bold block leading-tight">Clinician / Provider</span>
                        <span className={`text-[10px] font-semibold block leading-tight ${persona === 'provider' ? 'text-emerald-100' : 'text-slate-400'}`}>
                          Dr. Rao Review
                        </span>
                      </div>
                    </button>

                    {/* 3. Patient View Tab */}
                    <button
                      onClick={() => navigate('/patient/PT-1042')}
                      className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
                        persona === 'patient'
                          ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30 ring-2 ring-indigo-700'
                          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 font-semibold border border-slate-200 shadow-2xs hover:shadow-xs'
                      }`}
                      title="Patient Safe Portal: Track refill in plain English and schedule appointments"
                    >
                      <div className={`p-1.5 rounded-md transition ${
                        persona === 'patient' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                      }`}>
                        <User className="w-5 h-5 shrink-0" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs sm:text-sm font-bold block leading-tight">Patient View</span>
                        <span className={`text-[10px] font-semibold block leading-tight ${persona === 'patient' ? 'text-indigo-100' : 'text-slate-400'}`}>
                          Track & Schedule
                        </span>
                      </div>
                    </button>
                  </nav>
                </div>
              )}
            </div>

            {/* Right: User Profile, System Status & Demo Badge */}
            <div className="flex items-center gap-2.5">
              {isLandingPage && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Portal Login</span>
                </Link>
              )}

              {/* User Station & Role Profile Pill (if logged in and not on login page) */}
              {user && location.pathname !== '/login' ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white shrink-0 ${
                      user.role === 'provider'
                        ? 'bg-emerald-600'
                        : user.role === 'patient'
                        ? 'bg-indigo-600'
                        : 'bg-blue-600'
                    }`}>
                      {user.avatar || 'U'}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold leading-tight">
                        {user.roleLabel || 'Authorized'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    title="Sign out of current workstation"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : !user && location.pathname !== '/login' ? (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              ) : null}

              {/* Demo Mode Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>DEMO</span>
              </div>

              {/* System Health Dropdown Toggle */}
              <button
                onClick={() => setShowStatusModal(!showStatusModal)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 transition cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium hidden sm:inline">Status</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* System Status Dropdown */}
        {showStatusModal && (
          <div className="absolute right-4 top-16 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-slate-900 text-sm">System Status</h4>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Operational
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">AI Triage Service</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {systemHealth?.services?.ai_triage ? 'Active (Claude / Fallback)' : 'Operational'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Workflow Engine</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  State Machine Ready
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Pharmacy Gateway</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  NCPDP Mock Online
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 font-medium">Audit Database</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  SQLite (Append-Only)
                </span>
              </div>
            </div>

            <p className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              Healthcare operations orchestration architecture. Guardrails active.
            </p>
          </div>
        )}
      </header>

      {/* Subheader: Persona Banner with Dynamic Persona Indicators (Hidden on Landing and Login Pages) */}
      {!isAuthOrLanding && (
        <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                Active Persona
              </span>
              {persona === 'staff' && (
                <span className="inline-flex items-center gap-2 font-bold text-blue-400 text-xs sm:text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>Practice Operations Staff — Refill Command Center & Intake Triage</span>
                </span>
              )}
              {persona === 'provider' && (
                <span className="inline-flex items-center gap-2 font-bold text-emerald-400 text-xs sm:text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Dr. Rao, MD — Clinician Review Queue & Prescription Authorization</span>
                </span>
              )}
              {persona === 'patient' && (
                <span className="inline-flex items-center gap-2 font-bold text-indigo-400 text-xs sm:text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>Patient Portal — Shielded Status Tracker & Self-Service Scheduling</span>
                </span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4 text-slate-300 text-xs">
              <span className="text-slate-400">Core Principle: <strong className="text-white italic">"We don't automate the doctor's decision. We automate everything around it."</strong></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
