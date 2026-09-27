import React from 'react';
import {
  FileText,
  UserCheck,
  HelpCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function KPIStats({ metrics, onFilterQueue }) {
  const stats = [
    {
      label: 'ACTIVE REFILLS',
      value: metrics?.active_refills ?? 6,
      subtext: 'In active orchestration',
      icon: FileText,
      color: 'blue',
      filterKey: 'all'
    },
    {
      label: 'NEEDS DOCTOR REVIEW',
      value: metrics?.needs_provider ?? 4,
      subtext: 'In clinician queue for sign-off',
      icon: UserCheck,
      color: 'rose',
      filterKey: 'needs_review'
    },
    {
      label: 'NEEDS INFORMATION',
      value: metrics?.needs_information ?? 2,
      subtext: 'Awaiting chart vitals / labs',
      icon: HelpCircle,
      color: 'amber',
      filterKey: 'needs_info'
    },
    {
      label: 'RESOLVED TODAY',
      value: metrics?.resolved_today ?? 2,
      subtext: 'Completed & confirmed',
      icon: CheckCircle2,
      color: 'emerald',
      filterKey: 'recently_resolved'
    },
    {
      label: 'AVG. RESOLUTION TIME',
      value: metrics?.avg_resolution_time ?? '2h 18m',
      subtext: 'End-to-end turnaround',
      icon: Clock,
      color: 'indigo',
      filterKey: null
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((item, i) => {
        const Icon = item.icon;
        const isClickable = Boolean(item.filterKey && onFilterQueue);
        return (
          <div
            key={i}
            onClick={() => isClickable && onFilterQueue(item.filterKey)}
            className={`bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition ${
              isClickable ? 'hover:border-blue-400 hover:shadow-sm cursor-pointer' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                {item.label}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                item.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                'bg-indigo-50 text-indigo-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {item.value}
            </div>

            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {item.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
