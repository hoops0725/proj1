import { db } from '../lib/db';
import type { Task, PendingOperation, SyncState } from '../lib/db';
import { ulid } from 'ulid';

// 生成任务的内容哈希
function generateChecksum(task: Partial<Task>): string {
  const content = JSON.stringify({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    tags: task.tags,
    project_id: task.project_id,
    parent_id: task.parent_id,
    due_date: task.due_date,
    due_time: task.due_time,
    reminder_at: task.reminder_at
  });
  
  // 使用简单的哈希算法
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为 32 位整数
  }
  return hash.toString(16);
}

// 生成唯一节点 ID
function getNodeId(): string {
  if (!localStorage.getItem('nodeId')) {
    localStorage.setItem('nodeId', ulid());
  }
  return localStorage.getItem('nodeId')!;
}

// 更新 Vector Clock
function updateVectorClock(currentClock: Record<string, number>): Record<string, number> {
  const nodeId = getNodeId();
  const newClock = { ...currentClock };
  newClock[nodeId] = (newClock[nodeId] || 0) + 1;
  return newClock;
}



// 任务服务类
export class TaskService {
  // 创建任务
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'vector_clock' | 'checksum' | 'is_deleted'> & { sort_order?: number }): Promise<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      sort_order: task.sort_order ?? 0,
      id: ulid(),
      created_at: now,
      updated_at: now,
      vector_clock: updateVectorClock({}),
      checksum: generateChecksum(task),
      is_deleted: false,
      sync_status: 'pending'
    };
    
    await db.tasks.add(newTask);
    
    // 添加到待同步队列
    await this.addToPendingQueue('CREATE', newTask);
    
    return newTask;
  }
  
  // 获取任务列表
  async getTasks(userId: string, options?: {
    status?: Task['status'];
    priority?: Task['priority'];
    tags?: string[];
  }): Promise<Task[]> {
    let query = db.tasks.where('user_id').equals(userId).and(task => !task.is_deleted);
    
    if (options?.status) {
      query = query.and(task => task.status === options.status);
    }
    
    if (options?.priority) {
      query = query.and(task => task.priority === options.priority);
    }
    
    if (options?.tags && options.tags.length > 0) {
      query = query.and(task => 
        options!.tags!.some(tag => task.tags.includes(tag))
      );
    }
    
    return query.toArray();
  }
  
  // 获取单个任务
  async getTaskById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }
  
  // 更新任务
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = await db.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = {
      ...task,
      ...updates,
      updated_at: new Date().toISOString(),
      vector_clock: updateVectorClock(task.vector_clock),
      checksum: generateChecksum({ ...task, ...updates }),
      sync_status: 'pending'
    };
    
    await db.tasks.put(updatedTask);
    
    // 添加到待同步队列
    await this.addToPendingQueue('UPDATE', updatedTask);
    
    return updatedTask;
  }

  // 标记任务已同步（不触发新的同步操作）
  async markTaskSynced(id: string): Promise<Task | undefined> {
    const task = await db.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = {
      ...task,
      sync_status: 'synced'
    };
    
    await db.tasks.put(updatedTask);
    
    return updatedTask;
  }
  
  // 删除任务（软删除）
  async deleteTask(id: string): Promise<boolean> {
    const task = await db.tasks.get(id);
    if (!task) return false;
    
    const updatedTask: Task = {
      ...task,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      vector_clock: updateVectorClock(task.vector_clock),
      sync_status: 'pending'
    };
    
    await db.tasks.put(updatedTask);
    
    // 添加到待同步队列
    await this.addToPendingQueue('DELETE', updatedTask);
    
    return true;
  }
  
  // 永久删除任务
  async permanentlyDeleteTask(id: string): Promise<boolean> {
    await db.tasks.delete(id);
    return true;
  }
  
  // 恢复已删除任务
  async restoreTask(id: string): Promise<Task | undefined> {
    const task = await db.tasks.get(id);
    if (!task || !task.is_deleted) return undefined;
    
    const updatedTask: Task = {
      ...task,
      is_deleted: false,
      deleted_at: undefined,
      vector_clock: updateVectorClock(task.vector_clock),
      sync_status: 'pending'
    };
    
    await db.tasks.put(updatedTask);
    
    // 添加到待同步队列
    await this.addToPendingQueue('UPDATE', updatedTask);
    
    return updatedTask;
  }
  
  // 添加到待同步队列
  private async addToPendingQueue(type: PendingOperation['type'], task: Task): Promise<void> {
    const operation: PendingOperation = {
      id: ulid(),
      type,
      table: 'tasks',
      payload: task,
      metadata: {
        original_timestamp: Date.now(),
        attempts: 0,
        priority: 1 // 默认优先级
      }
    };
    
    await db.pending_queue.add(operation);
  }
  
  // 获取待同步任务
  async getPendingOperations(): Promise<PendingOperation[]> {
    const operations = await db.pending_queue.toArray();
    // 按 priority 降序排序（优先级高的在前），然后按时间戳升序排序（早的在前）
    return operations.sort((a, b) => {
      if (b.metadata.priority !== a.metadata.priority) {
        return b.metadata.priority - a.metadata.priority;
      }
      return a.metadata.original_timestamp - b.metadata.original_timestamp;
    });
  }
  
  // 标记操作为已完成
  async markOperationComplete(operationId: string): Promise<void> {
    await db.pending_queue.delete(operationId);
  }
  
  // 增加操作重试次数
  async incrementOperationAttempts(operationId: string): Promise<void> {
    const operation = await db.pending_queue.get(operationId);
    if (operation) {
      await db.pending_queue.update(operationId, {
        'metadata.attempts': operation.metadata.attempts + 1
      });
    }
  }

  // 根据ID获取待处理操作
  async getPendingOperationById(operationId: string): Promise<PendingOperation | undefined> {
    return db.pending_queue.get(operationId);
  }

  // 获取所有任务（包括已删除的）
  async getAllTasks(): Promise<Task[]> {
    return db.tasks.toArray();
  }

  // 获取用户的同步状态
  async getSyncStateByUserId(userId: string): Promise<SyncState | undefined> {
    return db.sync_state.get(userId);
  }

  // 更新同步状态
  async updateSyncState(userId: string, updates: Partial<SyncState>): Promise<void> {
    await db.sync_state.update(userId, updates);
  }

  // 添加同步状态
  async addSyncState(state: SyncState): Promise<void> {
    await db.sync_state.add(state);
  }
}