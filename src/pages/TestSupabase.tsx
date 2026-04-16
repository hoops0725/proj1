import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const TestSupabase: React.FC = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Supabase 配置测试</h1>
        
        <div className={`p-4 rounded-md mb-4 ${status === '配置正确' ? 'bg-green-100 text-green-700' : status === '正在测试...' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          状态: {status}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="font-semibold mb-2">详细信息:</h2>
          <ul className="space-y-1">
            {details.map((detail, index) => (
              <li key={index} className="text-sm text-gray-600">{detail}</li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-indigo-600 hover:text-indigo-500">返回登录页面</a>
        </div>
      </div>
    </div>
  );
};

export default TestSupabase;