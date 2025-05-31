// client/src/components/TaskList/TaskList.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { FixedSizeList as List } from 'react-window';
import { api } from '../../services/api';
import { Task } from '../../types/Task';
import TaskItem from './TaskItem';
import TaskFilters from './TaskFilters';
import ChatPane from '../ChatPane/ChatPane';
import { useSocket } from '../../contexts/SocketContext';

interface TaskListProps { }

const TaskList: React.FC<TaskListProps> = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1,
    limit: 50
  });

  const { socket } = useSocket();

  const { data: tasksData, isLoading, error, refetch } = useQuery(
    ['tasks', filters],
    () => api.getTasks(filters),
    {
      keepPreviousData: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Real-time updates
  React.useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (task: Task) => {
      refetch();
    };

    const handleTaskCreated = (task: Task) => {
      refetch();
    }; const handleTaskDeleted = ({ id }: { id: string }) => {
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
      refetch();
    };

    const handleMessageCountUpdate = (data: { taskId: string; messageCount: number; timestamp: string }) => {
      console.log(`📊 TaskList: Message count update for task ${data.taskId}: ${data.messageCount} messages`);
      refetch(); // Refresh the task list to show updated message counts
    };

    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_created', handleTaskCreated);
    socket.on('task_deleted', handleTaskDeleted);
    socket.on('task_message_count_updated', handleMessageCountUpdate);

    return () => {
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_created', handleTaskCreated);
      socket.off('task_deleted', handleTaskDeleted);
      socket.off('task_message_count_updated', handleMessageCountUpdate);
    };
  }, [socket, refetch, selectedTask]);

  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    if (socket) {
      socket.emit('join_task', task.id);
    }
  }, [socket]);

  const handleTaskDeselect = useCallback(() => {
    if (selectedTask && socket) {
      socket.emit('leave_task', selectedTask.id);
    }
    setSelectedTask(null);
  }, [selectedTask, socket]);

  const renderTaskItem = useCallback(({ index, style }: any) => {
    if (!tasksData?.tasks[index]) return null;

    return (
      <div style={style}>
        <TaskItem
          task={tasksData.tasks[index]}
          isSelected={selectedTask?.id === tasksData.tasks[index].id}
          onSelect={() => handleTaskSelect(tasksData.tasks[index])}
        />
      </div>
    );
  }, [tasksData?.tasks, selectedTask, handleTaskSelect]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error loading tasks. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Task List Panel */}
      <div className={`transition-all duration-300 ${selectedTask ? 'w-1/2' : 'w-full'} border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tasks</h1>
          <TaskFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="h-full overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <List
              height={window.innerHeight - 200}
              width="100%" // Add this line
              itemCount={tasksData?.tasks.length || 0}
              itemSize={120}
              itemData={tasksData?.tasks}
            >
              {renderTaskItem}
            </List>

          )}
        </div>
      </div>

      {/* Chat Panel */}
      {selectedTask && (
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h2>
              <button
                onClick={handleTaskDeselect}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <ChatPane task={selectedTask} />
        </div>
      )}
    </div>
  );
};

export default TaskList;