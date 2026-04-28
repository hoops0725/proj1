/**
 * 统一错误处理模块
 * 用于处理应用中的各类错误，对外返回通用错误信息，隐藏系统内部细节
 */

/**
 * 认证错误处理
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export const handleAuthError = (error: Error | unknown): string => {
  console.error('Authentication error:', error);
  
  // 隐藏具体错误信息，返回通用消息
  return '登录失败，请检查邮箱和密码是否正确';
};

/**
 * 注册错误处理
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export const handleSignUpError = (error: Error | unknown): string => {
  console.error('Sign up error:', error);
  
  // 隐藏具体错误信息，返回通用消息
  return '注册失败，请稍后重试';
};

/**
 * 个人资料更新错误处理
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export const handleProfileError = (error: Error | unknown): string => {
  console.error('Profile update error:', error);
  
  // 隐藏具体错误信息，返回通用消息
  return '更新个人资料失败，请稍后重试';
};

/**
 * 任务操作错误处理
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export const handleTaskError = (error: Error | unknown): string => {
  console.error('Task error:', error);
  
  // 隐藏具体错误信息，返回通用消息
  return '操作任务失败，请稍后重试';
};

/**
 * 头像上传错误处理
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export const handleAvatarUploadError = (error: Error | unknown): string => {
  console.error('Avatar upload error:', error);
  
  // 隐藏具体错误信息，返回通用消息
  return '上传头像失败，请稍后重试';
};

/**
 * 通用错误处理
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export const handleGeneralError = (error: Error | unknown): string => {
  console.error('Error:', error);
  
  // 隐藏具体错误信息，返回通用消息
  return '操作失败，请稍后重试';
};

/**
 * 获取 Supabase 错误代码对应的用户友好消息
 * @param code - Supabase 错误代码
 * @returns 用户友好的错误消息
 */
export const getSupabaseErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    '42501': '您没有权限执行此操作',
    '23505': '该邮箱已被注册',
    '400': '请求参数错误',
    '401': '请先登录',
    '404': '未找到相关资源',
    '500': '服务器内部错误',
  };
  
  return errorMessages[code] || '操作失败，请稍后重试';
};

/**
 * 安全地获取错误消息
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    // 处理 Supabase 错误格式
    const err = error as { code?: string; message?: string };
    if (err.code) {
      return getSupabaseErrorMessage(err.code);
    }
    if (err.message) {
      return err.message;
    }
  }
  
  return '操作失败，请稍后重试';
};
