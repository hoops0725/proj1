import { z } from 'zod';

/**
 * 登录表单验证 Schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(6, '密码长度至少为6个字符'),
});

/**
 * 注册表单验证 Schema
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, '请输入邮箱地址')
      .email('请输入有效的邮箱地址'),
    password: z
      .string()
      .min(1, '请输入密码')
      .min(6, '密码长度至少为6个字符'),
    confirmPassword: z.string().min(1, '请确认密码'),
    fullName: z.string().min(1, '请输入姓名').min(2, '姓名至少2个字符'),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: '两次输入的密码不一致',
      path: ['confirmPassword'],
    }
  );

/**
 * 个人资料更新验证 Schema
 */
export const profileSchema = z.object({
  full_name: z.string().min(2, '姓名至少2个字符').optional(),
  bio: z.string().max(500, '个人简介不能超过500个字符').optional(),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

/**
 * 任务创建/更新验证 Schema
 */
export const taskSchema = z.object({
  title: z.string().min(1, '请输入任务标题').max(200, '标题不能超过200个字符'),
  description: z.string().max(2000, '描述不能超过2000个字符').optional(),
  priority: z.enum(['1', '2', '3', '4']).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
});

/**
 * 密码重置验证 Schema
 */
export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(6, '密码长度至少为6个字符')
      .regex(/(?=.*[A-Za-z])(?=.*\d)/, '密码需要包含字母和数字'),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: '两次输入的密码不一致',
      path: ['confirmPassword'],
    }
  );

/**
 * 邮箱验证 Schema
 */
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .email('请输入有效的邮箱地址'),
});

/**
 * 类型定义
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type EmailFormData = z.infer<typeof emailSchema>;
