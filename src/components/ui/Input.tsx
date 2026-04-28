import type { InputHTMLAttributes } from 'react';
import { useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  helperText?: string;
  success?: boolean;
}

export const Input = ({
  label,
  error,
  icon,
  showPasswordToggle = false,
  helperText,
  success,
  type = 'text',
  className = '',
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-white uppercase tracking-wide mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
            {icon}
          </div>
        )}

        <input
          type={inputType}
          className={`
            w-full h-11 px-4 py-2 rounded-lg
            bg-white/5 border border-white/15
            text-white placeholder-white/50
            focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
            transition-all duration-150
            ${icon ? 'pl-10' : ''}
            ${showPasswordToggle ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-400/50' : ''}
            ${success ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-400/50' : ''}
            ${className}
          `}
          {...props}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9 12a3 3 0 100-6m12 3a3 3 0 100-6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        )}

        {success && !error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-white/60">{helperText}</p>
      )}
    </div>
  );
};