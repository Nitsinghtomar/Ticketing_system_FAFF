import React from 'react';
import { TaskStatus, TaskPriority } from '../../types/Task';

interface TaskFiltersProps {
  filters: {
    status: string;
    priority: string;
    search: string;
    page: number;
    limit: number;
  };
  onFiltersChange: (filters: any) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filtering
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value={TaskStatus.LOGGED}>Logged</option>
          <option value={TaskStatus.ONGOING}>Ongoing</option>
          <option value={TaskStatus.REVIEWED}>Reviewed</option>
          <option value={TaskStatus.DONE}>Done</option>
          <option value={TaskStatus.BLOCKED}>Blocked</option>
        </select>
        
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value={TaskPriority.LOW}>Low</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.HIGH}>High</option>
          <option value={TaskPriority.URGENT}>Urgent</option>
        </select>
      </div>
    </div>
  );
};

export default TaskFilters;