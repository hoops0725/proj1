import Dexie from 'dexie';
import type { Table } from 'dexie';

// 任务类型定义
export interface Task {
  id: string;                    // 全局唯一 (CUID2 或 UUIDv7)
  user_id: string;               // RLS 策略核心字段，不可修改
  title: string;                 // 限制 200 字符，XSS 过滤
  description?: string;          // 富文本（ProseMirror/Tiptap 格式）
  priority: 1 | 2 | 3 | 4;       // 1=紧急 2=高 3=中 4=低，数字便于排序
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  tags: string[];                // GIN 索引，支持标签筛选
  project_id?: string;           // 可选的项目分组
  parent_id?: string;            // 子任务支持（自引用外键）
  sort_order: number;            // 手动排序权重（浮点数支持中间插入）
  due_date?: string;             // 截止日期（无时区，本地解析）
  due_time?: string;             // 可选的具体时间
  reminder_at?: string;          // 提醒时间
  created_at: string;            // 服务端创建时间（不可变）
  updated_at: string;            // 服务端最后修改
  vector_clock: Record<string, number>;  // 冲突检测向量时钟
  checksum: string;              // 内容哈希，快速比对变更
  is_deleted: boolean;           // 软删除标记（垃圾箱机制）
  deleted_at?: string;           // 自动清理 30 天旧数据
  archived_at?: string;          // 归档时间
  sync_status?: 'synced' | 'pending' | 'conflict'; // 同步状态
}

// 待同步操作队列
export interface PendingOperation {
  id: string;                  // 操作 ID (ulid)
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'tasks';
  payload: Partial<Task>;
  metadata: {
    original_timestamp: number; // 本地操作时间
    attempts: number;          // 重试次数
    priority: number;          // 同步优先级（用户主动同步>后台）
  };
}

// 同步状态
export interface SyncState {
  user_id: string;
  last_sync_at: string;
  cursor?: string;             // 同步游标
  sync_in_progress: boolean;   // 是否正在同步
  last_error?: string;         // 上次同步错误
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
  tasks!: Table<Task, 'id'>;
  pending_queue!: Table<PendingOperation, 'id'>;
  sync_state!: Table<SyncState, 'user_id'>;
  blobs!: Table<AttachmentBlob, 'id'>;

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