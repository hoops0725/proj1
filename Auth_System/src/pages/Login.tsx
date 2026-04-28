import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthLayout } from '../components/ui/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SocialLoginButton } from '../components/ui/SocialLoginButton';
import { authService } from '../services/authService';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.signIn(email, password);

    if (!result.success) {
      setError(result.error?.message || 'Login failed');
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin') => {
    setError('');
    const result = await authService.signInWithOAuth(provider);

    if (!result.success) {
      setError(result.error?.message || 'Social login failed');
    }
  };

  return (
    <AuthLayout logoText="AuthFlow">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-sm text-white/70 mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            icon={<Mail size={16} />}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-cyan-400"
            />
            <label htmlFor="remember" className="text-sm text-white/70 cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-white/70 hover:text-cyan-400 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-xs text-white/60">or continue with</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SocialLoginButton
            provider="google"
            onClick={() => handleSocialLogin('google')}
          />
          <SocialLoginButton
            provider="github"
            onClick={() => handleSocialLogin('github')}
          />
          <SocialLoginButton
            provider="facebook"
            onClick={() => handleSocialLogin('facebook')}
          />
          <SocialLoginButton
            provider="twitter"
            onClick={() => handleSocialLogin('twitter')}
          />
          <SocialLoginButton
            provider="linkedin"
            onClick={() => handleSocialLogin('linkedin')}
          />
        </div>

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-white/70">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
