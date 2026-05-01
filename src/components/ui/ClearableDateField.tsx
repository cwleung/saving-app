import { X } from 'lucide-react';

interface ClearableDateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  optional?: boolean;
  inputClassName?: string;
}

export function ClearableDateField({
  label,
  value,
  onChange,
  onClear,
  optional = false,
  inputClassName = 'w-full bg-gray-50 rounded-xl px-3 py-3 text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors pr-8',
}: ClearableDateFieldProps) {
  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          {label}{' '}
          {optional && <span className="normal-case font-normal text-gray-300">(optional)</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
