import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 从环境变量读取 Supabase 配置
const supabaseUrl = 'https://englqokndxfeasrynfjg.supabase.co';
// 注意：这里需要使用 service_role 密钥，而不是 anon 密钥
// 你可以在 Supabase 控制台的 API 设置中找到 service_role 密钥
const supabaseServiceKey = 'your_service_role_key_here';

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 读取 SQL 文件
const sqlContent = fs.readFileSync('supabase_schema.sql', 'utf8');

// 打印 SQL 内容，以便用户可以在 Supabase 控制台执行
console.log('=== 请在 Supabase 控制台的 SQL Editor 中执行以下 SQL 语句 ===');
console.log('');
console.log(sqlContent);
console.log('');
console.log('=== SQL 语句结束 ===');
console.log('');
console.log('执行步骤：');
console.log('1. 登录 Supabase 控制台：https://app.supabase.com');
console.log('2. 选择你的项目：englqokndxfeasrynfjg');
console.log('3. 点击左侧菜单的 "SQL Editor"');
console.log('4. 复制上面的 SQL 语句并粘贴到编辑器中');
console.log('5. 点击 "Run" 按钮执行');
console.log('6. 执行完成后检查是否有错误');