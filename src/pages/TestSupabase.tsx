import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const TestSupabase: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('正在测试...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      const logs: string[] = [];
      
      // 检查环境变量
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      logs.push(`URL: ${url ? '已配置 ✓' : '未配置 ✗'}`);
      logs.push(`Key: ${key ? '已配置 ✓' : '未配置 ✗'}`);
      
      if (!url || !key) {
        setStatus('配置错误');
        setDetails(logs);
        return;
      }
      
      logs.push(`URL 值: ${url}`);
      logs.push(`Key 前缀: ${key.substring(0, 20)}...`);
      
      // 测试连接
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logs.push(`连接错误: ${error.message}`);
          setStatus('连接失败');
        } else {
          logs.push('连接成功 ✓');
          logs.push(`会话状态: ${data.session ? '已登录' : '未登录'}`);
          setStatus('配置正确');
        }
      } catch (err) {
        logs.push(`异常: ${err}`);
        setStatus('连接失败');
      }
      
      setDetails(logs);
    };
    
    testConnection();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 -z-20" />
      <div
        className="fixed inset-0 opacity-40 -z-10"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
        }}
      />
      
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
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
          <h1 className="text-2xl font-bold text-white">Supabase 配置测试</h1>
        </div>
        
        <div className={`p-4 rounded-lg mb-4 ${status === '配置正确' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : status === '正在测试...' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
          状态: {status}
        </div>
        
        <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
          <h2 className="font-semibold text-white mb-2">详细信息:</h2>
          <ul className="space-y-1">
            {details.map((detail, index) => (
              <li key={index} className="text-sm text-cyan-300/80">{detail}</li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/auth/login')}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            登录页面
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all"
          >
            首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSupabase;