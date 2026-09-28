import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  Bot,
  Layers,
  CheckCircle2,
  Lock,
  Stethoscope,
  Building2,
  FileCheck2,
  Sparkles,
  Zap,
  LogIn
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Top Tagline Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI-Powered Prescription Refill Orchestration</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            From stuck refill to <span className="text-blue-600">resolved refill.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered orchestration for prescription refill workflows. Identify blockers. Route work. Keep everyone informed. Keep providers in control.
          </p>

          {/* Central Pitch Callout */}
          <div className="mt-6 inline-block bg-slate-900 text-slate-200 px-6 py-3 rounded-xl text-sm font-medium shadow-md border border-slate-800">
            <span className="text-blue-400 font-bold">"We don't automate the doctor's decision.</span> We automate everything around it."
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust Attributes */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-600" /> AI-Assisted Triage
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Human-Controlled Approvals
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-600" /> Fully Auditable Timeline
            </span>
          </div>
        </div>

        {/* 3 Core Workflow Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs hover:border-blue-300 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">UNDERSTAND</h3>
            <p className="text-sm font-semibold text-blue-600 mb-3">
              Know exactly why a refill is stuck.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI evaluates clinical context, zero remaining refills, stale labs, and authorization rules to isolate the root blocker within seconds.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs hover:border-blue-300 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ROUTE</h3>
            <p className="text-sm font-semibold text-emerald-600 mb-3">
              Send the work to the right person.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Separates staff info-gathering from provider sign-off queues. Automatically assigns owners, creates draft notes, and avoids phone tag.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs hover:border-blue-300 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">RESOLVE</h3>
            <p className="text-sm font-semibold text-purple-600 mb-3">
              Verify completion and close the loop.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provider explicitly confirms approval, electronic NCPDP script transmits to the pharmacy, acknowledgement confirms fill, and patient gets informed.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">REFILL RESOLVE</span>
            <span>• Healthcare Workflow Orchestration Architecture</span>
          </div>
          <p className="text-slate-400">
            AI Safety Guardrails Active • Clinical Decision Authority Preserved
          </p>
        </div>
      </footer>
    </div>
  );
}
