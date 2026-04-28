import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/ui/AuthLayout';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash;

        if (hash) {
          setStatus('success');
          setMessage('Authenticating...');

          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          setStatus('error');
          setMessage('Authentication failed. Missing credentials.');

          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during authentication.');

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <AuthLayout logoText="AuthFlow">
      <div className="text-center py-8">
        {status === 'loading' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 border-3 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Connecting...</h2>
            <p className="text-sm text-white/70">Completing your authentication</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-scaleIn">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
            <p className="text-sm text-white/70">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-sm text-white/70">{message}</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
};
