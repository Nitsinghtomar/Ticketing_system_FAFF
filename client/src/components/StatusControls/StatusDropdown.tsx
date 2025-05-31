import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { Task, TaskStatus } from '../../types/Task';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface StatusDropdownProps {
  task: Task;
}

const statusConfig = {
  [TaskStatus.LOGGED]: { color: 'gray', label: 'Logged' },
  [TaskStatus.ONGOING]: { color: 'blue', label: 'Ongoing' },
  [TaskStatus.REVIEWED]: { color: 'purple', label: 'Reviewed' },
  [TaskStatus.DONE]: { color: 'green', label: 'Done' },
  [TaskStatus.BLOCKED]: { color: 'red', label: 'Blocked' },
};

const StatusDropdown: React.FC<StatusDropdownProps> = ({ task }) => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation(
    (newStatus: TaskStatus) => api.updateTask(task.id, { status: newStatus }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        toast.success('Status updated');
      },
      onError: () => {
        toast.error('Failed to update status');
      }
    }
  );

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    updateStatusMutation.mutate(newStatus);
  };

  const currentConfig = statusConfig[task.status];

  return (
    <select
      value={task.status}
      onChange={handleStatusChange}
      disabled={updateStatusMutation.isLoading}
      className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
        currentConfig.color === 'gray' ? 'text-gray-700 bg-gray-100' :
        currentConfig.color === 'blue' ? 'text-blue-700 bg-blue-100' :
        currentConfig.color === 'purple' ? 'text-purple-700 bg-purple-100' :
        currentConfig.color === 'green' ? 'text-green-700 bg-green-100' :
        'text-red-700 bg-red-100'
      }`}
    >
      {Object.entries(statusConfig).map(([status, config]) => (
        <option key={status} value={status}>
          {config.label}
        </option>
      ))}
    </select>
  );
};

export default StatusDropdown;