interface PasswordStrengthMeterProps {
  password: string;
}

const getPasswordStrength = (password: string) => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1; // Uppercase
  if (/[a-z]/.test(password)) score += 1; // Lowercase
  if (/[0-9]/.test(password)) score += 1; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // Special characters
  
  return score;
};

const getStrengthColor = (score: number) => {
  if (score <= 2) return 'bg-red-500';
  if (score <= 4) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

const getStrengthText = (score: number) => {
  if (score <= 2) return 'Weak';
  if (score <= 4) return 'Medium';
  return 'Strong';
};

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const score = getPasswordStrength(password);
  const strengthPercentage = (score / 6) * 100;
  const colorClass = getStrengthColor(score);
  const strengthText = getStrengthText(score);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/70">Password Strength</span>
        <span className={`text-xs font-semibold ${score <= 2 ? 'text-red-400' : score <= 4 ? 'text-yellow-400' : 'text-emerald-400'}`}>
          {strengthText}
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300 ease-out`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>
    </div>
  );
};