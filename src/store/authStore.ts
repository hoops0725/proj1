import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { handleAuthError, handleSignUpError } from '../lib/errorHandler';

// 条件导入 supabaseAdmin，避免测试环境中 import.meta.env 的问题
let supabaseAdmin = supabase;
const loadSupabaseAdmin = async () => {
  try {
    const adminModule = await import('../lib/supabaseAdmin');
    supabaseAdmin = adminModule.supabaseAdmin || supabase;
  } catch (e) {
    console.log('supabaseAdmin not available, using regular supabase');
  }
};
loadSupabaseAdmin();

interface User {
  id: string;
  email: string;
  created_at: string;
  // 扩展用户信息字段
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  country?: string;
  city?: string;
  website?: string;
  google_id?: string;
  github_id?: string;
  twitter_id?: string;
  facebook_id?: string;
  last_login?: string;
  is_verified?: boolean;
  preferred_language?: string;
  theme?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  // 社交媒体登录方法
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  // 个人资料管理
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  getProfile: () => Promise<User | null>;
}

// 初始化认证状态监听 - 已禁用，使用手动状态管理
const initializeAuthListeners = () => {
  // 禁用自动会话管理，避免与手动登出冲突
  console.log('Auth listeners initialized (manual mode)');
};

// 获取用户资料
const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .limit(1);
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data?.[0] || null;
};

// 创建用户资料（用于 OAuth 首次登录）
const createUserProfile = async (userId: string, userData: { email: string; full_name?: string; avatar_url?: string }) => {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: userData.email,
      full_name: userData.full_name || '',
      avatar_url: userData.avatar_url || '',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
  
  return true;
};

// 初始化认证监听器
initializeAuthListeners();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    console.log('SignIn called with:', { email, passwordLength: password.length });
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    console.log('SignIn response:', { data, error });
    console.log('SignIn data:', data);
    console.log('SignIn error:', error);
    
    if (error) {
      // 处理邮箱未确认的错误
      if (error.message.includes('Email not confirmed')) {
        set({ 
          error: '邮箱尚未确认，请检查您的邮箱并点击确认链接', 
          loading: false 
        });
      } else {
        console.log('Login failed with error:', error.message);
        // 使用统一错误处理，隐藏系统内部细节
        set({ error: handleAuthError(error), loading: false });
      }
    } else {
      // 获取用户资料
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        console.log('Profile after signIn:', profile);
        set({ user: { ...data.user, ...profile } as User, loading: false });
        
        // 更新最后登录时间
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }
    }
  },
  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null });
    console.log('SignUp called with:', { email, fullName });
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName
        }
      }
    });
    
    console.log('SignUp response:', { data, error });
    console.log('SignUp data.user:', data?.user);
    console.log('SignUp data.session:', data?.session);
    
    if (error) {
      console.log('SignUp error:', error.message);
      // 使用统一错误处理，隐藏系统内部细节
      set({ error: handleSignUpError(error), loading: false });
    } else {
      const user = data?.user || data?.session?.user;
      console.log('User from signUp:', user);
      console.log('User metadata:', user?.user_metadata);
      
      if (user) {
        // 注册成功后，尝试立即登录
        console.log('Attempting to sign in after registration...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (signInError) {
          console.log('SignIn after signup error:', signInError.message);
          // 使用统一错误处理，隐藏系统内部细节
          set({ error: handleAuthError(signInError), loading: false });
        } else if (signInData.user) {
          console.log('Auto sign-in successful:', signInData.user);
          const profile = await fetchUserProfile(signInData.user.id);
          console.log('Profile after auto sign-in:', profile);
          set({ user: { ...signInData.user, ...profile, full_name: fullName } as User, loading: false });
        } else {
          console.log('No user from auto sign-in');
          set({ loading: false });
        }
      } else {
        // 如果没有立即返回用户（可能需要邮箱确认）
        console.log('No user returned - may need email confirmation');
        // 尝试直接登录
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          console.log('SignIn error:', signInError.message);
          set({ error: '注册成功！请使用您的账号信息登录。', loading: false });
        }
      }
    }
  },
  signOut: async () => {
    set({ loading: true });
    try {
      // 完全不调用 Supabase 的 signOut API
      // 只清除本地状态，避免与 Supabase SDK 内部的会话管理冲突
      set({ user: null, loading: false, error: null });
    } catch (err) {
      console.error('登出过程中发生错误:', err);
      set({ user: null, loading: false });
    }
  },
  checkAuth: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // 获取用户资料
      let profile = await fetchUserProfile(session.user.id);
      
      // 如果没有用户资料（首次 OAuth 登录），创建一个
      if (!profile) {
        console.log('Creating profile for OAuth user:', session.user.email);
        const fullName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || '';
        const avatarUrl = session.user.user_metadata?.avatar_url || '';
        
        await createUserProfile(session.user.id, {
          email: session.user.email || '',
          full_name: fullName,
          avatar_url: avatarUrl
        });
        
        // 重新获取用户资料
        profile = await fetchUserProfile(session.user.id);
      }
      
      // 更新最后登录时间
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', session.user.id);
      
      set({ user: { ...session.user, ...profile } as User, loading: false });
    } else {
      set({ user: null, loading: false });
    }
  },
  // 社交媒体登录方法
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'openid email profile'
      }
    });
    if (error) {
      console.error('Google login error:', error);
      set({ error: handleAuthError(error), loading: false });
    }
    // 成功时会跳转到 redirectTo，由 AuthInitializer 处理回调
  },
  signInWithGitHub: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
        scopes: 'user:email'
      }
    });
    if (error) {
      console.error('GitHub login error:', error);
      set({ error: handleAuthError(error), loading: false });
    }
    // 成功时会跳转到 redirectTo，由 AuthInitializer 处理回调
  },
  signInWithTwitter: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      set({ error: error.message, loading: false });
    }
  },
  signInWithFacebook: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      set({ error: error.message, loading: false });
    }
  },
  // 个人资料管理
  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    const user = get().user;
    if (!user) {
      set({ error: '用户未登录', loading: false });
      return;
    }
    
    console.log('UpdateProfile called:', { userId: user.id, profileData });
    
    // 使用 upsert 来确保 profile 存在（如果不存在则创建，存在则更新）
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profileData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    console.log('UpdateProfile response:', { error });
    
    if (error) {
      console.error('Error updating profile:', error);
      set({ error: error.message, loading: false });
    } else {
      console.log('Profile updated successfully');
      // 更新本地用户信息
      const updatedUser = { ...user, ...profileData };
      set({ user: updatedUser, loading: false });
    }
  },
  getProfile: async () => {
    const user = get().user;
    if (!user) {
      return null;
    }
    
    const profile = await fetchUserProfile(user.id);
    if (profile) {
      const updatedUser = { ...user, ...profile };
      set({ user: updatedUser });
      return updatedUser;
    }
    
    return user;
  }
}));

