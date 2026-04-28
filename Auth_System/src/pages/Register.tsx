import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/ui/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';
import { authService } from '../services/authService';

type Step = 'account' | 'verify' | 'profile';

export const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState('');

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Check username availability
  useEffect(() => {
    if (username.length >= 3) {
      const timer = setTimeout(async () => {
        const available = await authService.checkUsernameAvailable(username);
        setUsernameAvailable(available);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [username]);

  const handleNextStep = async () => {
    setError('');

    if (step === 'account') {
      if (!email || !password || !confirmPassword) {
        setError('All fields are required');
        return;
      }

      if (password !== confirmPassword) {
        setPasswordMatchError('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      setLoading(true);
      const result = await authService.signUp(email, password);

      if (!result.success) {
        setError(result.error?.message || 'Sign up failed');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep('verify');
      setResendCountdown(60);
    } else if (step === 'verify') {
      const code = verificationCode.join('');
      if (code.length !== 6) {
        setError('Please enter the 6-digit verification code');
        return;
      }

      setStep('profile');
    } else if (step === 'profile') {
      if (!displayName || !username) {
        setError('Display name and username are required');
        return;
      }

      if (!usernameAvailable) {
        setError('Username is not available');
        return;
      }

      setLoading(true);
      // Here you would save the profile data to Supabase
      // await profileService.updateProfile(...)

      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 1500);
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleVerificationCodeBackspace = (index: number) => {
    if (index > 0 && !verificationCode[index]) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const renderStepContent = () => {
    const stepIndicators = [
      { number: 1, label: 'Account', active: step === 'account' || step === 'verify' || step === 'profile' },
      { number: 2, label: 'Verify', active: step === 'verify' || step === 'profile' },
      { number: 3, label: 'Profile', active: step === 'profile' },
    ];

    const stepProgress = step === 'account' ? 33 : step === 'verify' ? 66 : 100;

    return (
      <div>
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 -z-10">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${stepProgress}%` }}
            />
          </div>

          {stepIndicators.map((indicator) => (
            <div key={indicator.number} className="flex flex-col items-center z-10">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300
                  ${
                    indicator.active
                      ? 'bg-cyan-400 text-slate-900 scale-110'
                      : 'bg-white/10 text-white/60'
                  }
                `}
              >
                {indicator.number}
              </div>
              <span className="text-xs text-white/60 mt-2 whitespace-nowrap">
                {indicator.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Step 1: Account Details */}
        {step === 'account' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-sm text-white/70 mb-6">Set up your credentials</p>

            <div className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                icon={<Mail size={16} />}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="We'll send a verification code to this email"
                required
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  icon={<Lock size={16} />}
                  placeholder="••••••••••"
                  showPasswordToggle
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password && (
                  <div className="mt-3">
                    <PasswordStrengthMeter password={password} />
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                icon={<Lock size={16} />}
                placeholder="••••••••••"
                showPasswordToggle
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPassword && password === e.target.value) {
                    setPasswordMatchError('');
                  }
                }}
                error={passwordMatchError}
                success={confirmPassword && password === confirmPassword}
                required
              />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 mt-1 rounded cursor-pointer accent-cyan-400"
                  required
                />
                <label htmlFor="terms" className="text-xs text-white/70 cursor-pointer">
                  I agree to the{' '}
                  <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer">
                    Privacy Policy
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Email Verification */}
        {step === 'verify' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
            <p className="text-sm text-white/70 mb-6">We sent a code to {email}</p>

            <div className="space-y-6">
              {/* Code Input Boxes */}
              <div className="grid grid-cols-6 gap-2">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        handleVerificationCodeBackspace(index);
                      }
                    }}
                    className={`
                      h-12 rounded-lg font-bold text-center text-lg
                      bg-white/5 border border-white/15
                      text-white placeholder-white/30
                      focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
                      transition-all duration-150
                    `}
                  />
                ))}
              </div>

              {/* Resend Code Section */}
              <div className="text-center">
                <p className="text-sm text-white/70 mb-2">Didn't receive the code?</p>
                {resendCountdown > 0 ? (
                  <p className="text-sm text-white/60">
                    Resend in <span className="font-semibold">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Profile Setup */}
        {step === 'profile' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
            <p className="text-sm text-white/70 mb-6">Add some details about yourself</p>

            <div className="space-y-5">
              <Input
                label="Display Name"
                type="text"
                icon={<User size={16} />}
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                helperText={`${displayName.length}/50`}
                success={displayName.length > 0}
              />

              <Input
                label="Username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                maxLength={30}
                helperText={`${username.length}/30 • ${
                  username.length < 3
                    ? 'Min 3 characters'
                    : usernameAvailable === null
                    ? 'Checking...'
                    : usernameAvailable
                    ? 'Available'
                    : 'Taken'
                }`}
                success={usernameAvailable === true}
                error={usernameAvailable === false ? 'Username taken' : undefined}
              />

              <div>
                <label className="block text-xs font-medium text-white uppercase tracking-wide mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  maxLength={160}
                  className={`
                    w-full p-3 rounded-lg min-h-20 resize-none
                    bg-white/5 border border-white/15
                    text-white placeholder-white/50
                    focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
                    transition-all duration-150
                  `}
                />
                <p className="mt-1 text-xs text-white/60 text-right">
                  {bio.length}/160
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-4">
          {step !== 'account' && (
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                if (step === 'verify') setStep('account');
                if (step === 'profile') setStep('verify');
              }}
            >
              Back
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleNextStep}
            loading={loading}
            icon={step !== 'profile' ? <ArrowRight size={16} /> : undefined}
          >
            {step === 'profile' ? 'Create Account' : 'Next'}
          </Button>
        </div>

        {/* Already have account */}
        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  };

  return <AuthLayout logoText="AuthFlow">{renderStepContent()}</AuthLayout>;
};
