import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { AuthLayout } from '../components/ui/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';
import { authService } from '../services/authService';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or expired reset link');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordMatchError('');

    if (!password || !confirmPassword) {
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
    const result = await authService.updatePassword(password);

    if (!result.success) {
      setError(result.error?.message || 'Failed to reset password');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  if (success) {
    return (
      <AuthLayout logoText="AuthFlow">
        <div className="text-center py-8">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-scaleIn">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Password Reset</h2>
          <p className="text-sm text-white/70 mb-6">Your password has been successfully reset</p>

          <p className="text-xs text-white/60 mb-4">Redirecting to sign in...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout logoText="AuthFlow">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Create New Password</h2>
        <p className="text-sm text-white/70 mb-8">Enter your new password below</p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {!token ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-300">
              Invalid or expired reset link. Please request a new one.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                label="New Password"
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Reset Password
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};
