import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Welcome!</h1>
              <p className="text-white/70">
                Logged in as <span className="font-semibold">{user?.email}</span>
              </p>
            </div>

            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white/70 text-sm font-medium mb-2">Email</h3>
              <p className="text-white font-semibold">{user?.email}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white/70 text-sm font-medium mb-2">User ID</h3>
              <p className="text-white font-mono text-sm break-all">{user?.id?.slice(0, 16)}...</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white/70 text-sm font-medium mb-2">Status</h3>
              <p className="text-emerald-400 font-semibold">Authenticated</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="primary" fullWidth>
              Go to Profile
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              icon={<LogOut size={16} />}
              fullWidth
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="text-white font-semibold mb-4">Next Steps</h2>
          <ul className="space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Complete your profile with a display name and avatar</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Connect additional social accounts for easier login</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Enable two-factor authentication for enhanced security</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Explore your account settings and preferences</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
