import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { onlineTaskService } from '../../services/onlineTaskService';
import type { Task } from '../../lib/db';
import { appConfig } from '../../config/appConfig';

const Main: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const taskList = await onlineTaskService.getTasks(user.id);
      setTasks(taskList);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title.trim()) return;

    try {
      await onlineTaskService.createTask({
        ...newTask,
        user_id: user.id,
        sort_order: 0,
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

  const handleUpdateStatus = async (task: Task, status: Task['status']) => {
    if (!user) return;
    try {
      await onlineTaskService.updateTask(user.id, task.id, { status });
      loadTasks();
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!user) return;
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await onlineTaskService.deleteTask(user.id, task.id);
        loadTasks();
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/auth/profile');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 -z-20" />
      <div
        className="fixed inset-0 opacity-40 -z-10"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
        }}
      />

      <div className="relative min-h-screen">
        <header className="relative z-40 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-3 shadow-lg">
                  <div className="w-5 h-5 text-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white">任务管理</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 focus:outline-none group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{user?.email?.split('@')[0] || '用户'}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-56 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden">
                      <div className="py-2">
                        <button
                          onClick={handleProfileClick}
                          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          我的资料
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowAboutModal(true);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          产品信息
                        </button>
                        <div className="border-t border-white/10 my-2" />
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414L19.586 3l-2.829-2.828L9.757 8.172 7.172 5.586 4.343 8.414 7.5 11.5H3v2h7.5l-3.157 3.086 2.829 2.829L14.414 14l2.121-2.121L11 6.414z" clipRule="evenodd" />
                          </svg>
                          登出
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-500 text-white rounded-xl hover:from-emerald-700 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              {showCreateForm ? '取消' : '创建任务'}
            </button>
          </div>

          {showCreateForm && (
            <div className="mb-6 p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">创建新任务</h2>
              <form onSubmit={handleCreateTask}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">标题</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="输入任务标题"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">优先级</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) as Task['priority'] })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    >
                      <option value={1} className="bg-gray-900">紧急</option>
                      <option value={2} className="bg-gray-900">高</option>
                      <option value={3} className="bg-gray-900">中</option>
                      <option value={4} className="bg-gray-900">低</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-cyan-300 mb-2">描述</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="输入任务描述"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">状态</label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    >
                      <option value="todo" className="bg-gray-900">待办</option>
                      <option value="in_progress" className="bg-gray-900">进行中</option>
                      <option value="done" className="bg-gray-900">已完成</option>
                      <option value="archived" className="bg-gray-900">已归档</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">标签</label>
                    <input
                      type="text"
                      value={newTask.tags.join(', ')}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="输入标签，用逗号分隔"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    创建任务
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white">任务列表</h2>
            </div>
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cyan-300">加载中...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-white/60 text-lg mb-2">暂无任务</p>
                <p className="text-white/40 text-sm">点击"创建任务"按钮添加第一个任务</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {tasks.map((task) => (
                  <div key={task.id} className="p-6 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-lg mb-2">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-cyan-300/80 mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-3 flex-wrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${task.priority === 1 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : task.priority === 2 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : task.priority === 3 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                            {task.priority === 1 ? '🔴 紧急' : task.priority === 2 ? '🟠 高' : task.priority === 3 ? '🟡 中' : '🟢 低'}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${task.status === 'todo' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : task.status === 'in_progress' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : task.status === 'done' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                            {task.status === 'todo' ? '📋 待办' : task.status === 'in_progress' ? '🚀 进行中' : task.status === 'done' ? '✅ 已完成' : '📦 已归档'}
                          </span>
                        </div>
                        {task.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {task.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-3 ml-4">
                        <button
                          onClick={() => handleUpdateStatus(task, task.status === 'done' ? 'todo' : 'done')}
                          className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 font-medium"
                        >
                          {task.status === 'done' ? '未完成' : '完成'}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          className="px-5 py-2.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 font-medium"
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
        </main>

        {/* 产品信息弹窗 */}
        {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 p-6">
                <h2 className="text-2xl font-bold text-white">关于任务管理应用</h2>
                <p className="text-white/80 text-sm mt-1">Task Management App</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-lg font-semibold text-white mb-3">产品信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">版本号</span>
                      <span className="text-white font-medium">{appConfig.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">构建日期</span>
                      <span className="text-white">{appConfig.buildDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">许可证</span>
                      <span className="text-white">{appConfig.license}</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-lg font-semibold text-white mb-3">作者信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">作者</span>
                      <span className="text-white font-medium">{appConfig.author.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">作者邮箱</span>
                      <span className="text-cyan-400">{appConfig.author.email}</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-lg font-semibold text-white mb-3">联系方式</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">支持邮箱</span>
                      <span className="text-cyan-400">{appConfig.contact.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">官方网站</span>
                      <span className="text-cyan-400">{appConfig.contact.website}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">功能特性</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {appConfig.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-gray-500 text-center">
                    {appConfig.copyright}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200 font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Main;