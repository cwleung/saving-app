import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return <div className={`max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28 ${className}`}>{children}</div>;
}
