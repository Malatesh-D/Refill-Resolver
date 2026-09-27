import React from 'react';
import {
  Clock,
  User,
  Bot,
  Send,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Copy
} from 'lucide-react';

// Deterministic 32-bit Knuth multiplicative hash → hex string (simulates SHA-256 fingerprint for demo)
function hashEvent(event) {
  const payload = JSON.stringify({
    id: event.id,
    refill_id: event.refill_id,
    timestamp: event.timestamp,
    actor: event.actor,
    action: event.action,
    from_state: event.from_state,
    to_state: event.to_state,
    detail: event.detail
  });

  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x9e3779b1);
    h2 = Math.imul(h2 ^ ch, 0x5f356495);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x45d9f3b) ^ Math.imul(h2 ^ (h2 >>> 13), 0x93a7fb9b);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 0x45d9f3b) ^ Math.imul(h1 ^ (h1 >>> 13), 0x93a7fb9b);

  // Extend to 64 hex chars for visual authenticity
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((h1 * 31 + h2) >>> 0).toString(16).padStart(8, '0');
  const part5 = ((h2 * 17 ^ h1) >>> 0).toString(16).padStart(8, '0');
  const part6 = ((h1 + h2 + 0xab3f) >>> 0).toString(16).padStart(8, '0');
  const part7 = ((h1 ^ 0xc3a9) >>> 0).toString(16).padStart(8, '0');
  const part8 = ((h2 ^ 0xf1b4) >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}${part3}${part4}${part5}${part6}${part7}${part8}`;
}

export default function AuditTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs">
        No audit events recorded yet.
      </div>
    );
  }

  // Format timestamp helper
  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash).catch(() => {});
  };

  const getActorBadge = (actor) => {
    const safeActor = actor || 'System';
    const lower = safeActor.toLowerCase();
    if (lower.includes('ai')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Bot className="w-3 h-3 text-indigo-600" />
          {safeActor}
        </span>
      );
    }
    if (lower.includes('dr.') || lower.includes('clinician') || lower.includes('provider')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          {safeActor}
        </span>
      );
    }
    if (lower.includes('pharmacy')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Building2 className="w-3 h-3 text-purple-600" />
          {safeActor}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <User className="w-3 h-3 text-slate-500" />
        {safeActor}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">IMMUTABLE AUDIT TIMELINE</h3>
        </div>
        <div>
          <span className="text-[11px] font-mono text-slate-500">
            Append-only • {events.length} Events
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((event, index) => {
          const isLatest = index === events.length - 1;
          const hash = hashEvent(event);
          return (
            <div key={event.id || index} className="relative group">
              {/* Bullet Node */}
              <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs transition ${
                isLatest
                  ? 'bg-blue-600 ring-4 ring-blue-100'
                  : 'bg-slate-400 group-hover:bg-slate-600'
              }`}></div>

              <div className="bg-slate-50 hover:bg-slate-100/80 transition rounded-lg p-3 border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {getActorBadge(event.actor)}
                    <span className="text-xs font-bold text-slate-900">
                      {event.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {formatTime(event.timestamp)}
                  </span>
                </div>

                {event.from_state && event.to_state && (
                  <div className="text-[10px] font-mono text-slate-500 mb-1 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">{event.from_state}</span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded border border-blue-200">{event.to_state}</span>
                  </div>
                )}

                <p className="text-xs text-slate-700 leading-relaxed mt-1">
                  {event.detail}
                </p>

                {/* Integrity Hash */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-[160px]" title={hash}>
                    #{hash.slice(0, 16)}…
                  </span>
                  <button
                    onClick={() => copyHash(hash)}
                    title="Copy full integrity hash"
                    className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 hover:text-blue-600 transition cursor-pointer"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    copy
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
