import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export const GlassPanel = ({ children, className = '' }: GlassPanelProps) => {
  return (
    <div
      className={`
        rounded-2xl backdrop-blur-2xl
        bg-white/8 border border-white/15
        shadow-2xl
        ${className}
      `}
    >
      {children}
    </div>
  );
};
