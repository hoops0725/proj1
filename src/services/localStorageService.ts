import { db } from '../lib/db';
import type { SyncState } from '../lib/db';
import { TaskService } from './taskService';
import { supabase, supabaseService } from './supabaseService';

// 本地存储服务类
export class LocalStorageService {
  private taskService: TaskService;
  private isOnline: boolean;
  private syncInterval: NodeJS.Timeout | null;
  private realtimeSubscription: { unsubscribe: () => void } | null = null;

  constructor() {
    this.taskService = new TaskService();
    this.isOnline = navigator.onLine;
    this.syncInterval = null;
    this.realtimeSubscription = null;
    
    // 监听网络状态变化
    this.setupNetworkListeners();
    
    // 启动同步间隔
    this.startSyncInterval();
    
    // 启动实时订阅
    this.startRealtimeSubscription();
  }
  
  // 设置网络状态监听器
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('网络已连接，开始同步...');
      this.syncPendingOperations();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('网络已断开，切换到离线模式');
    });
  }
  
  // 启动同步间隔
  private startSyncInterval() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingOperations();
      }
    }, 30000); // 每 30 秒同步一次
  }
  
  // 停止同步间隔
  stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // 获取网络状态
  getNetworkStatus(): boolean {
    return this.isOnline;
  }
  
  // 任务相关操作
  async createTask(taskData: Parameters<TaskService['createTask']>[0]) {
    return this.taskService.createTask(taskData);
  }
  
  async getTasks(userId: string, options?: Parameters<TaskService['getTasks']>[1]) {
    return this.taskService.getTasks(userId, options);
  }
  
  async getTaskById(id: string) {
    return this.taskService.getTaskById(id);
  }
  
  async updateTask(id: string, updates: Parameters<TaskService['updateTask']>[1]) {
    return this.taskService.updateTask(id, updates);
  }
  
  async deleteTask(id: string) {
    return this.taskService.deleteTask(id);
  }
  
  async restoreTask(id: string) {
    return this.taskService.restoreTask(id);
  }
  
  // 同步待处理操作
  async syncPendingOperations() {
    try {
      // 更新同步状态
      await this.updateSyncState({ sync_in_progress: true });
      
      const pendingOperations = await this.taskService.getPendingOperations();
      
      for (const operation of pendingOperations) {
        try {
          console.log(`同步操作: ${operation.type} - ${operation.payload.id}`);
          
          // 根据操作类型调用相应的 Supabase 服务方法
          switch (operation.type) {
            case 'CREATE':
              await supabaseService.createTask({
                user_id: operation.payload.user_id,
                title: operation.payload.title,
                description: operation.payload.description,
                priority: operation.payload.priority,
                status: operation.payload.status,
                tags: operation.payload.tags,
                project_id: operation.payload.project_id,
                parent_id: operation.payload.parent_id,
                due_date: operation.payload.due_date,
                due_time: operation.payload.due_time,
                reminder_at: operation.payload.reminder_at,
              });
              break;
            case 'UPDATE':
              await supabaseService.updateTask(operation.payload.id, {
                title: operation.payload.title,
                description: operation.payload.description,
                priority: operation.payload.priority,
                status: operation.payload.status,
                tags: operation.payload.tags,
                project_id: operation.payload.project_id,
                parent_id: operation.payload.parent_id,
                due_date: operation.payload.due_date,
                due_time: operation.payload.due_time,
                reminder_at: operation.payload.reminder_at,
                is_deleted: operation.payload.is_deleted,
                deleted_at: operation.payload.deleted_at,
              });
              break;
            case 'DELETE':
              await supabaseService.deleteTask(operation.payload.id);
              break;
          }
          
          // 标记操作为已完成
          await this.taskService.markOperationComplete(operation.id);
          
          // 更新任务的同步状态
          if (operation.payload.id) {
            const task = await this.taskService.getTaskById(operation.payload.id);
            if (task) {
              await this.taskService.updateTask(operation.payload.id, { sync_status: 'synced' });
            }
          }
        } catch (error) {
          console.error('同步操作失败:', error);
          
          // 增加重试次数
          await this.taskService.incrementOperationAttempts(operation.id);
          
          // 检查重试次数，如果超过 5 次，标记为同步失败
          const updatedOperation = await db.pending_queue.get(operation.id);
          if (updatedOperation && updatedOperation.metadata.attempts > 5) {
            // 更新任务的同步状态为失败
            if (operation.payload.id) {
              const task = await this.taskService.getTaskById(operation.payload.id);
              if (task) {
                await this.taskService.updateTask(operation.payload.id, { sync_status: 'failed' });
              }
            }
            
            // 从待同步队列中移除
            await this.taskService.markOperationComplete(operation.id);
          }
        }
      }
      
      // 更新同步状态
      await this.updateSyncState({ 
        sync_in_progress: false,
        last_sync_at: new Date().toISOString(),
        last_error: null
      });
      
    } catch (error) {
      console.error('同步过程出错:', error);
      await this.updateSyncState({ 
        sync_in_progress: false,
        last_error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  // 更新同步状态
  private async updateSyncState(updates: Partial<SyncState>) {
    const userId = supabase.auth.user()?.id;
    if (!userId) return;
    
    const existingState = await db.sync_state.get(userId);
    
    if (existingState) {
      await db.sync_state.update(userId, updates);
    } else {
      await db.sync_state.add({
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        sync_in_progress: false,
        ...updates
      });
    }
  }
  
  // 获取同步状态
  async getSyncState(): Promise<SyncState | undefined> {
    const userId = supabase.auth.user()?.id;
    if (!userId) return undefined;
    
    return db.sync_state.get(userId);
  }
  
  // 手动触发同步
  async triggerSync() {
    if (this.isOnline) {
      await this.syncPendingOperations();
    }
  }
  
  // 清理过期数据
  async cleanupExpiredData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 清理 30 天前的已删除任务
    const tasks = await db.tasks.where('is_deleted').equals(true).toArray();
    for (const task of tasks) {
      if (task.deleted_at && new Date(task.deleted_at) < thirtyDaysAgo) {
        await this.taskService.permanentlyDeleteTask(task.id);
      }
    }
    
    // 清理失败次数过多的操作
    const operations = await db.pending_queue.where('metadata.attempts').above(5).toArray();
    for (const operation of operations) {
      await db.pending_queue.delete(operation.id);
    }
  }
  
  // 启动实时订阅
  private startRealtimeSubscription() {
    const userId = supabase.auth.user()?.id;
    if (!userId) return;
    
    // 停止现有的订阅
    this.stopRealtimeSubscription();
    
    // 启动新的订阅
    this.realtimeSubscription = supabaseService.subscribeToTasks(userId, async (payload) => {
      await this.handleRealtimeUpdate(payload);
    });
    
    console.log('实时订阅已启动');
  }
  
  // 停止实时订阅
  private stopRealtimeSubscription() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
      console.log('实时订阅已停止');
    }
  }
  
  // 处理实时更新
  private async handleRealtimeUpdate(payload: { eventType: string; new: Partial<Task>; old?: Partial<Task> }) {
    const { eventType, new: updatedTask } = payload;
    
    console.log(`收到实时更新: ${eventType} - ${updatedTask.id}`);
    
    try {
      // 检查任务是否已存在于本地数据库
      const existingTask = await this.taskService.getTaskById(updatedTask.id);
      
      switch (eventType) {
        case 'INSERT':
          // 如果任务不存在于本地，添加它
          if (!existingTask) {
            await this.taskService.createTask({
              user_id: updatedTask.user_id,
              title: updatedTask.title,
              description: updatedTask.description,
              priority: updatedTask.priority,
              status: updatedTask.status,
              tags: updatedTask.tags,
              project_id: updatedTask.project_id,
              parent_id: updatedTask.parent_id,
              due_date: updatedTask.due_date,
              due_time: updatedTask.due_time,
              reminder_at: updatedTask.reminder_at,
            });
          }
          break;
        case 'UPDATE':
          // 检查是否存在冲突
          if (existingTask) {
            // 检测冲突
            const isConflict = this.detectConflict(existingTask, updatedTask);
            
            if (isConflict) {
              console.log('检测到冲突，正在解决...');
              
              // 解决冲突
              const resolvedTask = this.resolveConflict(existingTask, updatedTask);
              
              // 更新本地任务
              await this.taskService.updateTask(updatedTask.id, {
                title: resolvedTask.title,
                description: resolvedTask.description,
                priority: resolvedTask.priority,
                status: resolvedTask.status,
                tags: resolvedTask.tags,
                project_id: resolvedTask.project_id,
                parent_id: resolvedTask.parent_id,
                due_date: resolvedTask.due_date,
                due_time: resolvedTask.due_time,
                reminder_at: resolvedTask.reminder_at,
                is_deleted: resolvedTask.is_deleted,
                deleted_at: resolvedTask.deleted_at,
                vector_clock: resolvedTask.vector_clock,
                sync_status: 'synced',
              });
            } else {
              // 无冲突，直接更新
              await this.taskService.updateTask(updatedTask.id, {
                title: updatedTask.title,
                description: updatedTask.description,
                priority: updatedTask.priority,
                status: updatedTask.status,
                tags: updatedTask.tags,
                project_id: updatedTask.project_id,
                parent_id: updatedTask.parent_id,
                due_date: updatedTask.due_date,
                due_time: updatedTask.due_time,
                reminder_at: updatedTask.reminder_at,
                is_deleted: updatedTask.is_deleted,
                deleted_at: updatedTask.deleted_at,
                sync_status: 'synced',
              });
            }
          }
          break;
        case 'DELETE':
          // 标记任务为已删除
          if (existingTask) {
            await this.taskService.deleteTask(updatedTask.id);
          }
          break;
      }
    } catch (error) {
      console.error('处理实时更新失败:', error);
    }
  }
  
  // 检测冲突
  private detectConflict(localTask: Partial<Task>, remoteTask: Partial<Task>): boolean {
    // 检查时间戳
    if (localTask.updated_at !== remoteTask.updated_at) {
      return true;
    }
    
    // 检查 Vector Clock
    const localKeys = Object.keys(localTask.vector_clock || {});
    const remoteKeys = Object.keys(remoteTask.vector_clock || {});
    
    if (localKeys.length !== remoteKeys.length) {
      return true;
    }
    
    for (const key of localKeys) {
      if (localTask.vector_clock?.[key] !== remoteTask.vector_clock?.[key]) {
        return true;
      }
    }
    
    return false;
  }
  
  // 解决冲突（LWW + Vector Clock）
  private resolveConflict(localTask: Partial<Task>, remoteTask: Partial<Task>): Partial<Task> {
    // 首先比较时间戳（LWW）
    if (new Date(localTask.updated_at || '') > new Date(remoteTask.updated_at || '')) {
      return localTask;
    } else if (new Date(localTask.updated_at || '') < new Date(remoteTask.updated_at || '')) {
      return remoteTask;
    } else {
      // 时间戳相同，比较 Vector Clock
      const localClock = localTask.vector_clock || {};
      const remoteClock = remoteTask.vector_clock || {};
      
      // 计算 Vector Clock 的总和
      const localSum = Object.values(localClock).reduce((sum, value) => sum + value, 0);
      const remoteSum = Object.values(remoteClock).reduce((sum, value) => sum + value, 0);
      
      if (localSum > remoteSum) {
        return localTask;
      } else if (localSum < remoteSum) {
        return remoteTask;
      } else {
        // 总和相同，比较节点 ID（字典序）
        const localNodeId = Object.keys(localClock)[0] || '';
        const remoteNodeId = Object.keys(remoteClock)[0] || '';
        
        return localNodeId > remoteNodeId ? localTask : remoteTask;
      }
    }
  }
  
  // 重新启动实时订阅（例如，当用户登录后）
  restartRealtimeSubscription() {
    this.startRealtimeSubscription();
  }
}

// 导出单例实例
export const localStorageService = new LocalStorageService();