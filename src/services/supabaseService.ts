import { supabase } from '../lib/supabase';
import type { Task } from '../lib/db';

export class SupabaseService {
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

  subscribeToTasks(userId: string, callback: (payload: { eventType: string; new: Task; old?: Task }) => void) {
    const channelName = `user-${userId}`;
    
    // 先检查是否已经存在同名的 channel，如果存在则先取消订阅
    const existingChannel = supabase.channel(channelName);
    existingChannel.unsubscribe();

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload as unknown as { eventType: string; new: Task; old?: Task })
      )
      .subscribe();

    return channel;
  }
}

export const supabaseService = new SupabaseService();