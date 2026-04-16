import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { localStorageService } from '../../services/localStorageService';
import type { Task } from '../../lib/db';
import ConflictResolver from '../../components/ConflictResolver';

const Main: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 3 as Task['priority'],
    status: 'todo' as Task['status'],
    tags: [] as string[],
  });
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [conflict, setConflict] = useState<{
    localTask: Task;
    remoteTask: Task;
  } | null>(null);

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const taskList = await localStorageService.getTasks(user.id);
      setTasks(taskList);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
    };

    const handleOffline = () => {
      setNetworkStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 初始加载任务
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 创建新任务
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title.trim()) return;

    try {
      await localStorageService.createTask({
        ...newTask,
        user_id: user.id,
      });
      setNewTask({
        title: '',
        description: '',
        priority: 3,
        status: 'todo',
        tags: [],
      });
      setShowCreateForm(false);
      loadTasks();
    } catch (error) {
      console.error('创建任务失败:', error);
    }
  };

  // 更新任务状态
  const handleUpdateStatus = async (task: Task, status: Task['status']) => {
    try {
      await localStorageService.updateTask(task.id, { status });
      loadTasks();
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  };

  // 删除任务
  const handleDeleteTask = async (task: Task) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await localStorageService.deleteTask(task.id);
        loadTasks();
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    }
  };

  // 手动同步
  const handleSync = async () => {
    try {
      await localStorageService.triggerSync();
      loadTasks();
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  // 处理冲突解决
  const handleResolveConflict = async (resolvedTask: Task) => {
    try {
      await localStorageService.updateTask(resolvedTask.id, {
        ...resolvedTask,
        sync_status: 'synced',
      });
      loadTasks();
      setConflict(null);
    } catch (error) {
      console.error('解决冲突失败:', error);
    }
  };

  // 取消冲突解决
  const handleCancelConflict = () => {
    setConflict(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">任务管理</h1>
          <div className="flex items-center space-x-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              networkStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {networkStatus ? '在线' : '离线'}
            </div>
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              手动同步
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {showCreateForm ? '取消' : '创建任务'}
            </button>
          </div>
        </div>

        {/* 创建任务表单 */}
        {showCreateForm && (
          <div className="mb-6 p-4 bg-white rounded-md shadow">
            <h2 className="text-lg font-semibold mb-4">创建新任务</h2>
            <form onSubmit={handleCreateTask}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="输入任务标题"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) as Task['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={1}>紧急</option>
                    <option value={2}>高</option>
                    <option value={3}>中</option>
                    <option value={4}>低</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="输入任务描述"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="todo">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="done">已完成</option>
                    <option value="archived">已归档</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                  <input
                    type="text"
                    value={newTask.tags.join(', ')}
                    onChange={(e) => setNewTask({ ...newTask, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="输入标签，用逗号分隔"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  创建任务
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 任务列表 */}
        <div className="bg-white rounded-md shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">任务列表</h2>
          </div>
          {isLoading ? (
            <div className="p-4 text-center">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="p-4 text-center text-gray-500">暂无任务</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div key={task.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 1 ? 'bg-red-100 text-red-800' :
                          task.priority === 2 ? 'bg-orange-100 text-orange-800' :
                          task.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 1 ? '紧急' :
                           task.priority === 2 ? '高' :
                           task.priority === 3 ? '中' :
                           '低'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'todo' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                          task.status === 'done' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'todo' ? '待办' :
                           task.status === 'in_progress' ? '进行中' :
                           task.status === 'done' ? '已完成' :
                           '已归档'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.sync_status === 'synced' ? 'bg-green-100 text-green-800' :
                          task.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.sync_status === 'synced' ? '已同步' :
                           task.sync_status === 'pending' ? '待同步' :
                           '同步失败'}
                        </span>
                      </div>
                      {task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(task, task.status === 'done' ? 'todo' : 'done')}
                        className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
                      >
                        {task.status === 'done' ? '标记为未完成' : '标记为完成'}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 冲突解决弹窗 */}
      {conflict && (
        <ConflictResolver
          localTask={conflict.localTask}
          remoteTask={conflict.remoteTask}
          onResolve={handleResolveConflict}
          onCancel={handleCancelConflict}
        />
      )}
    </div>
  );
};

export default Main;