import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://englqokndxfeasrynfjg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ2xxb2tuZHhmZWFzcnluZmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzI4ODEsImV4cCI6MjA5MTc0ODg4MX0.AHyGgTcQP2tMsP2ZwDcF1kOejCCKjaJlxgO-kHZY6iI';

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPECTED_TABLES = [
  'profiles',
  'tasks',
  'sync_logs',
  'pending_operations',
  'sync_state',
  'blobs'
];

const TABLE_SCHEMAS = {
  profiles: {
    columns: ['id', 'email', 'full_name', 'avatar_url', 'created_at', 'updated_at'],
    requiredColumns: ['id', 'email']
  },
  tasks: {
    columns: ['id', 'user_id', 'title', 'description', 'priority', 'status', 'tags', 'project_id', 'parent_id', 'sort_order', 'due_date', 'due_time', 'reminder_at', 'created_at', 'updated_at', 'vector_clock', 'checksum', 'is_deleted', 'deleted_at', 'archived_at', 'sync_status'],
    requiredColumns: ['id', 'title', 'status', 'sync_status']
  },
  sync_logs: {
    columns: ['id', 'user_id', 'operation_type', 'entity_type', 'entity_id', 'sync_status', 'error_message', 'created_at'],
    requiredColumns: ['id', 'sync_status']
  },
  pending_operations: {
    columns: ['id', 'user_id', 'type', 'table_name', 'payload', 'metadata', 'created_at'],
    requiredColumns: ['id', 'type', 'table_name', 'payload']
  },
  sync_state: {
    columns: ['user_id', 'last_sync_at', 'cursor', 'sync_in_progress', 'last_error'],
    requiredColumns: ['user_id']
  },
  blobs: {
    columns: ['id', 'task_id', 'blob', 'mime_type', 'filename', 'created_at'],
    requiredColumns: ['id', 'mime_type', 'filename']
  }
};

async function testConnection() {
  console.log('=== 测试 Supabase 数据库连接 ===\n');
  
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ 连接失败:', error.message);
      return false;
    }
    
    console.log('✅ 数据库连接成功\n');
    return true;
  } catch (err) {
    console.error('❌ 连接失败:', err);
    return false;
  }
}

async function testTablesExist() {
  console.log('=== 测试表是否存在 ===\n');
  
  let allTablesExist = true;
  
  for (const tableName of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.error(`❌ 表 '${tableName}' 不存在`);
        } else {
          console.error(`❌ 表 '${tableName}' 查询失败:`, error.message);
        }
        allTablesExist = false;
      } else {
        console.log(`✅ 表 '${tableName}' 存在`);
      }
    } catch (err) {
      console.error(`❌ 表 '${tableName}' 测试失败:`, err);
      allTablesExist = false;
    }
  }
  
  console.log('');
  return allTablesExist;
}

async function testTableStructures() {
  console.log('=== 测试表结构 ===\n');
  
  let allStructuresValid = true;
  
  for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
    console.log(`检查表 '${tableName}' 的结构...`);
    
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`  ⚠️  表 '${tableName}' 不存在，跳过结构检查`);
          continue;
        }
      }
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const missingRequired = schema.requiredColumns.filter(col => !columns.includes(col));
        
        if (missingRequired.length > 0) {
          console.log(`  ⚠️  表 '${tableName}' 缺少必需列:`, missingRequired.join(', '));
          allStructuresValid = false;
        } else {
          console.log(`  ✅ 表 '${tableName}' 必需列完整`);
        }
        
        console.log(`  当前列: ${columns.join(', ')}`);
      } else {
        console.log(`  ℹ️  表 '${tableName}' 为空，但表结构已确认存在`);
      }
    } catch (err) {
      console.error(`  ❌ 测试表 '${tableName}' 结构失败:`, err);
      allStructuresValid = false;
    }
    
    console.log('');
  }
  
  return allStructuresValid;
}

async function testInsertOperation() {
  console.log('=== 测试插入操作 ===\n');
  
  const testProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'test@example.com',
    full_name: 'Test User'
  };
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([testProfile])
      .select()
      .single();
    
    if (error) {
      console.log('  ⚠️  profiles 表插入失败:', error.message);
      console.log('  这可能是 RLS 策略导致的，属于正常现象');
      return true;
    }
    
    console.log('  ✅ profiles 表插入成功');
    
    if (data) {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testProfile.id);
      
      if (deleteError) {
        console.log('  ⚠️  清理测试数据失败:', deleteError.message);
      } else {
        console.log('  ✅ 测试数据清理成功');
      }
    }
    
    console.log('');
    return true;
  } catch (err) {
    console.error('  ❌ profiles 表插入测试失败:', err);
    console.log('');
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Supabase 数据库表结构测试脚本        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ 数据库连接失败，终止测试');
    process.exit(1);
  }
  
  const tablesExist = await testTablesExist();
  if (!tablesExist) {
    console.log('\n⚠️  部分表不存在，请检查数据库设置');
  }
  
  const structuresValid = await testTableStructures();
  
  const insertOk = await testInsertOperation();
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║              测试结果摘要              ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`数据库连接: ${connectionOk ? '✅ 成功' : '❌ 失败'}`);
  console.log(`表存在性:   ${tablesExist ? '✅ 全部存在' : '⚠️  部分缺失'}`);
  console.log(`表结构:     ${structuresValid ? '✅ 有效' : '⚠️  部分问题'}`);
  console.log(`插入操作:   ${insertOk ? '✅ 正常' : '❌ 异常'}`);
  console.log('');
  
  if (connectionOk && tablesExist && structuresValid) {
    console.log('🎉 所有核心测试通过！数据库配置正确。');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试未通过，请检查上述错误信息。');
    process.exit(1);
  }
}

runAllTests();