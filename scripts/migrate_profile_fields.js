const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateProfileFields() {
  console.log('开始迁移 profiles 表字段...');
  
  try {
    // 直接使用 postgrest API 执行 SQL（通过 rpc 或其他方式）
    // 由于 Supabase JS SDK 不直接支持执行任意 SQL，我们使用 fetch 调用
    
    const sqlCommands = [
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    ];
    
    for (const sql of sqlCommands) {
      console.log(`执行: ${sql.trim()}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: sql })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.warn(`警告: ${error.message || '执行失败'}`);
      } else {
        console.log('✓ 执行成功');
      }
    }
    
    console.log('\n数据库迁移完成！');
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

migrateProfileFields();