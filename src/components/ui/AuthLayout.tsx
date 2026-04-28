import type { ReactNode } from 'react';
import { GlassPanel } from './GlassPanel';

interface AuthLayoutProps {
  children: ReactNode;
  showLogo?: boolean;
  logoText?: string;
}

export const AuthLayout = ({
  children,
  showLogo = true,
  logoText = '任务管理',
}: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 -z-20" />

      {/* Animated Gradient Overlay */}
      <div
        className="fixed inset-0 opacity-40 -z-10"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
        }}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <GlassPanel className="w-full max-w-sm">
          {showLogo && (
            <div className="flex flex-col items-center pt-8 pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center mb-3">
                <div className="w-6 h-6 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">{logoText}</h1>
            </div>
          )}

          <div className="p-8">{children}</div>
        </GlassPanel>
      </div>
    </div>
  );
};