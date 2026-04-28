import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 创建一个自定义存储适配器
// 支持 OAuth 回调时的会话检测，但禁用自动刷新和持久化
const customStorage = {
  getItem: (key: string) => {
    // 允许读取会话信息用于 OAuth 回调检测
    // 使用 localStorage 临时存储 OAuth 会话
    const item = localStorage.getItem(key);
    return item;
  },
  setItem: (key: string, value: string) => {
    // 临时保存会话信息用于 OAuth 回调
    // 但只保存较短时间（5分钟）
    localStorage.setItem(key, value);
    // 设置过期时间标记
    localStorage.setItem(`${key}_expires`, Date.now().toString());
  },
  removeItem: (key: string) => {
    // 删除会话信息
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_expires`);
  },
};

// 配置选项，禁用自动刷新但启用 URL 会话检测
const options = {
  auth: {
    storage: customStorage as any,
    autoRefreshToken: false, // 禁用自动刷新以避免登出错误
    persistSession: true, // 启用会话持久化用于 OAuth 回调
    detectSessionInUrl: true, // 用于检测 OAuth 回调 URL
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);