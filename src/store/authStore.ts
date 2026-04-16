import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { localStorageService } from '../services/localStorageService';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// 初始化认证状态监听
const initializeAuthListeners = () => {
  // 监听认证状态变化
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // 认证状态已更新（登录或 Token 刷新）
      console.log('Auth state changed:', event, session);
      useAuthStore.getState().user = session.user as User;
      useAuthStore.getState().loading = false;
      useAuthStore.getState().error = null;
      // 重新启动实时订阅
      localStorageService.restartRealtimeSubscription();
    } else {
      // 认证状态已清除（登出或 Token 过期）
      console.log('Auth state cleared:', event);
      useAuthStore.getState().user = null;
      useAuthStore.getState().loading = false;
    }
  });
};

// 初始化认证监听器
initializeAuthListeners();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ user: data.user as User, loading: false });
    }
  },
  signUp: async (email, password) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ loading: false });
    }
  },
  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ user: null, loading: false });
    }
  },
  checkAuth: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ user: session.user as User, loading: false });
    } else {
      set({ user: null, loading: false });
    }
  },
}));

