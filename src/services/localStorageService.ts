import type { Task, SyncState } from '../lib/db';
import { TaskService } from './taskService';
import { supabaseService } from './supabaseService';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { supabase } from '../lib/supabase';

export class LocalStorageService {
  private taskService: TaskService;
  private isOnline: boolean;
  private syncInterval: ReturnType<typeof setInterval> | null;
  private realtimeSubscription: { unsubscribe: () => void } | null = null;

  constructor() {
    this.taskService = new TaskService();
    this.isOnline = navigator.onLine;
    this.syncInterval = null;
    this.realtimeSubscription = null;

    this.setupNetworkListeners();
    this.startSyncInterval();
    this.startRealtimeSubscription().catch(console.error);
  }

  private setupNetworkListeners() {
    window.addEventListener('online', async () => {
      this.isOnline = true;
      console.log('网络已连接，开始同步...');
      const user = await supabaseService.getCurrentUser();
      if (user?.id) {
        await this.syncPendingOperations(user.id);
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('网络已断开，切换到离线模式');
    });
  }

  private startSyncInterval() {
    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        const user = await supabaseService.getCurrentUser();
        if (user?.id) {
          await this.syncPendingOperations(user.id);
        }
      }
    }, 30000);
  }

  stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }

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

  async syncPendingOperations(userId: string) {
    try {
      await this.updateSyncState(userId, { sync_in_progress: true });

      const pendingOperations = await this.taskService.getPendingOperations();
      const adminClient = supabaseAdmin;

      // 日志：检查 supabaseAdmin 是否初始化成功
      console.log("=== 开始同步待处理操作 ===");
      console.log(`supabaseAdmin 是否可用: ${adminClient !== null}`);
      console.log(`待同步操作数量: ${pendingOperations.length}`);
      console.log(`当前用户ID: ${userId}`);

      for (const operation of pendingOperations) {
        try {
          console.log(`\n--- 处理操作: ${operation.type} - ${operation.id} ---`);
          console.log('操作数据:', JSON.stringify(operation.payload, null, 2));

          const client = adminClient || supabase;
          console.log(`使用客户端类型: ${adminClient ? 'supabaseAdmin (服务角色)' : 'supabase (普通用户)'}`);

          switch (operation.type) {
            case 'CREATE': {
              console.log('准备创建任务到 Supabase...');
              const createResult = await client
                .from('tasks')
                .insert({
                  user_id: operation.payload.user_id!,
                  title: operation.payload.title || '',
                  description: operation.payload.description,
                  priority: operation.payload.priority || 3,
                  status: operation.payload.status || 'todo',
                  tags: operation.payload.tags || [],
                  project_id: operation.payload.project_id,
                  parent_id: operation.payload.parent_id,
                  sort_order: operation.payload.sort_order ?? 0,
                  due_date: operation.payload.due_date,
                  due_time: operation.payload.due_time,
                  reminder_at: operation.payload.reminder_at,
                })
                .select()
                .single();
              console.log('创建任务结果:', createResult);
              break;
            }
            case 'UPDATE':
              if (operation.payload.id) {
                console.log(`准备更新任务: ${operation.payload.id}`);
                const updateResult = await client
                  .from('tasks')
                  .update({
                    title: operation.payload.title,
                    description: operation.payload.description,
                    priority: operation.payload.priority,
                    status: operation.payload.status,
                    tags: operation.payload.tags,
                    project_id: operation.payload.project_id,
                    parent_id: operation.payload.parent_id,
                    sort_order: operation.payload.sort_order,
                    due_date: operation.payload.due_date,
                    due_time: operation.payload.due_time,
                    reminder_at: operation.payload.reminder_at,
                    is_deleted: operation.payload.is_deleted,
                    deleted_at: operation.payload.deleted_at,
                  })
                  .eq('id', operation.payload.id);
                console.log('更新任务结果:', JSON.stringify(updateResult, null, 2));
              }
              break;
            case 'DELETE':
              if (operation.payload.id) {
                console.log(`准备删除任务: ${operation.payload.id}`);
                const deleteResult = await client
                  .from('tasks')
                  .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                  .eq('id', operation.payload.id);
                console.log('删除任务结果:', JSON.stringify(deleteResult, null, 2));
              }
              break;
          }

          await this.taskService.markOperationComplete(operation.id);

          if (operation.payload.id) {
            // 直接更新任务的同步状态，不触发新的同步操作
            const task = await this.taskService.getTaskById(operation.payload.id);
            if (task) {
              await this.taskService.markTaskSynced(operation.payload.id);
            }
          }
        } catch (error) {
          console.error('同步操作失败:', error);
          console.error('错误详情:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
          console.error('操作类型:', operation.type);
          console.error('操作ID:', operation.id);
          console.error('任务ID:', operation.payload.id);

          // 检查是否是请求被中止的错误
          if (error instanceof Error && error.message.includes('ERR_ABORTED')) {
            console.error('请求被中止！可能是网络问题或认证过期');
          }

          await this.taskService.incrementOperationAttempts(operation.id);

          const updatedOperation = await this.taskService.getPendingOperationById(operation.id);
          if (updatedOperation && updatedOperation.metadata.attempts > 5) {
            if (operation.payload.id) {
              const task = await this.taskService.getTaskById(operation.payload.id);
              if (task) {
                await this.taskService.updateTask(operation.payload.id, { sync_status: 'conflict' });
              }
            }

            await this.taskService.markOperationComplete(operation.id);
          }
        }
      }

      await this.updateSyncState(userId, {
        sync_in_progress: false,
        last_sync_at: new Date().toISOString(),
        last_error: undefined
      });

    } catch (error) {
      console.error('同步过程出错:', error);
      console.error('错误详情:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      await this.updateSyncState(userId, {
        sync_in_progress: false,
        last_error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  private async updateSyncState(userId: string, updates: Partial<SyncState>) {
    if (!userId) return;

    const existingState = await this.taskService.getSyncStateByUserId(userId);

    if (existingState) {
      await this.taskService.updateSyncState(userId, updates);
    } else {
      await this.taskService.addSyncState({
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        sync_in_progress: false,
        ...updates
      });
    }
  }

  async getSyncState(): Promise<SyncState | undefined> {
    const user = await supabaseService.getCurrentUser();
    const userId = user?.id;
    if (!userId) return undefined;

    return this.taskService.getSyncStateByUserId(userId);
  }

  async triggerSync() {
    if (this.isOnline) {
      const user = await supabaseService.getCurrentUser();
      if (user?.id) {
        await this.syncPendingOperations(user.id);
      }
    }
  }

  async cleanupExpiredData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await this.taskService.getAllTasks();
    for (const task of tasks) {
      if (task.is_deleted && task.deleted_at && new Date(task.deleted_at) < thirtyDaysAgo) {
        await this.taskService.permanentlyDeleteTask(task.id);
      }
    }

    const operations = await this.taskService.getPendingOperations();
    for (const operation of operations) {
      if (operation.metadata.attempts > 5) {
        await this.taskService.markOperationComplete(operation.id);
      }
    }
  }

  private async startRealtimeSubscription() {
    const user = await supabaseService.getCurrentUser();
    const userId = user?.id;
    if (!userId) return;

    this.stopRealtimeSubscription();

    this.realtimeSubscription = supabaseService.subscribeToTasks(userId, async (payload) => {
      await this.handleRealtimeUpdate(payload);
    });

    console.log('实时订阅已启动');
  }

  private stopRealtimeSubscription() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
      console.log('实时订阅已停止');
    }
  }

  private async handleRealtimeUpdate(payload: { eventType: string; new: Task; old?: Task }) {
    const { eventType, new: updatedTask } = payload;

    console.log(`收到实时更新: ${eventType} - ${updatedTask.id}`);

    try {
      const existingTask = await this.taskService.getTaskById(updatedTask.id);

      switch (eventType) {
        case 'INSERT':
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
              sort_order: updatedTask.sort_order,
              due_date: updatedTask.due_date,
              due_time: updatedTask.due_time,
              reminder_at: updatedTask.reminder_at,
            });
          }
          break;
        case 'UPDATE':
          if (existingTask && updatedTask.id) {
            const isConflict = this.detectConflict(existingTask, updatedTask);

            if (isConflict) {
              console.log('检测到冲突，正在解决...');
              const resolvedTask = this.resolveConflict(existingTask, updatedTask);

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
          if (existingTask && updatedTask.id) {
            await this.taskService.deleteTask(updatedTask.id);
          }
          break;
      }
    } catch (error) {
      console.error('处理实时更新失败:', error);
    }
  }

  private detectConflict(localTask: Task, remoteTask: Task): boolean {
    if (localTask.updated_at !== remoteTask.updated_at) {
      return true;
    }

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

  private resolveConflict(localTask: Task, remoteTask: Task): Task {
    if (new Date(localTask.updated_at || '') > new Date(remoteTask.updated_at || '')) {
      return localTask;
    } else if (new Date(localTask.updated_at || '') < new Date(remoteTask.updated_at || '')) {
      return remoteTask;
    } else {
      const localClock = localTask.vector_clock || {};
      const remoteClock = remoteTask.vector_clock || {};

      const localSum = Object.values(localClock).reduce((sum: number, value: unknown) => sum + (Number(value) || 0), 0);
      const remoteSum = Object.values(remoteClock).reduce((sum: number, value: unknown) => sum + (Number(value) || 0), 0);

      if (localSum > remoteSum) {
        return localTask;
      } else if (localSum < remoteSum) {
        return remoteTask;
      } else {
        const localNodeId = Object.keys(localClock)[0] || '';
        const remoteNodeId = Object.keys(remoteClock)[0] || '';

        return localNodeId > remoteNodeId ? localTask : remoteTask;
      }
    }
  }

  async restartRealtimeSubscription() {
    console.log('重新启动实时订阅...');
    this.stopRealtimeSubscription();
    await this.startRealtimeSubscription();
  }

  async initializeAndSync(userId: string) {
    console.log("开始初始化同步...");

    try {
      console.log("从 Supabase 加载任务...");
      const { data: remoteTasks, error: fetchError } = await supabaseService.getTasks(userId);

      if (fetchError) {
        console.error("从 Supabase 获取任务失败:", fetchError);
        throw fetchError;
      }

      console.log("从服务器获取到的任务数量:", remoteTasks?.length || 0);

      const pendingOperations = await this.taskService.getPendingOperations();
      console.log("本地待同步操作数量:", pendingOperations.length);

      if (remoteTasks && remoteTasks.length > 0) {
        for (const remoteTask of remoteTasks) {
          const existingTask = await this.taskService.getTaskById(remoteTask.id);

          if (!existingTask) {
            console.log("添加服务器任务到本地:", remoteTask.id);
            await this.taskService.createTask({
              user_id: remoteTask.user_id,
              title: remoteTask.title,
              description: remoteTask.description,
              priority: remoteTask.priority,
              status: remoteTask.status,
              tags: remoteTask.tags || [],
              project_id: remoteTask.project_id,
              parent_id: remoteTask.parent_id,
              sort_order: remoteTask.sort_order ?? 0,
              due_date: remoteTask.due_date,
              due_time: remoteTask.due_time,
              reminder_at: remoteTask.reminder_at,
            });

            await this.taskService.updateTask(remoteTask.id, { sync_status: "synced" });
          } else {
            const localTime = new Date(existingTask.updated_at || 0).getTime();
            const remoteTime = new Date(remoteTask.updated_at || 0).getTime();

            if (remoteTime > localTime) {
              console.log("更新本地任务（服务器更新）:", remoteTask.id);
              await this.taskService.updateTask(remoteTask.id, {
                title: remoteTask.title,
                description: remoteTask.description,
                priority: remoteTask.priority,
                status: remoteTask.status,
                tags: remoteTask.tags,
                project_id: remoteTask.project_id,
                parent_id: remoteTask.parent_id,
                due_date: remoteTask.due_date,
                due_time: remoteTask.due_time,
                reminder_at: remoteTask.reminder_at,
                is_deleted: remoteTask.is_deleted,
                deleted_at: remoteTask.deleted_at,
                sync_status: "synced",
              });
            }
          }
        }
      }

      if (pendingOperations.length > 0) {
        console.log("开始同步本地待处理操作...");
        await this.syncPendingOperations(userId);
      }

      console.log("初始化同步完成");

    } catch (error) {
      console.error("初始化同步失败:", error);
      throw error;
    }
  }
}

export const localStorageService = new LocalStorageService();
