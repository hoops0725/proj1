import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { AuthLayout } from '../components/ui/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authService } from '../services/authService';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.resetPassword(email);

    if (!result.success) {
      setError(result.error?.message || 'Failed to send reset link');
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

          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-sm text-white/70 mb-4">
            We sent a password reset link to <span className="font-semibold">{email}</span>
          </p>

          <p className="text-xs text-white/60 mb-6">
            Follow the link in the email to reset your password. This link will expire in 24 hours.
          </p>

          <Link to="/login" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout logoText="AuthFlow">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-sm text-white/70 mb-8">Enter your email to receive a reset link</p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            icon={<Mail size={16} />}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            icon={<Send size={16} />}
          >
            Send Reset Link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
