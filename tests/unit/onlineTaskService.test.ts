import { onlineTaskService } from '../../src/services/onlineTaskService';
import { supabase } from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('OnlineTaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return tasks for a user', async () => {
      const mockTasks = [
        { id: 'task1', user_id: 'user1', title: 'Task 1', is_deleted: false },
        { id: 'task2', user_id: 'user1', title: 'Task 2', is_deleted: false },
      ];
      
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockTasks, error: null });
      
      (supabase.from as jest.Mock) = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await onlineTaskService.getTasks('user1');
      expect(result).toEqual(mockTasks);
    });

    it('should return empty array when no tasks exist', async () => {
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
      
      (supabase.from as jest.Mock) = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await onlineTaskService.getTasks('user1');
      expect(result).toEqual([]);
    });

    it('should throw error when database connection fails', async () => {
      const mockError = new Error('Database connection failed');
      
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: mockError });
      
      (supabase.from as jest.Mock) = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      await expect(onlineTaskService.getTasks('user1')).rejects.toThrow(mockError);
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockTask = { id: 'task1', user_id: 'user1', title: 'New Task', is_deleted: false };
      
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTask, error: null });
      
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await onlineTaskService.createTask({
        user_id: 'user1',
        title: 'New Task',
      });
      
      expect(result).toEqual(mockTask);
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Failed to create task');
      
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
      
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      await expect(onlineTaskService.createTask({
        user_id: 'user1',
        title: 'New Task',
      })).rejects.toThrow(mockError);
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const mockTask = { id: 'task1', user_id: 'user1', title: 'Updated Task', is_deleted: false };
      
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTask, error: null });
      
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: mockSelect,
        }),
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await onlineTaskService.updateTask('user1', 'task1', { title: 'Updated Task' });
      
      expect(result).toEqual(mockTask);
    });

    it('should throw error when user tries to modify user_id', async () => {
      await expect(onlineTaskService.updateTask('user1', 'task1', { user_id: 'user2' as any }))
        .rejects
        .toThrow('无权修改任务所属用户');
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Failed to update task');
      
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
      
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: mockSelect,
        }),
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      await expect(onlineTaskService.updateTask('user1', 'task1', { title: 'Updated Task' }))
        .rejects
        .toThrow(mockError);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await onlineTaskService.deleteTask('user1', 'task1');
      
      expect(result).toBe(true);
    });

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Failed to delete task');
      
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      await expect(onlineTaskService.deleteTask('user1', 'task1'))
        .rejects
        .toThrow(mockError);
    });
  });
});