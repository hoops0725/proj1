import { supabase } from '../lib/supabase';

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: AuthError;
  data?: any;
}

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code },
        };
      }

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Unknown error' },
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code },
        };
      }

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Unknown error' },
      };
    }
  },

  async signInWithOAuth(provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin'): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code },
        };
      }

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Unknown error' },
      };
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code },
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Unknown error' },
      };
    }
  },

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code },
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Unknown error' },
      };
    }
  },

  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code },
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Unknown error' },
      };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      return { session, error: null };
    } catch (error: any) {
      return { session: null, error };
    }
  },

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'check',
      });

      if (error?.message?.includes('Invalid login credentials')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      return !data;
    } catch {
      return true;
    }
  },
};
