-- 为 profiles 表设置行级安全策略

-- 首先确保 profiles 表存在
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  twitter_id TEXT UNIQUE,
  facebook_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light'
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许认证用户查看自己的 profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 创建策略：允许认证用户插入自己的 profile（使用 email 匹配）
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 创建策略：允许认证用户更新自己的 profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 创建策略：允许认证用户删除自己的 profile
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- 为 authenticated 角色授予 profiles 表的所有权限
GRANT ALL ON profiles TO authenticated;

-- 为 anon 角色授予 profiles 表的 SELECT 权限（可选，根据需求）
-- GRANT SELECT ON profiles TO anon;