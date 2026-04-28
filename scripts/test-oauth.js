#!/usr/bin/env node
/**
 * OAuth 配置验证脚本
 * 运行方式: node scripts/test-oauth.js
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://englqokndxfeasrynfjg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ2xxb2tuZHhmZWFzcnluZmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzI4ODEsImV4cCI6MjA5MTc0ODg4MX0.AHyGgTcQP2tMsP2ZwDcF1kOejCCKjaJlxgO-kHZY6iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        skipBrowserRedirect: true
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
        skipBrowserRedirect: true
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
  
  console.log('\n=== 测试完成 ===');
}

testOAuthConfiguration().catch(console.error);