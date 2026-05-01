import type { ReactNode } from 'react';

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
  valueClassName?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, sub, className = '', valueClassName = 'text-lg font-bold text-gray-900', icon }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`${valueClassName} mt-1 truncate`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
