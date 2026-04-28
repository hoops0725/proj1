import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, loading: false, error: null });
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        created_at: '2024-01-01',
      };

      (supabase.auth.signInWithPassword as jest.Mock)
        .mockResolvedValue({ data: { user: mockUser, session: { user: mockUser } }, error: null });

      (supabase.from as jest.Mock)
        .mockImplementation((tableName: string) => {
          if (tableName === 'profiles') {
            return {
              select: () => ({
                eq: () => ({
                  limit: () => Promise.resolve({ data: [{ id: 'user1', full_name: 'Test User' }], error: null }),
                }),
              }),
              update: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
            };
          }
          return {};
        });

      const store = useAuthStore.getState();
      await store.signIn('test@example.com', 'password123');
      
      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user1');
      expect(state.error).toBeNull();
    });

    it('should return error for invalid credentials', async () => {
      const mockError = new Error('Invalid email or password');
      
      (supabase.auth.signInWithPassword as jest.Mock)
        .mockResolvedValue({ data: null, error: mockError });

      const store = useAuthStore.getState();
      await store.signIn('test@example.com', 'wrongpassword');
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBe('登录失败，请检查邮箱和密码是否正确');
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'newuser@example.com',
        created_at: '2024-01-01',
      };

      (supabase.auth.signUp as jest.Mock)
        .mockResolvedValue({ data: { user: mockUser }, error: null });
      
      (supabase.auth.signInWithPassword as jest.Mock)
        .mockResolvedValue({ data: { user: mockUser, session: { user: mockUser } }, error: null });

      (supabase.from as jest.Mock)
        .mockImplementation((tableName: string) => {
          if (tableName === 'profiles') {
            return {
              select: () => ({
                eq: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
              insert: () => Promise.resolve({ data: null, error: null }),
              update: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
            };
          }
          return {};
        });

      const store = useAuthStore.getState();
      await store.signUp('newuser@example.com', 'password123', 'New User');
      
      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user1');
    });

    it('should return error for email already registered', async () => {
      const mockError = new Error('Email already registered');
      
      (supabase.auth.signUp as jest.Mock)
        .mockResolvedValue({ data: null, error: mockError });

      const store = useAuthStore.getState();
      await store.signUp('existing@example.com', 'password123', 'Existing User');
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBe('注册失败，请稍后重试');
    });
  });

  describe('signInWithGoogle', () => {
    it('should initiate Google OAuth', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock)
        .mockResolvedValue({ data: {}, error: null });

      const store = useAuthStore.getState();
      await store.signInWithGoogle();
      
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.any(String),
          scopes: 'openid email profile',
        },
      });
    });

    it('should return error when OAuth fails', async () => {
      const mockError = new Error('OAuth failed');
      
      (supabase.auth.signInWithOAuth as jest.Mock)
        .mockResolvedValue({ data: null, error: mockError });

      const store = useAuthStore.getState();
      await store.signInWithGoogle();
      
      const state = useAuthStore.getState();
      expect(state.error).toBe('登录失败，请检查邮箱和密码是否正确');
    });
  });

  describe('signInWithGitHub', () => {
    it('should initiate GitHub OAuth', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock)
        .mockResolvedValue({ data: {}, error: null });

      const store = useAuthStore.getState();
      await store.signInWithGitHub();
      
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.any(String),
          scopes: 'user:email',
        },
      });
    });
  });

  describe('signOut', () => {
    it('should clear user state on sign out', async () => {
      useAuthStore.setState({ user: { id: 'user1', email: 'test@example.com', created_at: '2024-01-01' } as any });
      
      const store = useAuthStore.getState();
      await store.signOut();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('should set user when session exists', async () => {
      const mockSession = {
        user: {
          id: 'user1',
          email: 'test@example.com',
          created_at: '2024-01-01',
          user_metadata: { name: 'Test User' },
        },
      };
      
      (supabase.auth.getSession as jest.Mock)
        .mockResolvedValue({ data: { session: mockSession } });

      (supabase.from as jest.Mock)
        .mockImplementation((tableName: string) => {
          if (tableName === 'profiles') {
            return {
              select: () => ({
                eq: () => ({
                  limit: () => Promise.resolve({ data: [{ id: 'user1', full_name: 'Test User' }], error: null }),
                }),
              }),
              update: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
              insert: () => Promise.resolve({ data: null, error: null }),
            };
          }
          return {};
        });

      const store = useAuthStore.getState();
      await store.checkAuth();
      
      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user1');
    });

    it('should create profile for new OAuth user', async () => {
      const mockSession = {
        user: {
          id: 'newuser1',
          email: 'new@example.com',
          created_at: '2024-01-01',
          user_metadata: { name: 'New User', avatar_url: 'avatar.jpg' },
        },
      };
      
      (supabase.auth.getSession as jest.Mock)
        .mockResolvedValue({ data: { session: mockSession } });

      let callCount = 0;
      (supabase.from as jest.Mock)
        .mockImplementation((tableName: string) => {
          if (tableName === 'profiles') {
            callCount++;
            return {
              select: () => ({
                eq: () => ({
                  limit: () => Promise.resolve({ 
                    data: callCount === 1 ? [] : [{ id: 'newuser1', full_name: 'New User' }], 
                    error: null 
                  }),
                }),
              }),
              update: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
              insert: () => Promise.resolve({ data: null, error: null }),
            };
          }
          return {};
        });

      const store = useAuthStore.getState();
      await store.checkAuth();
      
      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('newuser1');
    });

    it('should set user to null when no session', async () => {
      (supabase.auth.getSession as jest.Mock)
        .mockResolvedValue({ data: { session: null } });

      const store = useAuthStore.getState();
      await store.checkAuth();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });
});