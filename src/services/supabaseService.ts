import { createClient } from '@supabase/supabase-js';
import type { Task } from '../lib/db';

// 创建 Supabase 客户端
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase 服务类
export class SupabaseService {
  // 认证相关
  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  }
  
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }
  
  async signOut() {
    return supabase.auth.signOut();
  }
  
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
  
  // 任务相关
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'vector_clock' | 'checksum' | 'is_deleted' | 'sync_status'>) {
    return supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
  }
  
  async updateTask(id: string, updates: Partial<Task>) {
    return supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  }
  
  async deleteTask(id: string) {
    return supabase
      .from('tasks')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }
  
  async getTasks(userId: string) {
    return supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
  }
  
  // 实时订阅
  subscribeToTasks(userId: string, callback: (payload: { eventType: string; new: Task; old?: Task }) => void) {
    return supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe();
  }
}

// 导出服务实例
export const supabaseService = new SupabaseService();