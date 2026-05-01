import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'emerald' | 'indigo';
type Size = 'sm' | 'md' | 'full';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: Size;
  icon?: ReactNode;
}

const toneClass: Record<Tone, string> = {
  emerald: 'bg-emerald-500 hover:bg-emerald-600',
  indigo: 'bg-indigo-500 hover:bg-indigo-600',
};

const sizeClass: Record<Size, string> = {
  sm: 'text-sm font-semibold px-4 py-2 rounded-full',
  md: 'text-sm font-semibold px-5 py-2.5 rounded-full',
  full: 'w-full text-[15px] font-bold py-3.5 rounded-2xl',
};

export function ActionButton({
  tone = 'emerald',
  size = 'sm',
  icon,
  className = '',
  children,
  ...props
}: ActionButtonProps) {
  const base = size === 'full'
    ? 'text-white active:scale-[0.98] transition-all cursor-pointer shadow-sm'
    : 'flex items-center gap-1.5 text-white active:scale-95 transition-all cursor-pointer shadow-sm';

  return (
    <button
      {...props}
      className={`${base} ${toneClass[tone]} ${sizeClass[size]} ${className}`.trim()}
    >
      {icon}
      {children}
    </button>
  );
}
