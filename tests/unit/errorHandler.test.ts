import { 
  handleAuthError, 
  handleSignUpError, 
  handleTaskError, 
  handleGeneralError 
} from '../../src/lib/errorHandler';

describe('Error Handler', () => {
  describe('handleAuthError', () => {
    it('should return user-friendly message for auth errors', () => {
      const error = new Error('Invalid credentials');
      const result = handleAuthError(error);
      
      expect(result).toBe('登录失败，请检查邮箱和密码是否正确');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleAuthError(error);
      
      expect(result).toBe('登录失败，请检查邮箱和密码是否正确');
    });

    it('should handle non-error objects', () => {
      const result = handleAuthError('something went wrong');
      
      expect(result).toBe('登录失败，请检查邮箱和密码是否正确');
    });
  });

  describe('handleSignUpError', () => {
    it('should return user-friendly message for sign up errors', () => {
      const error = new Error('Email already exists');
      const result = handleSignUpError(error);
      
      expect(result).toBe('注册失败，请稍后重试');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Server error');
      const result = handleSignUpError(error);
      
      expect(result).toBe('注册失败，请稍后重试');
    });
  });

  describe('handleTaskError', () => {
    it('should return user-friendly message for task errors', () => {
      const error = new Error('Task not found');
      const result = handleTaskError(error);
      
      expect(result).toBe('操作任务失败，请稍后重试');
    });

    it('should handle database errors', () => {
      const error = new Error('Database connection failed');
      const result = handleTaskError(error);
      
      expect(result).toBe('操作任务失败，请稍后重试');
    });
  });

  describe('handleGeneralError', () => {
    it('should return default error message', () => {
      const error = new Error('Something went wrong');
      const result = handleGeneralError(error);
      
      expect(result).toBe('操作失败，请稍后重试');
    });

    it('should handle null error', () => {
      const result = handleGeneralError(null);
      
      expect(result).toBe('操作失败，请稍后重试');
    });

    it('should handle undefined error', () => {
      const result = handleGeneralError(undefined);
      
      expect(result).toBe('操作失败，请稍后重试');
    });
  });
});