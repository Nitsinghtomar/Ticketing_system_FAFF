import React, { useState, useEffect,useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
// import { TEAM_MEMBERS, getActiveTeamMembers, getTeamMembersByDepartments } from '../data/teamMembers';

// Mock team members - in a real app, this would come from an API
// Mock team members - in a real app, this would come from an API
const TEAM_MEMBERS = [
  { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Senior Developer' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Lead Developer' },
  { id: '3', name: 'Mike Wilson', email: 'mike@company.com', role: 'QA Engineer' },
  { id: '4', name: 'Emily Chen', email: 'emily@company.com', role: 'Customer Success' },
  { id: '5', name: 'David Rodriguez', email: 'david@company.com', role: 'DevOps Engineer' },
  { id: '6', name: 'Jessica Martinez', email: 'jessica@company.com', role: 'Product Manager' },
  { id: '7', name: 'Robert Thompson', email: 'robert@company.com', role: 'UX Designer' },
  { id: '8', name: 'Lisa Anderson', email: 'lisa@company.com', role: 'QA Specialist' },
  { id: '9', name: 'Kevin Brown', email: 'kevin@company.com', role: 'Frontend Developer' },
  { id: '10', name: 'Amanda Davis', email: 'amanda@company.com', role: 'Project Manager' },
];

// Enhanced Status Dropdown with Visual Feedback
const EnhancedStatusDropdown: React.FC<{
  task: any;
  onStatusChange: (taskId: string, status: string) => void;
  isUpdating?: boolean;
}> = ({ task, onStatusChange, isUpdating = false }) => {
  const [isChanging, setIsChanging] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(task.status);

  const statusConfig = {
    logged: { 
      color: 'bg-gray-100 text-gray-700 border-gray-300', 
      label: 'Logged',
      icon: '📝',
      description: 'Task has been recorded'
    },
    ongoing: { 
      color: 'bg-blue-100 text-blue-700 border-blue-300', 
      label: 'Ongoing',
      icon: '⚡',
      description: 'Work in progress'
    },
    reviewed: { 
      color: 'bg-purple-100 text-purple-700 border-purple-300', 
      label: 'Reviewed',
      icon: '👀',
      description: 'Under review'
    },
    done: { 
      color: 'bg-green-100 text-green-700 border-green-300', 
      label: 'Done',
      icon: '✅',
      description: 'Completed successfully'
    },
    blocked: { 
      color: 'bg-red-100 text-red-700 border-red-300', 
      label: 'Blocked',
      icon: '🚫',
      description: 'Cannot proceed'
    },
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setPreviousStatus(task.status);
    setIsChanging(true);
    
    // Visual feedback with animation
    setTimeout(() => {
      onStatusChange(task.id, newStatus);
      setIsChanging(false);
    }, 300);
  };

  const currentConfig = statusConfig[task.status as keyof typeof statusConfig];

  return (
    <div className="relative">
      <select
        value={task.status}
        onChange={handleStatusChange}
        disabled={isUpdating || isChanging}
        className={`px-3 py-1 text-xs font-medium rounded-full border-2 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-300 ${
          currentConfig.color
        } ${isChanging ? 'animate-pulse scale-105' : ''} ${
          isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
        }`}
        title={currentConfig.description}
      >
        {Object.entries(statusConfig).map(([status, config]) => (
          <option key={status} value={status}>
            {config.icon} {config.label}
          </option>
        ))}
      </select>
      
      {/* Loading indicator */}
      {(isUpdating || isChanging) && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      
      {/* Status change animation */}
      {isChanging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {statusConfig[previousStatus as keyof typeof statusConfig]?.icon} → {currentConfig.icon}
        </div>
      )}
    </div>
  );
};

// Assignment Dropdown Component
// Assignment Dropdown Component - FIXED VERSION
// Fixed Assignment Dropdown Component with proper Unassign handling
// DEBUG VERSION - Assignment Dropdown with extensive logging
// DEBUG VERSION - Assignment Dropdown with extensive logging - FIXED
// Fixed Assignment Dropdown Component - App.tsx
// Replace your existing AssignmentDropdown component with this version

const AssignmentDropdown: React.FC<{
  task: any;
  onAssignmentChange: (taskId: string, assignee: string | null) => void;
  isUpdating?: boolean;
}> = ({ task, onAssignmentChange, isUpdating = false }) => {
  const [isChanging, setIsChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  console.log('🔍 AssignmentDropdown render:', {
    taskId: task.id,
    taskTitle: task.title,
    currentAssignedTo: task.assigned_to,
    taskObject: task
  });

  const handleAssignmentChange = (assignee: string | null) => {
    console.log('🔄 handleAssignmentChange called:', {
      taskId: task.id,
      currentAssignee: task.assigned_to,
      newAssignee: assignee,
      assigneeType: typeof assignee,
      isNull: assignee === null
    });

    setIsChanging(true);
    setIsOpen(false);
    
    // Call the parent function
    console.log('📞 Calling onAssignmentChange...');
    try {
      onAssignmentChange(task.id, assignee);
      console.log('✅ onAssignmentChange called successfully');
    } catch (error) {
      console.error('❌ Error in onAssignmentChange:', error);
    }
    
    // Reset loading state
    setTimeout(() => {
      console.log('🔄 Resetting isChanging state for task:', task.id);
      setIsChanging(false);
    }, 1000);
  };

  const handleUnassign = (e: React.MouseEvent) => {
    console.log('🚫 handleUnassign called:', {
      taskId: task.id,
      currentAssignee: task.assigned_to
    });
    
    e.preventDefault();
    e.stopPropagation();
    
    handleAssignmentChange(null);
  };

  const currentAssignee = TEAM_MEMBERS.find(member => member.name === task.assigned_to);
  
  console.log('👤 Current assignee lookup:', {
    taskAssignedTo: task.assigned_to,
    foundAssignee: currentAssignee,
    allTeamMembers: TEAM_MEMBERS.map(m => m.name)
  });

  // Calculate dropdown position
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 300;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  }, []);

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔽 Toggle dropdown:', { isOpen, willBeOpen: !isOpen });
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)) {
        console.log('👆 Clicked outside dropdown, closing');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        disabled={isUpdating || isChanging}
        className={`flex items-center space-x-2 px-3 py-1 text-xs font-medium rounded-full border-2 transition-all duration-300 ${
          currentAssignee 
            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100' 
            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
        } ${isChanging ? 'animate-pulse scale-105' : ''} ${
          isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
        }`}
      >
        <div className="flex items-center space-x-1">
          {currentAssignee ? (
            <>
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                {currentAssignee.name.charAt(0)}
              </div>
              <span className="truncate max-w-20">{currentAssignee.name}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Unassigned</span>
            </>
          )}
        </div>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
          style={{ maxHeight: '280px', overflowY: 'auto', overflowX: 'hidden' }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Unassign option - Only show if currently assigned */}
          {currentAssignee && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚫 Unassign button clicked');
                handleUnassign(e);
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center space-x-2 border-b border-gray-100 focus:outline-none focus:bg-red-50 transition-colors"
            >
              <div className="w-6 h-6 bg-red-300 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-red-900">🚫 Unassign</div>
                <div className="text-xs text-red-600">Remove assignment</div>
              </div>
            </button>
          )}

          {/* Team members */}
          <div className="max-h-48 overflow-y-auto">
            {TEAM_MEMBERS.map((member) => (
              <button
                key={member.id}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('👤 Member clicked:', member.name);
                  handleAssignmentChange(member.name);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center space-x-2 transition-colors focus:outline-none focus:bg-blue-50 ${
                  currentAssignee?.id === member.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
                  <div className="text-xs text-gray-500 truncate">{member.role}</div>
                </div>
                {currentAssignee?.id === member.id && (
                  <span className="text-xs text-blue-600 font-bold">CURRENT</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {(isUpdating || isChanging) && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

// Enhanced Task Item with improved controls
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'logged' | 'ongoing' | 'reviewed' | 'done' | 'blocked';

interface Task {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  assigned_to?: string;
  requester_name: string;
  created_at: string;
  tags?: string[];
  messageCount?: number;
}

const EnhancedTaskItem: React.FC<{
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (taskId: string, status: string) => void;
  onAssignmentChange: (taskId: string, assignee: string | null) => void;
  updatingTasks: Set<string>;
}> = ({ task, isSelected, onSelect, onStatusChange, onAssignmentChange, updatingTasks }) => {
  const priorityColors: Record<Priority, string> = {
    low: 'text-green-600 bg-green-100 border-green-300',
    medium: 'text-yellow-600 bg-yellow-100 border-yellow-300',
    high: 'text-orange-600 bg-orange-100 border-orange-300',
    urgent: 'text-red-600 bg-red-100 border-red-300',
  };

  // Rest of your component implementation...

  const formatDistanceToNow = (date: string) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const isUpdating = updatingTasks.has(task.id);

  return (
    <div
      className={`p-4 border-b border-gray-200 cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500 shadow-md' 
          : 'hover:bg-gray-50 hover:shadow-sm'
      } ${isUpdating ? 'opacity-75' : ''}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
          {task.title}
        </h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border-2 ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">{task.requester_name}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDistanceToNow(task.created_at)}</span>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {task.messageCount || 0} messages
          </span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex justify-between items-center mb-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <EnhancedStatusDropdown 
              task={task} 
              onStatusChange={onStatusChange}
              isUpdating={isUpdating}
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Assigned:</span>
            <AssignmentDropdown 
              task={task} 
              onAssignmentChange={onAssignmentChange}
              isUpdating={isUpdating}
            />
          </div>
        </div>
      </div>
      
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}

      {/* Update indicator */}
      {isUpdating && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 text-xs text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

// Notification component for status/assignment changes
const ChangeNotification: React.FC<{
  type: 'status' | 'assignment';
  oldValue: string;
  newValue: string;
  taskTitle: string;
}> = ({ type, oldValue, newValue, taskTitle }) => {
  useEffect(() => {
    if (type === 'status') {
      toast.success(
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span>📋</span>
            <span className="font-medium">Status Updated</span>
          </div>
          <div className="text-sm">
            "{taskTitle}" → {oldValue} to {newValue}
          </div>
        </div>,
        { duration: 3000 }
      );
    } else {
      toast.success(
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span>👥</span>
            <span className="font-medium">Assignment Updated</span>
          </div>
          <div className="text-sm">
            "{taskTitle}" → {oldValue || 'Unassigned'} to {newValue || 'Unassigned'}
          </div>
        </div>,
        { duration: 3000 }
      );
    }
  }, [type, oldValue, newValue, taskTitle]);

  return null;
};

export { EnhancedStatusDropdown, AssignmentDropdown, EnhancedTaskItem, ChangeNotification, TEAM_MEMBERS };