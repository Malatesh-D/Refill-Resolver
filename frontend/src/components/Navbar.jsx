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
  Lock,
  ArrowRight
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

  const isLandingPage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isAuthOrLanding = isLandingPage || isLoginPage;

  // Determine home link depending on role
  const getHomeLink = () => {
    if (!user) return '/';
    if (user.role === 'provider') return '/provider';
    if (user.role === 'patient') return `/patient/${user.patientId || 'PT-1042'}`;
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 min-h-[76px]">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-5 lg:gap-8">
            <Link to={getHomeLink()} className="flex items-center gap-2.5 group shrink-0">
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
                  Prescription Orchestration Platform
                </p>
              </div>
            </Link>

            {/* Center: DEDICATED ROLE INTERFACE BANNER (STRICT ROLE SEPARATION) */}
            {!isAuthOrLanding && user && (
              <div className="hidden md:flex items-center">
                
                {/* 1. If Patient: Show ONLY Patient Portal Interface */}
                {user.role === 'patient' && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border-2 border-indigo-200 text-indigo-950 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-indigo-950 block leading-tight">
                          Patient Portal
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-white text-indigo-700 border border-indigo-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-indigo-700 block leading-tight">
                        Safe Refill Tracking & Appointment Scheduling
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. If Clinician / Provider: Show ONLY Provider Review Interface */}
                {user.role === 'provider' && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-emerald-950 block leading-tight">
                          Clinician Review Queue
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-white text-emerald-700 border border-emerald-200">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          MD Authorization
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 block leading-tight">
                        Physician Sign-Off & Clinical Exception Approvals
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. If Practice Staff: Show ONLY Staff Operations Interface */}
                {user.role === 'staff' && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-950 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-blue-950 block leading-tight">
                          Practice Staff Command Center
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-white text-blue-700 border border-blue-200">
                          Intake Triage
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-blue-700 block leading-tight">
                        Operational Refill Queue & Prior Authorization Routing
                      </span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right: User Station Profile & Switch Role Button */}
          <div className="flex items-center gap-3">
            
            {/* Landing page sign in */}
            {isLandingPage && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </Link>
            )}

            {/* Authenticated Station Profile (Visible when logged in and not on login page) */}
            {user && !isLoginPage && (
              <div className="flex items-center gap-2 sm:gap-3">
                
                {/* User Identity Pill */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 ${
                    user.role === 'provider'
                      ? 'bg-emerald-600'
                      : user.role === 'patient'
                      ? 'bg-indigo-600'
                      : 'bg-blue-600'
                  }`}>
                    {user.avatar || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold leading-tight">
                      {user.roleLabel || user.title || 'Authorized User'}
                    </div>
                  </div>
                </div>

                {/* Prominent Switch Role / Sign Out Button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer shadow-2xs hover:shadow-xs"
                  title="Switch between Patient, Provider, or Staff role"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Switch Role</span>
                </button>
              </div>
            )}

            {/* System Health Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowStatusModal(!showStatusModal)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 transition cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-semibold hidden lg:inline text-[11px]">System Status</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Status Popover */}
              {showStatusModal && (
                <div className="absolute right-0 top-11 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-xs">Clinical Core Engine</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Operational
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">AI Triage</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">
                        Google Gemini 2.5 Flash
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Workflow Engine</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">Active</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Pharmacy Gateway</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">NCPDP Mock Live</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Audit Trail</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">Append-Only SQLite</span>
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
