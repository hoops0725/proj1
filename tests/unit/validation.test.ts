import { loginSchema, registerSchema, profileSchema, taskSchema } from '../../src/lib/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('请输入有效的邮箱地址');
      }
    });

    it('should reject password too short', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '123',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('密码长度至少为6个字符');
      }
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'Test User',
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
        fullName: 'Test User',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('两次输入的密码不一致');
      }
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'invalid',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'Test User',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject empty full name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: '',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject full name too short', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'A',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('姓名至少2个字符');
      }
    });
  });

  describe('profileSchema', () => {
    it('should validate valid profile data', () => {
      const result = profileSchema.safeParse({
        full_name: 'Test User',
      });
      
      expect(result.success).toBe(true);
    });

    it('should allow empty profile data', () => {
      const result = profileSchema.safeParse({});
      
      expect(result.success).toBe(true);
    });

    it('should reject full_name too short', () => {
      const result = profileSchema.safeParse({
        full_name: 'A',
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('taskSchema', () => {
    it('should validate valid task data', () => {
      const result = taskSchema.safeParse({
        title: 'Test Task',
        description: 'Task description',
        priority: '3',
        status: 'todo',
        tags: ['work', 'important'],
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = taskSchema.safeParse({
        title: '',
        description: 'Task description',
        priority: '3',
        status: 'todo',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('请输入任务标题');
      }
    });

    it('should reject invalid priority', () => {
      const result = taskSchema.safeParse({
        title: 'Test Task',
        priority: '5',
        status: 'todo',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = taskSchema.safeParse({
        title: 'Test Task',
        priority: '3',
        status: 'invalid',
      });
      
      expect(result.success).toBe(false);
    });

    it('should allow optional fields', () => {
      const result = taskSchema.safeParse({
        title: 'Simple Task',
        priority: '3',
        status: 'todo',
      });
      
      expect(result.success).toBe(true);
    });

    it('should validate minimum required fields', () => {
      const result = taskSchema.safeParse({
        title: 'Minimum Task',
      });
      
      expect(result.success).toBe(true);
    });
  });
});