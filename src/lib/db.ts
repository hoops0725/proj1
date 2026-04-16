import Dexie from 'dexie';

// 任务类型定义
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  tags: string[];
  project_id?: string;
  parent_id?: string;
  sort_order: number;
  due_date?: string;
  due_time?: string;
  reminder_at?: string;
  created_at: string;
  updated_at: string;
  vector_clock: Record<string, number>;
  checksum: string;
  is_deleted: boolean;
  deleted_at?: string;
  archived_at?: string;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

// 待同步操作队列
export interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'tasks';
  payload: Partial<Task>;
  metadata: {
    original_timestamp: number;
    attempts: number;
    priority: number;
  };
}

// 同步状态
export interface SyncState {
  user_id: string;
  last_sync_at: string;
  cursor?: string;
  sync_in_progress: boolean;
  last_error?: string;
}

// 附件缓存
export interface AttachmentBlob {
  id: string;
  task_id: string;
  blob: Blob;
  mime_type: string;
  filename: string;
  created_at: string;
}

// 数据库类
export class TodoDatabase extends Dexie {
  tasks!: Dexie.Table<Task, 'id'>;
  pending_queue!: Dexie.Table<PendingOperation, 'id'>;
  sync_state!: Dexie.Table<SyncState, 'user_id'>;
  blobs!: Dexie.Table<AttachmentBlob, 'id'>;

  constructor() {
    super('TodoApp_v3');
    
    this.version(1).stores({
      tasks: 'id, user_id, status, priority, updated_at, [user_id+status]',
      pending_queue: 'id, metadata.original_timestamp, metadata.attempts',
      sync_state: 'user_id, last_sync_at',
      blobs: 'id, task_id, created_at'
    });
  }
}

// 导出数据库实例
export const db = new TodoDatabase();