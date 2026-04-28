import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from '../../components/ui/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  // 验证邮箱格式
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证邮箱
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login`
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    } catch {
      setError('发送邮件失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <AuthLayout logoText="任务管理">
        <div className="text-center py-8">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">检查您的邮箱</h2>
          <p className="text-sm text-white/70 mb-4">
            我们已发送密码重置链接到 <span className="font-semibold">{email}</span>
          </p>

          <p className="text-xs text-white/60 mb-6">
            请按照邮件中的链接重置您的密码。该链接将在 24 小时后过期。
          </p>

          <a href="/auth/login" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            返回登录
          </a>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout logoText="任务管理">
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-white/70 hover:text-white transition-colors"
            aria-label="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">重置密码</h2>
            <p className="text-sm text-white/70">输入您的邮箱以接收重置链接</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="邮箱地址"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) {
                setError('');
              }
            }}
            error={error}
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            发送重置链接
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          想起密码了？{' '}
          <a
            href="/auth/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            返回登录
          </a>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;