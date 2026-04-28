interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const calculateStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const strength = calculateStrength();
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-red-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-emerald-500',
  ];

  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: '1 uppercase letter', met: /[A-Z]/.test(password) },
    { label: '1 lowercase letter', met: /[a-z]/.test(password) },
    { label: '1 number or symbol', met: /[0-9!@#$%^&*]/.test(password) },
  ];

  return (
    <div className="space-y-3">
      {/* Strength Meter */}
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              i < strength ? strengthColors[strength - 1] : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">Password strength</span>
        <span className="text-xs font-medium text-white/80">
          {password ? strengthLabels[strength - 1] : '-'}
        </span>
      </div>

      {/* Requirements Checklist */}
      {password && (
        <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
          {requirements.map((req, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                  req.met ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              >
                {req.met && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs transition-colors duration-200 ${
                  req.met ? 'text-emerald-400' : 'text-white/60'
                }`}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
