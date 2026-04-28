/**
 * OAuth 配置验证脚本
 * 用于验证 Google 和 GitHub OAuth 配置是否正确
 */

import { supabase } from './src/lib/supabase';

async function testOAuthConfiguration() {
  console.log('=== OAuth 配置验证测试 ===\n');
  
  // 测试 1: 检查 Supabase 连接
  console.log('1. 检查 Supabase 连接...');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('   ❌ Supabase 连接失败:', error.message);
      return;
    }
    console.log('   ✅ Supabase 连接正常');
  } catch (err) {
    console.error('   ❌ Supabase 连接异常:', err);
    return;
  }
  
  // 测试 2: 检查 Google OAuth 配置
  console.log('\n2. 检查 Google OAuth 配置...');
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5174',
        skipBrowserRedirect: true  // 不实际跳转，仅验证配置
      }
    });
    
    if (error) {
      if (error.message.includes('redirect_uri')) {
        console.error('   ❌ Google OAuth 配置错误 - redirect_uri 不匹配');
      } else if (error.message.includes('client_id')) {
        console.error('   ❌ Google OAuth 配置错误 - client_id 无效');
      } else {
        console.error('   ❌ Google OAuth 配置错误:', error.message);
      }
    } else {
      console.log('   ✅ Google OAuth 配置正常');
    }
  } catch (err) {
    console.error('   ❌ Google OAuth 测试异常:', err);
  }
  
  // 测试 3: 检查 GitHub OAuth 配置
  console.log('\n3. 检查 GitHub OAuth 配置...');
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'http://localhost:5174',
        skipBrowserRedirect: true  // 不实际跳转，仅验证配置
      }
    });
    
    if (error) {
      if (error.message.includes('redirect_uri')) {
        console.error('   ❌ GitHub OAuth 配置错误 - redirect_uri 不匹配');
      } else if (error.message.includes('client_id')) {
        console.error('   ❌ GitHub OAuth 配置错误 - client_id 无效');
      } else {
        console.error('   ❌ GitHub OAuth 配置错误:', error.message);
      }
    } else {
      console.log('   ✅ GitHub OAuth 配置正常');
    }
  } catch (err) {
    console.error('   ❌ GitHub OAuth 测试异常:', err);
  }
  
  // 测试 4: 检查回调 URL 配置
  console.log('\n4. 检查回调 URL 配置...');
  const redirectUrls = [
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  console.log('   推荐配置的回调 URL:');
  redirectUrls.forEach(url => {
    console.log(`     - ${url}`);
  });
  
  console.log('\n=== 测试完成 ===');
  console.log('\n提示:');
  console.log('1. 请确保在 Supabase 控制台配置了正确的 OAuth 凭证');
  console.log('2. 请确保回调 URL 已添加到 Supabase 的 "Site URL" 和 OAuth 设置中');
  console.log('3. 如需实际测试登录，请访问 http://localhost:5174/auth/login');
}

// 运行测试
testOAuthConfiguration().catch(console.error);