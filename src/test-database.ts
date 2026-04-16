import Dexie from 'dexie';
import type { Table } from 'dexie';
import { ulid } from 'ulid';

// 任务类型定义
interface Task {
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
interface PendingOperation {
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
interface SyncState {
  user_id: string;
  last_sync_at: string;
  cursor?: string;             // 同步游标
  sync_in_progress: boolean;   // 是否正在同步
  last_error?: string;         // 上次同步错误
}

// 附件缓存
interface AttachmentBlob {
  id: string;
  task_id: string;
  blob: Blob;
  mime_type: string;
  filename: string;
  created_at: string;
}

// 数据库类
class TodoDatabase extends Dexie {
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

// 创建数据库实例
const db = new TodoDatabase();

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

// 测试数据库功能
async function testDatabase() {
  console.log('=== 测试数据库功能 ===');
  
  try {
    // 清空数据库（测试前）
    await db.tasks.clear();
    await db.pending_queue.clear();
    await db.sync_state.clear();
    console.log('数据库已清空');
    
    // 测试创建任务
    console.log('1. 测试创建任务...');
    const now = new Date().toISOString();
    const testTask: Task = {
      id: ulid(),
      user_id: 'test-user-123',
      title: '测试任务',
      description: '这是一个测试任务',
      priority: 2,
      status: 'todo',
      tags: ['测试', '开发'],
      sort_order: 1,
      created_at: now,
      updated_at: now,
      vector_clock: {},
      checksum: generateChecksum({ title: '测试任务' }),
      is_deleted: false,
      sync_status: 'pending'
    };
    await db.tasks.add(testTask);
    console.log('创建任务成功:', testTask.id);
    
    // 测试获取任务列表
    console.log('2. 测试获取任务列表...');
    const tasks = await db.tasks.where('user_id').equals('test-user-123').toArray();
    console.log('任务列表数量:', tasks.length);
    
    // 测试获取单个任务
    console.log('3. 测试获取单个任务...');
    const task = await db.tasks.get(testTask.id);
    console.log('获取任务成功:', task?.title);
    
    // 测试更新任务
    console.log('4. 测试更新任务...');
    await db.tasks.update(testTask.id, {
      title: '更新后的测试任务',
      status: 'in_progress' as const,
      updated_at: new Date().toISOString()
    });
    const updatedTask = await db.tasks.get(testTask.id);
    console.log('更新任务成功:', updatedTask?.title, updatedTask?.status);
    
    // 测试删除任务（软删除）
    console.log('5. 测试删除任务...');
    await db.tasks.update(testTask.id, {
      is_deleted: true,
      deleted_at: new Date().toISOString()
    });
    const deletedTask = await db.tasks.get(testTask.id);
    console.log('删除任务成功:', deletedTask?.is_deleted);
    
    // 测试待同步操作
    console.log('6. 测试待同步操作...');
    const pendingOperation: PendingOperation = {
      id: ulid(),
      type: 'CREATE',
      table: 'tasks',
      payload: testTask,
      metadata: {
        original_timestamp: Date.now(),
        attempts: 0,
        priority: 1
      }
    };
    await db.pending_queue.add(pendingOperation);
    const operations = await db.pending_queue.toArray();
    console.log('待同步操作数量:', operations.length);
    
    // 测试同步状态
    console.log('7. 测试同步状态...');
    const syncState: SyncState = {
      user_id: 'test-user-123',
      last_sync_at: new Date().toISOString(),
      sync_in_progress: false
    };
    await db.sync_state.add(syncState);
    const savedSyncState = await db.sync_state.get('test-user-123');
    console.log('同步状态保存成功:', savedSyncState?.last_sync_at);
    
    // 测试清理数据
    console.log('8. 测试清理数据...');
    await db.pending_queue.delete(pendingOperation.id);
    await db.sync_state.delete('test-user-123');
    await db.tasks.delete(testTask.id);
    
    // 验证清理结果
    const finalTasks = await db.tasks.toArray();
    const finalOperations = await db.pending_queue.toArray();
    const finalSyncState = await db.sync_state.toArray();
    
    console.log('清理后任务数量:', finalTasks.length);
    console.log('清理后操作数量:', finalOperations.length);
    console.log('清理后同步状态数量:', finalSyncState.length);
    
    console.log('=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 测试完成后清空数据库
    await db.tasks.clear();
    await db.pending_queue.clear();
    await db.sync_state.clear();
    console.log('数据库已清空');
  }
}

// 运行测试
testDatabase();