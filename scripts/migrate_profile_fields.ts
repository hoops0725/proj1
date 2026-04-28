import { supabaseAdmin } from '../src/lib/supabaseAdmin';

async function migrateProfileFields() {
  console.log('开始迁移 profiles 表字段...');
  
  try {
    // 添加 country 字段
    const { error: countryError } = await supabaseAdmin.rpc('execute_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;'
    });
    
    if (countryError) {
      console.error('添加 country 字段失败:', countryError);
    } else {
      console.log('✓ 成功添加 country 字段');
    }
    
    // 添加 city 字段
    const { error: cityError } = await supabaseAdmin.rpc('execute_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;'
    });
    
    if (cityError) {
      console.error('添加 city 字段失败:', cityError);
    } else {
      console.log('✓ 成功添加 city 字段');
    }
    
    // 确保 avatar_url 字段存在（可能已存在）
    const { error: avatarError } = await supabaseAdmin.rpc('execute_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    });
    
    if (avatarError) {
      console.error('添加 avatar_url 字段失败:', avatarError);
    } else {
      console.log('✓ avatar_url 字段已存在或成功添加');
    }
    
    console.log('\n数据库迁移完成！');
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

migrateProfileFields();