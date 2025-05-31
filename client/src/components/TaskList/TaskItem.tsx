import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/Task';
import { formatDistanceToNow } from 'date-fns';
import StatusDropdown from '../StatusControls/StatusDropdown';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
}

const priorityColors = {
  [TaskPriority.LOW]: 'text-green-600 bg-green-100',
  [TaskPriority.MEDIUM]: 'text-yellow-600 bg-yellow-100',
  [TaskPriority.HIGH]: 'text-orange-600 bg-orange-100',
  [TaskPriority.URGENT]: 'text-red-600 bg-red-100',
};

const statusColors = {
  [TaskStatus.LOGGED]: 'text-gray-600 bg-gray-100',
  [TaskStatus.ONGOING]: 'text-blue-600 bg-blue-100',
  [TaskStatus.REVIEWED]: 'text-purple-600 bg-purple-100',
  [TaskStatus.DONE]: 'text-green-600 bg-green-100',
  [TaskStatus.BLOCKED]: 'text-red-600 bg-red-100',
};

const TaskItem: React.FC<TaskItemProps> = ({ task, isSelected, onSelect }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();
  };

  return (
    <div
      className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
          {task.title}
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <StatusDropdown task={task} />
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>
          <span className="font-medium">{task.requester_name}</span>
          {task.assigned_to && (
            <span className="ml-2">→ {task.assigned_to}</span>
          )}
        </div>
        <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
      </div>
      
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskItem;