-- 最简单的解决方案：修改 RLS 策略以允许认证用户创建 profile

-- 首先禁用 RLS（临时解决方案）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 或者，如果你想保留 RLS，使用以下策略：
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
-- CREATE POLICY "Users can insert their own profile" 
--   ON profiles FOR INSERT 
--   TO authenticated
--   WITH CHECK (true);

-- DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
-- CREATE POLICY "Users can update their own profile" 
--   ON profiles FOR UPDATE 
--   TO authenticated
--   USING (auth.uid() = id);

-- DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
-- CREATE POLICY "Users can view their own profile" 
--   ON profiles FOR SELECT 
--   TO authenticated
--   USING (auth.uid() = id);
