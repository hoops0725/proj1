import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import type { Task, PendingOperation, SyncState } from '../lib/db';
import { localStorageService } from '../services/localStorageService';

const DatabaseDebug: React.FC = () => {
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

  // 清空数据库
  const handleClearDatabase = async () => {
    if (window.confirm('确定要清空数据库吗？此操作不可恢复！')) {
      await db.tasks.clear();
      await db.pending_queue.clear();
      await db.sync_state.clear();
      await db.blobs.clear();
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">数据库调试工具</h1>
        
        {loading && (
          <div className="mb-6 p-4 rounded-md bg-yellow-100 text-yellow-800">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-500 mr-2"></div>
              <span>加载中...</span>
            </div>
          </div>
        )}

        {/* 网络状态 */}
        <div className="mb-6 p-4 rounded-md bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">网络状态</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            networkStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {networkStatus ? '在线' : '离线'}
          </div>
          <button
            onClick={handleSync}
            disabled={!networkStatus}
            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            手动同步
          </button>
          <button
            onClick={handleCleanup}
            className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            清理过期数据
          </button>
          <button
            onClick={handleClearDatabase}
            className="ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            清空数据库
          </button>
        </div>

        {/* 同步状态 */}
        <div className="mb-6 p-4 rounded-md bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">同步状态</h2>
          {syncState ? (
            <div className="space-y-2">
              <div><strong>最后同步时间:</strong> {new Date(syncState.last_sync_at).toLocaleString()}</div>
              <div><strong>是否正在同步:</strong> {syncState.sync_in_progress ? '是' : '否'}</div>
              {syncState.last_error && (
                <div className="text-red-600"><strong>上次同步错误:</strong> {syncState.last_error}</div>
              )}
              {syncState.cursor && (
                <div><strong>同步游标:</strong> {syncState.cursor}</div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">无同步状态数据</div>
          )}
        </div>

        {/* 待同步操作 */}
        <div className="mb-6 p-4 rounded-md bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">待同步操作 ({pendingOperations.length})</h2>
          {pendingOperations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务 ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">尝试次数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingOperations.map((op) => (
                    <tr key={op.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.payload.id?.substring(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.metadata.attempts}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(op.metadata.original_timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500">无待同步操作</div>
          )}
        </div>

        {/* 任务列表 */}
        <div className="p-4 rounded-md bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">任务列表 ({tasks.length})</h2>
          {tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">同步状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.priority}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.sync_status === 'synced' ? 'bg-green-100 text-green-800' :
                          task.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          task.sync_status === 'conflict' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.sync_status || '未同步'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(task.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500">无任务数据</div>
          )}
        </div>

        {/* 刷新按钮 */}
        <div className="mt-6">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            刷新数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDebug;