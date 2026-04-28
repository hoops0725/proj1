import { supabase } from '../lib/supabase';
import type { Task } from '../lib/db';

export class OnlineTaskService {
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取任务失败:', error);
      throw error;
    }

    return data || [];
  }

  async createTask(taskData: {
    user_id: string;
    title: string;
    description?: string;
    priority?: number;
    status?: string;
    tags?: string[];
    project_id?: string;
    parent_id?: string;
    sort_order?: number;
    due_date?: string;
    due_time?: string;
    reminder_at?: string;
  }): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error('创建任务失败:', error);
      throw error;
    }

    return data;
  }

  async updateTask(userId: string, id: string, updates: Partial<Task>): Promise<Task | null> {
    // 确保不能修改 user_id
    if (updates.user_id && updates.user_id !== userId) {
      throw new Error('无权修改任务所属用户');
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)  // 添加 user_id 过滤，防止越权访问
      .select()
      .single();

    if (error) {
      console.error('更新任务失败:', error);
      throw error;
    }

    return data;
  }

  async deleteTask(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);  // 添加 user_id 过滤，防止越权删除

    if (error) {
      console.error('删除任务失败:', error);
      throw error;
    }

    return true;
  }
}

export const onlineTaskService = new OnlineTaskService();