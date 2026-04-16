import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Supabase 配置验证 ===');
console.log('URL:', supabaseUrl);
console.log('Key (前20字符):', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 错误: Supabase URL 或 Key 未配置');
} else {
  console.log('✅ 环境变量已正确加载');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // 测试连接 - 获取当前会话
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ 连接失败:', error.message);
    } else {
      console.log('✅ Supabase 连接成功!');
      console.log('当前会话:', data.session ? '已登录' : '未登录');
    }
  });
  
  // 测试监听认证状态变化
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('认证状态变化:', event, session ? '有会话' : '无会话');
  });
}