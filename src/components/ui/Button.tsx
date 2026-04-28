import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-2.5 text-sm',
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-500 to-cyan-400
      hover:from-blue-600 hover:to-cyan-500
      active:from-blue-700 active:to-cyan-600
      text-white shadow-lg hover:shadow-xl
      active:shadow-md
    `,
    secondary: `
      bg-gradient-to-r from-pink-500 to-amber-400
      hover:from-pink-600 hover:to-amber-500
      active:from-pink-700 active:to-amber-600
      text-white shadow-lg hover:shadow-xl
      active:shadow-md
    `,
    outline: `
      border border-white/30 hover:border-white/50
      text-white bg-transparent
      hover:bg-white/5
      active:bg-white/10
    `,
  };

  return (
    <button
      className={`
        h-11 rounded-lg font-semibold
        flex items-center justify-center gap-2
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'pointer-events-none' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="flex items-center justify-center">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};