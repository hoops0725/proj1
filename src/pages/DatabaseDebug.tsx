import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import type { Task, PendingOperation, SyncState } from '../lib/db';
import { localStorageService } from '../services/localStorageService';

const DatabaseDebug: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [syncState, setSyncState] = useState<SyncState | undefined>();
  const [networkStatus, setNetworkStatus] = useState<boolean>(navigator.onLine);
  const [loading, setLoading] = useState<boolean>(true);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 加载任务
      const allTasks = await db.tasks.toArray();
      setTasks(allTasks);

      // 加载待同步操作
      const operations = await db.pending_queue.toArray();
      setPendingOperations(operations);

      // 加载同步状态
      const state = await localStorageService.getSyncState();
      setSyncState(state);

      // 网络状态
      setNetworkStatus(navigator.onLine);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 监听网络状态变化
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

  // 手动同步
  const handleSync = async () => {
    await localStorageService.triggerSync();
    loadData();
  };

  // 清理数据
  const handleCleanup = async () => {
    await localStorageService.cleanupExpiredData();
    loadData();
  };

  // 清空数据库（已禁用，出于安全考虑）
  const handleClearDatabase = async () => {
    console.warn('清空数据库功能已禁用');
    alert('此功能已出于安全考虑被禁用');
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
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 text-white/70 hover:text-white transition-colors"
                  aria-label="返回"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">数据库调试工具</h1>
              </div>
              <button
                onClick={() => navigate('/app')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                返回应用
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-400 mr-2"></div>
                <span>加载中...</span>
              </div>
            </div>
          )}

          {/* 网络状态 */}
          <div className="mb-6 p-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">网络状态</h2>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              networkStatus ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                networkStatus ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {networkStatus ? '在线' : '离线'}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleSync}
                disabled={!networkStatus}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                手动同步
              </button>
              <button
                onClick={handleCleanup}
                className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 font-medium"
              >
                清理过期数据
              </button>
              <button
                onClick={handleClearDatabase}
                className="px-5 py-2.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 font-medium"
              >
                清空数据库
              </button>
            </div>
          </div>

          {/* 同步状态 */}
          <div className="mb-6 p-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">同步状态</h2>
            {syncState ? (
              <div className="space-y-3">
                <div className="text-cyan-300"><strong>最后同步时间:</strong> {new Date(syncState.last_sync_at).toLocaleString()}</div>
                <div className="text-cyan-300"><strong>是否正在同步:</strong> {syncState.sync_in_progress ? '是' : '否'}</div>
                {syncState.last_error && (
                  <div className="text-red-400"><strong>上次同步错误:</strong> {syncState.last_error}</div>
                )}
                {syncState.cursor && (
                  <div className="text-cyan-300"><strong>同步游标:</strong> {syncState.cursor}</div>
                )}
              </div>
            ) : (
              <div className="text-white/60">无同步状态数据</div>
            )}
          </div>

          {/* 待同步操作 */}
          <div className="mb-6 p-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">待同步操作 ({pendingOperations.length})</h2>
            {pendingOperations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">任务 ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">尝试次数</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {pendingOperations.map((op) => (
                      <tr key={op.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{op.id.substring(0, 8)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300">{op.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{op.payload.id?.substring(0, 8)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{op.metadata.attempts}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {new Date(op.metadata.original_timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-white/60">无待同步操作</div>
            )}
          </div>

          {/* 任务列表 */}
          <div className="mb-6 p-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">任务列表 ({tasks.length})</h2>
            {tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">标题</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">优先级</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">同步状态</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{task.id.substring(0, 8)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{task.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300">{task.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{task.priority}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                            task.sync_status === 'synced' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            task.sync_status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            task.sync_status === 'conflict' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {task.sync_status || '未同步'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {new Date(task.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-white/60">无任务数据</div>
            )}
          </div>

          {/* 刷新按钮 */}
          <div className="mt-6">
            <button
              onClick={loadData}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              刷新数据
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DatabaseDebug;