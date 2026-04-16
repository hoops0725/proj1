import React, { useState } from 'react';
import type { Task } from '../lib/db';

interface ConflictResolverProps {
  localTask: Task;
  remoteTask: Task;
  onResolve: (resolvedTask: Task) => void;
  onCancel: () => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({ localTask, remoteTask, onResolve, onCancel }) => {
  const [selectedVersion, setSelectedVersion] = useState<'local' | 'remote' | 'custom'>('local');
  const [customTask, setCustomTask] = useState<Task>({
    ...localTask,
  });

  // 处理自定义字段变化
  const handleCustomChange = (field: keyof Task, value: string | number | boolean | string[] | undefined) => {
    setCustomTask(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 处理解决冲突
  const handleResolve = () => {
    let resolvedTask: Task;
    
    switch (selectedVersion) {
      case 'local':
        resolvedTask = localTask;
        break;
      case 'remote':
        resolvedTask = remoteTask;
        break;
      case 'custom':
        resolvedTask = customTask;
        break;
      default:
        resolvedTask = localTask;
    }
    
    onResolve(resolvedTask);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">解决任务冲突</h2>
        <p className="text-gray-600 mb-6">
          该任务在多个设备上被修改，出现了冲突。请选择要保留的版本。
        </p>
        
        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              className={`flex-1 py-2 px-4 rounded-md ${selectedVersion === 'local' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedVersion('local')}
            >
              本地版本
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md ${selectedVersion === 'remote' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedVersion('remote')}
            >
              远程版本
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md ${selectedVersion === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedVersion('custom')}
            >
              自定义
            </button>
          </div>
          
          <div className="border rounded-md p-4">
            {selectedVersion === 'local' && (
              <div className="space-y-2">
                <div><strong>标题:</strong> {localTask.title}</div>
                <div><strong>描述:</strong> {localTask.description || '无'}</div>
                <div><strong>状态:</strong> {localTask.status}</div>
                <div><strong>优先级:</strong> {localTask.priority}</div>
                <div><strong>更新时间:</strong> {new Date(localTask.updated_at).toLocaleString()}</div>
              </div>
            )}
            
            {selectedVersion === 'remote' && (
              <div className="space-y-2">
                <div><strong>标题:</strong> {remoteTask.title}</div>
                <div><strong>描述:</strong> {remoteTask.description || '无'}</div>
                <div><strong>状态:</strong> {remoteTask.status}</div>
                <div><strong>优先级:</strong> {remoteTask.priority}</div>
                <div><strong>更新时间:</strong> {new Date(remoteTask.updated_at).toLocaleString()}</div>
              </div>
            )}
            
            {selectedVersion === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    type="text"
                    value={customTask.title}
                    onChange={(e) => handleCustomChange('title', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={customTask.description || ''}
                    onChange={(e) => handleCustomChange('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={customTask.status}
                    onChange={(e) => handleCustomChange('status', e.target.value as Task['status'])}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="todo">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="done">已完成</option>
                    <option value="archived">已归档</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <select
                    value={customTask.priority}
                    onChange={(e) => handleCustomChange('priority', parseInt(e.target.value) as Task['priority'])}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={1}>低</option>
                    <option value={2}>中低</option>
                    <option value={3}>中</option>
                    <option value={4}>高</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={handleResolve}
          >
            解决冲突
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolver;