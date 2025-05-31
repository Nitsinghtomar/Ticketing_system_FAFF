import React, { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from 'react-query';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  EnhancedStatusDropdown,
  AssignmentDropdown,
  EnhancedTaskItem,
  ChangeNotification,
  TEAM_MEMBERS
} from './components/EnhancedControls';
import EnhancedQAReviewPanel from './components/QualityAssurance/EnhancedQAReviewPanel';
import ResizablePanel from './components/ResizablePanel';
import TaskFilters from './components/TaskList/TaskFilters';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Types
interface Attachment {
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  requester_name: string;
  requester_email?: string;
  assigned_to?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags?: string[];
  created_at: string;
  updated_at: string;
  messageCount?: number;
}

enum TaskStatus {
  LOGGED = 'logged',
  ONGOING = 'ongoing',
  REVIEWED = 'reviewed',
  DONE = 'done',
  BLOCKED = 'blocked'
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

interface Message {
  id: string;
  task_id: string;
  sender_name: string;
  sender_email?: string;
  content: string;
  message_type: string;
  parent_message_id?: string;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}


// API Services
const apiService = {
  async getTasks(filters?: any) {
    const response = await api.get('/tasks', { params: filters });
    return response.data;
  },

  async createTask(taskData: Partial<Task>) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    const response = await api.put(`/tasks/${taskId}`, updates);
    return response.data;
  },

  async getMessages(taskId: string, page?: number) {
    const response = await api.get(`/chat/${taskId}/messages`, { params: { page } });
    return response.data;
  },

  async sendMessage(taskId: string, messageData: {
    content: string;
    sender_name: string;
    sender_email?: string;
    message_type?: string;
    attachments?: Attachment[];
  }) {
    const response = await api.post(`/chat/${taskId}/messages`, messageData);
    return response.data;
  },

  async generateSummary(taskId: string) {
    const response = await api.post(`/summary/tasks/${taskId}`);
    return response.data;
  },

  async saveSummary(taskId: string, summaryData: any) {
    console.log('💾 Saving summary for task:', taskId);
    try {
      const response = await api.post(`/summary/tasks/${taskId}`, summaryData);
      return response.data;
    } catch (error) {
      console.warn('Backend summary save not implemented yet');
      return null;
    }
  },

  async getSummary(taskId: string) {
    console.log('📄 Getting summary for task:', taskId);
    try {
      const response = await api.get(`/summary/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async triggerQAReview(messageId: string, taskId: string) {
    const response = await api.post('/qa/review', { messageId, taskId });
    return response.data;
  }
};

// Socket Hook
const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  return { socket, isConnected };
};

// UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Icon Components
const UserIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClockIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TagIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const PaperAirplaneIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const PaperClipIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);


interface EnhancedSummaryPanelProps {
  task: any;
  showSummary: boolean;
  messages: any[];
}

const EnhancedSummaryPanel: React.FC<EnhancedSummaryPanelProps> = ({ task, showSummary, messages }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: summaryData, refetch, isError } = useQuery(
    ['summary', task.id],
    () => apiService.getSummary(task.id),
    {
      enabled: showSummary,
      retry: false,
      refetchOnWindowFocus: false,
      onError: () => {
        // Summary doesn't exist yet, that's okay
        console.log('No existing summary found for task', task.id);
      }
    }
  );

  const generateSummary = async () => {
    if (messages.length === 0) {
      toast.error('No messages to summarize');
      return;
    }

    setIsGenerating(true);
    try {
      console.log(`🤖 Generating summary for task ${task.id} with ${messages.length} messages`);

      await apiService.generateSummary(task.id);
      await refetch();

      toast.success(
        <div>
          <div className="font-medium">✨ AI Summary Generated</div>
          <div className="text-sm">Task analysis complete</div>
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      console.error('Summary generation error:', error);
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatEntityList = (entities: string[], type: string) => {
    if (!entities || entities.length === 0) return null;

    const getIcon = (type: string) => {
      switch (type) {
        case 'phoneNumbers': return '📞';
        case 'emails': return '📧';
        case 'urls': return '🔗';
        case 'keyPeople': return '👥';
        case 'technologies': return '⚙️';
        case 'deadlines': return '⏰';
        case 'actionItems': return '✅';
        case 'dates': return '📅';
        case 'mentions': return '@';
        default: return '•';
      }
    };

    const getLabel = (type: string) => {
      switch (type) {
        case 'phoneNumbers': return 'Phone Numbers';
        case 'emails': return 'Email Addresses';
        case 'urls': return 'Links & Documentation';
        case 'keyPeople': return 'Key People';
        case 'technologies': return 'Technologies';
        case 'deadlines': return 'Deadlines';
        case 'actionItems': return 'Action Items';
        case 'dates': return 'Important Dates';
        case 'mentions': return 'Mentions';
        default: return type;
      }
    };

    return (
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
          <span>{getIcon(type)}</span>
          <span>{getLabel(type)}</span>
        </h5>
        <div className="space-y-1">
          {entities.map((entity: string, index: number) => (
            <div key={index} className="text-sm bg-white border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors">
              {type === 'urls' ? (
                <a
                  href={entity}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {entity}
                </a>
              ) : type === 'emails' ? (
                <a
                  href={`mailto:${entity}`}
                  className="text-blue-600 hover:underline"
                >
                  {entity}
                </a>
              ) : type === 'phoneNumbers' ? (
                <a
                  href={`tel:${entity}`}
                  className="text-blue-600 hover:underline"
                >
                  {entity}
                </a>
              ) : (
                <span className="text-gray-800">{entity}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!showSummary) return null;

  return (
    <div className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <span>🤖</span>
            <span>AI Summary</span>
          </h3>
          {summaryData && (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Generated
            </span>
          )}
        </div>

        <button
          onClick={generateSummary}
          disabled={isGenerating || messages.length === 0}
          className={`w-full px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${isGenerating
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : messages.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span>Analyzing conversation...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>{summaryData ? 'Regenerate Summary' : 'Generate Summary'}</span>
            </>
          )}
        </button>

        {messages.length === 0 && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            No messages to summarize yet
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {summaryData ? (
          <div className="space-y-6">
            {/* Main Summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <span>📋</span>
                <span>Summary</span>
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-gray-800 text-sm leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>
            </div>

            {/* Metadata */}
            {summaryData.metadata && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-blue-800 mb-2">📊 Conversation Stats</h5>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                  <div>Messages: {summaryData.metadata.messageCount}</div>
                  <div>Participants: {summaryData.metadata.participantCount}</div>
                </div>
              </div>
            )}

            {/* Extracted Entities */}
            {summaryData.entities && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <span>🔍</span>
                  <span>Extracted Information</span>
                </h4>

                <div className="space-y-1">
                  {Object.entries(summaryData.entities).map(([key, value]) => {
                    if (Array.isArray(value) && value.length > 0) {
                      return formatEntityList(value, key);
                    }
                    return null;
                  })}

                  {Object.values(summaryData.entities).every(arr =>
                    !Array.isArray(arr) || arr.length === 0
                  ) && (
                      <div className="text-center py-4">
                        <div className="text-gray-400 text-sm">
                          <div className="text-2xl mb-2">🔍</div>
                          <p>No specific entities detected</p>
                          <p className="text-xs mt-1">Phone numbers, emails, and links will appear here</p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Generation Info */}
            <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded p-3">
              <div className="flex items-center space-x-2 mb-1">
                <span>🕒</span>
                <span className="font-medium">Last updated:</span>
              </div>
              <p>{new Date(summaryData.updated_at).toLocaleString()}</p>
              {summaryData.metadata?.generatedAt && (
                <p className="mt-1 text-xs text-gray-400">
                  Generated: {new Date(summaryData.metadata.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="font-medium text-gray-700 mb-2">No Summary Available</h4>
              <p className="text-sm mb-4">
                Click "Generate Summary" to create an AI-powered analysis of this conversation
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>✨ AI will analyze the conversation</p>
                <p>🔍 Extract key information and contacts</p>
                <p>📋 Provide a concise summary</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// New Task Modal Component
const NewTaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requester_name: '',
    requester_email: '',
    assigned_to: '',
    priority: 'medium',
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
    };

    onSubmit(taskData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requester_name: '',
      requester_email: '',
      assigned_to: '',
      priority: 'medium',
      tags: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requester Name *
            </label>
            <input
              type="text"
              name="requester_name"
              value={formData.requester_name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter requester name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requester Email
            </label>
            <input
              type="email"
              name="requester_email"
              value={formData.requester_email}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter requester email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <input
              type="text"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter assignee name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple tags with commas (e.g., bug, urgent, frontend)
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              disabled={isLoading || !formData.title.trim() || !formData.requester_name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Other components (StatusDropdown, TaskItem, etc.) remain the same...
const StatusDropdown: React.FC<{ task: Task; onStatusChange: (taskId: string, status: string) => void }> = ({
  task,
  onStatusChange
}) => {
  const statusConfig = {
    logged: { color: 'bg-gray-100 text-gray-700', label: 'Logged' },
    ongoing: { color: 'bg-blue-100 text-blue-700', label: 'Ongoing' },
    reviewed: { color: 'bg-purple-100 text-purple-700', label: 'Reviewed' },
    done: { color: 'bg-green-100 text-green-700', label: 'Done' },
    blocked: { color: 'bg-red-100 text-red-700', label: 'Blocked' },
  };

  return (
    <select
      value={task.status}
      onChange={(e) => onStatusChange(task.id, e.target.value)}
      className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${statusConfig[task.status].color}`}
    >
      {Object.entries(statusConfig).map(([status, config]) => (
        <option key={status} value={status}>
          {config.label}
        </option>
      ))}
    </select>
  );
};

const TaskItem: React.FC<{
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (taskId: string, status: string) => void;
}> = ({ task, isSelected, onSelect, onStatusChange }) => {
  const priorityColors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    urgent: 'text-red-600 bg-red-100',
  };

  const formatDistanceToNow = (date: string) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div
      className={`p-4 border-b border-gray-200 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
        }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
          {task.title}
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <StatusDropdown task={task} onStatusChange={onStatusChange} />
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <UserIcon className="w-4 h-4" />
            <span className="font-medium">{task.requester_name}</span>
          </div>
          {task.assigned_to && (
            <div className="flex items-center space-x-1">
              <span>→</span>
              <span className="font-medium text-blue-600">{task.assigned_to}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>{formatDistanceToNow(task.created_at)}</span>
          </span>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {task.messageCount || 0} messages
          </span>
        </div>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded flex items-center space-x-1"
            >
              <TagIcon className="w-3 h-3" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageThread: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDistanceToNow = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('csv')) return '📊';
    if (type.includes('text')) return '📄';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleImageExpansion = (imageId: string) => {
    const newExpanded = new Set(expandedImages);
    if (newExpanded.has(imageId)) {
      newExpanded.delete(imageId);
    } else {
      newExpanded.add(imageId);
    }
    setExpandedImages(newExpanded);
  };

  const openFileInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAttachment = (attachment: Attachment, messageId: string, index: number) => {
    const isImage = attachment.type?.startsWith('image/');
    const imageId = `${messageId}-${index}`;
    const isExpanded = expandedImages.has(imageId);

    if (isImage) {
      return (
        <div key={index} className="mt-2">
          <div className="relative max-w-sm">
            <img
              src={attachment.url}
              alt={attachment.filename}
              className={`rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 ${isExpanded
                ? 'max-w-full max-h-96 object-contain'
                : 'max-w-xs max-h-48 object-cover hover:opacity-90'
                }`}
              onClick={() => toggleImageExpansion(imageId)}
              loading="lazy"
            />

            {/* Image overlay with filename and actions */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between">
                <span className="text-sm truncate flex-1">{attachment.filename}</span>
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileInNewTab(attachment.url);
                    }}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                    title="Open in new tab"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(attachment.url, attachment.filename);
                    }}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Image metadata */}
          <div className="text-xs text-gray-500 mt-1">
            {attachment.size && `${formatFileSize(attachment.size)} • `}
            Click to {isExpanded ? 'collapse' : 'expand'}
          </div>
        </div>
      );
    } else {
      // Document/file attachment
      return (
        <div
          key={index}
          className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors max-w-sm"
          onClick={() => openFileInNewTab(attachment.url)}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getFileIcon(attachment.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.filename}
              </p>
              <p className="text-xs text-gray-500">
                {attachment.size ? formatFileSize(attachment.size) : 'Unknown size'}
                {attachment.type && ` • ${attachment.type.split('/')[1]?.toUpperCase()}`}
              </p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFile(attachment.url, attachment.filename);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {message.sender_name.charAt(0)}
              </div>
              <div>
                <span className="font-medium text-gray-900">{message.sender_name}</span>
                {message.sender_email && (
                  <span className="text-sm text-gray-500 ml-2">({message.sender_email})</span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(message.created_at)}
            </span>
          </div>

          {/* Message content */}
          {message.content && (
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-2">
              {message.content}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment, index) =>
                renderAttachment(attachment, message.id, index)
              )}
            </div>
          )}

          {/* QA Review indicator */}
          {message.content.includes('@QAreview') && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-green-800 font-medium">QA Review Triggered</span>
              </div>
              <p className="text-green-700 mt-1">This message has been flagged for quality assurance review.</p>
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

// Update the MessageInput component in App.tsx to use the new enhanced version

// Replace the existing MessageInput component with:

const MessageInput: React.FC<{ taskId: string; onMessageSent: () => void }> = ({ taskId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    preview?: string;
    uploading: boolean;
    uploadedUrl?: string;
    id: string;
  }>>([]);
  const [isSending, setIsSending] = useState(false);

  const hasQATrigger = message.includes('@QAreview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const ALLOWED_FILE_TYPES = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // File upload function inside component
  const uploadFile = async (file: File, taskId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    const allAllowedTypes = [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents];
    if (!allAllowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload images (JPEG, PNG, GIF, WebP) or documents (PDF, Word, Excel, TXT, CSV)';
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }

      const fileId = `${Date.now()}-${Math.random()}`;
      const fileData = {
        file,
        uploading: true,
        id: fileId,
        preview: ALLOWED_FILE_TYPES.images.includes(file.type)
          ? URL.createObjectURL(file)
          : undefined
      };

      setUploadedFiles(prev => [...prev, fileData]);

      try {
        const uploadResult = await uploadFile(file, taskId);
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, uploading: false, uploadedUrl: uploadResult.url }
              : f
          )
        );
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const getFileIcon = (type: string) => {
    if (ALLOWED_FILE_TYPES.images.includes(type)) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('csv')) return '📊';
    return '📎';
  };

  // Enhanced mutation that aggressively refreshes QA stats
  const sendMessageMutation = useMutation(
    async (messageData: any) => {
      return await apiService.sendMessage(taskId, messageData);
    },
    {
      onSuccess: (response) => {
        // Handle QA results if present
        if (response.qaReview) {
          setTimeout(() => {
            toast.success(
              <div>
                <div className="font-medium">✅ QA Complete</div>
                <div className="text-sm">Score: {response.qaReview.score}/10 • {response.qaReview.category}</div>
              </div>,
              { duration: 4000 }
            );
          }, 1000);
        }

        // Reset form state
        setMessage('');
        setUploadedFiles([]);
        onMessageSent();

        // AGGRESSIVE stats refresh for real-time updates
        const refreshAllQAQueries = () => {
          // Invalidate all QA-related queries
          queryClient.invalidateQueries(['messages', taskId]);
          queryClient.invalidateQueries(['qa-reviews', taskId]);
          queryClient.invalidateQueries(['qa-stats', taskId]);

          // Force refetch stats queries specifically
          queryClient.refetchQueries(['qa-stats', taskId]);

          // Remove from cache to force fresh fetch
          queryClient.removeQueries(['qa-stats', taskId]);
        };

        // Initial refresh
        refreshAllQAQueries();

        // If QA was triggered, do additional refreshes
        if (response.qaReview || hasQATrigger) {
          // Refresh again after 1 second (when QA processing might be complete)
          setTimeout(refreshAllQAQueries, 1000);

          // And once more after 3 seconds to ensure stats are updated
          setTimeout(refreshAllQAQueries, 3000);

          // Final refresh after 5 seconds
          setTimeout(refreshAllQAQueries, 5000);
        }

        toast.success('Message sent');
      },
      onError: (error) => {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      },
      onSettled: () => {
        setIsSending(false);
      }
    }
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Prevent duplicate sends
    if (isSending || sendMessageMutation.isLoading) {
      console.log('Already sending, preventing duplicate');
      return;
    }

    if (!message.trim() && uploadedFiles.length === 0) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    if (uploadedFiles.some(f => f.uploading)) {
      toast.error('Please wait for all files to finish uploading');
      return;
    }

    setIsSending(true);

    // Show QA processing indicator if @QAreview is present
    if (hasQATrigger) {
      toast.success(
        <div>
          <div className="font-medium">🔍 QA Review Triggered</div>
          <div className="text-sm">Quality analysis in progress...</div>
        </div>,
        { duration: 3000 }
      );
    }

    const attachments = uploadedFiles.map(f => ({
      filename: f.file.name,
      url: f.uploadedUrl!,
      type: f.file.type,
      size: f.file.size
    }));

    const messageData = {
      content: message.trim(),
      sender_name: 'Current User',
      sender_email: 'user@company.com',
      message_type: attachments.length > 0 ? 'file' : 'text',
      attachments: attachments.length > 0 ? attachments : undefined
    };

    console.log('Sending message with data:', messageData);
    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = isSending || sendMessageMutation.isLoading || uploadedFiles.some(f => f.uploading);

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* File Previews */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {uploadedFiles.map((fileData) => (
            <div key={fileData.id} className="relative bg-gray-50 border border-gray-200 rounded-lg p-2 max-w-xs">
              <div className="flex items-center space-x-2">
                {fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt={fileData.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xl">
                    {getFileIcon(fileData.file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileData.file.size / 1024).toFixed(1)} KB
                  </p>
                  {fileData.uploading && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div className="bg-blue-600 h-1 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(fileData.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  disabled={fileData.uploading}
                >
                  ✕
                </button>
              </div>
              {fileData.uploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* QA Status Indicator */}
      {hasQATrigger && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <span>🔍</span>
          <span className="text-sm text-green-800 font-medium">QA Review will be triggered</span>
          {(isSending || sendMessageMutation.isLoading) && hasQATrigger && (
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
          )}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Use @QAreview to trigger quality review)"
            className={`w-full border rounded-lg px-3 py-2 pr-12 focus:outline-none focus:ring-2 resize-none ${hasQATrigger
              ? 'border-green-300 focus:ring-green-500 bg-green-50'
              : 'border-gray-300 focus:ring-blue-500'
              }`}
            rows={3}
            disabled={isDisabled}
          />

          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Attach file"
            disabled={isDisabled}
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-fit"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          <span>{isDisabled ? 'Sending...' : 'Send'}</span>
        </button>
      </form>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={[...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents].join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mt-2 text-xs text-gray-500">
        <strong>Pro tip:</strong> Use <code className="bg-gray-200 px-1 rounded">@QAreview</code> in your message to trigger quality assurance review •
        Attach images or documents up to 10MB
      </div>
    </div>
  );
};




// Main App Component
// Add this to your MainApp component - replace the existing MainApp component

// Replace your MainApp component with this enhanced version

const MainApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showQA, setShowQA] = useState(false); // Add this line
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set()); const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    page: 1,
    limit: 10
  });

  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // Fetch tasks with real-time updates
  const { data: tasksData, isLoading, error, refetch } = useQuery(
    ['tasks', filters],
    () => apiService.getTasks(filters),
    {
      keepPreviousData: true,
      refetchInterval: 30000,
    }
  );

  // Fetch messages for selected task
  const { data: messagesData, refetch: refetchMessages } = useQuery(
    ['messages', selectedTask?.id],
    () => selectedTask ? apiService.getMessages(selectedTask.id) : null,
    {
      enabled: !!selectedTask,
      refetchInterval: 5000,
    }
  );

  // Create task mutation
  const createTaskMutation = useMutation(
    (taskData: any) => apiService.createTask(taskData),
    {
      onSuccess: (newTask) => {
        queryClient.invalidateQueries(['tasks']);
        setShowNewTaskModal(false);
        toast.success(`🎉 New task created: "${newTask.title}"`);

        if (socket) {
          socket.emit('task_created', newTask);
        }
      },
      onError: (error) => {
        console.error('Create task error:', error);
        toast.error('❌ Failed to create task. Please try again.');
      }
    }
  );

  // Enhanced update task mutation with visual feedback
 // Fixed Update Task Mutation - App.tsx
// Replace your existing updateTaskMutation with this:

const updateTaskMutation = useMutation(
  ({ taskId, updates, changeType, oldValue, newValue }: {
    taskId: string;
    updates: Partial<Task>;
    changeType?: 'status' | 'assignment';
    oldValue?: string;
    newValue?: string;
  }) => {
    console.log('🚀 updateTaskMutation called:', {
      taskId,
      updates,
      changeType,
      oldValue,
      newValue
    });

    // Add task to updating set for loading state
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    
    return apiService.updateTask(taskId, updates);
  },
  {
    onSuccess: (updatedTask, variables) => {
      console.log('✅ updateTaskMutation success:', {
        updatedTask,
        variables
      });

      // Remove task from updating set
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.taskId);
        return newSet;
      });

      // Force immediate refresh of tasks data
      queryClient.invalidateQueries(['tasks']);
      
      // Also force a refetch to ensure immediate UI update
      refetch();

      // Show detailed notification based on change type
      if (variables.changeType && variables.oldValue !== undefined && variables.newValue !== undefined) {
        const notification = variables.changeType === 'status'
          ? `📋 Status: ${variables.oldValue} → ${variables.newValue}`
          : `👥 Assigned: ${variables.oldValue} → ${variables.newValue}`;

        toast.success(
          <div>
            <div className="font-medium">"{updatedTask.title}"</div>
            <div className="text-sm">{notification}</div>
          </div>,
          { duration: 3000 }
        );
      } else {
        toast.success(`✅ Task "${updatedTask.title}" updated`);
      }

      // Emit socket event for real-time updates to other users
      if (socket) {
        socket.emit('task_updated', updatedTask);
      }

      // Update selected task if it's the one being updated
      if (selectedTask && selectedTask.id === variables.taskId) {
        setSelectedTask(updatedTask);
      }
    },
    onError: (error, variables) => {
      console.error('❌ updateTaskMutation error:', error, variables);

      // Remove task from updating set
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.taskId);
        return newSet;
      });

      // Show error message
      toast.error('❌ Failed to update task. Please try again.');
    }
  }
);

  // Real-time socket handlers
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (task: Task) => {
      queryClient.invalidateQueries(['tasks']);
      // Don't show notification for our own updates
      if (!updatingTasks.has(task.id)) {
        toast.success(`🔄 Task "${task.title}" was updated by another user`, {
          duration: 4000,
        });
      }
    };

    const handleTaskCreated = (task: Task) => {
      queryClient.invalidateQueries(['tasks']);
      toast.success(`🆕 New task created: "${task.title}"`, {
        duration: 4000,
      });
    }; const handleNewMessage = (message: Message) => {
      if (selectedTask && message.task_id === selectedTask.id) {
        queryClient.invalidateQueries(['messages', selectedTask.id]);

        if (message.sender_name !== 'Current User') {
          toast.success(`💬 New message from ${message.sender_name}`, {
            duration: 3000,
          });
        }
      }
      queryClient.invalidateQueries(['tasks']);
    };

    const handleMessageCountUpdate = (data: { taskId: string; messageCount: number; timestamp: string }) => {
      console.log(`📊 Received message count update for task ${data.taskId}: ${data.messageCount} messages`);

      // Invalidate tasks query to refresh the task list with updated message counts
      queryClient.invalidateQueries(['tasks']);

      // Optionally show a subtle notification for message count updates
      // Uncomment if you want to show notifications for message count changes
      // toast.success(`📬 Message count updated for task`, { duration: 2000 });
    };

    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_created', handleTaskCreated);
    socket.on('new_message', handleNewMessage);
    socket.on('task_message_count_updated', handleMessageCountUpdate);

    return () => {
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_created', handleTaskCreated);
      socket.off('new_message', handleNewMessage);
      socket.off('task_message_count_updated', handleMessageCountUpdate);
    };
    console.log('🔍 Debug - Selected Task:', selectedTask?.title);
    console.log('🔍 Debug - Show Summary:', showSummary);
    console.log('🔍 Debug - Messages Data:', messagesData?.messages?.length);
  }, [socket, selectedTask, queryClient, updatingTasks]);

  // Task handlers
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowSummary(false);
    if (socket) {
      socket.emit('join_task', task.id);
    }
  };

  const handleTaskDeselect = () => {
    if (selectedTask && socket) {
      socket.emit('leave_task', selectedTask.id);
    }
    setSelectedTask(null);
    setShowSummary(false);
  };

  // Enhanced status change handler
  const handleStatusChange = (taskId: string, newStatus: string) => {
    const task = tasksData?.tasks?.find((t: Task) => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus as TaskStatus },
      changeType: 'status',
      oldValue: oldStatus,
      newValue: newStatus
    });
  };

  // New assignment change handler
  // Replace your handleAssignmentChange function in App.tsx with this:

// Fixed Assignment Change Handler - App.tsx
// Replace your existing handleAssignmentChange function with this:

const handleAssignmentChange = (taskId: string, assignee: string | null) => {
  console.log('🏠 Parent handleAssignmentChange called:', {
    taskId,
    assignee,
    assigneeType: typeof assignee,
    isNull: assignee === null,
    isUndefined: assignee === undefined,
    isEmptyString: assignee === '',
    actualValue: assignee
  });

  const task = tasksData?.tasks?.find((t: Task) => t.id === taskId);
  if (!task) {
    console.error('❌ Task not found:', taskId);
    return;
  }

  const oldAssignee = task.assigned_to;

  // CRITICAL FIX: Handle unassign properly
  let updates: Partial<Task>;
  
  if (assignee === null || assignee === undefined || assignee === '') {
    // For unassign, explicitly set to null
    console.log('🚫 UNASSIGNING TASK - Setting assigned_to to null');
    updates = { assigned_to: null as any }; // Force null for unassign
  } else {
    // For assign, set to the assignee name
    console.log('👤 ASSIGNING TASK to:', assignee);
    updates = { assigned_to: assignee };
  }

  console.log('📝 Final update object:', {
    taskId,
    updates,
    updateAssignedTo: updates.assigned_to,
    updateType: typeof updates.assigned_to,
    isNull: updates.assigned_to === null
  });

  // Call the mutation
  updateTaskMutation.mutate({
    taskId,
    updates,
    changeType: 'assignment',
    oldValue: oldAssignee || 'Unassigned',
    newValue: assignee || 'Unassigned'
  });
};


  // New task handlers
  const handleNewTask = () => {
    setShowNewTaskModal(true);
  };

  const handleCreateTask = (taskData: any) => {
    createTaskMutation.mutate(taskData);
  };

  // Enhanced Task Item component with new controls
  const TaskItem = ({ task, isSelected, onSelect }: any) => (
    <EnhancedTaskItem
      task={task}
      isSelected={isSelected}
      onSelect={onSelect}
      onStatusChange={handleStatusChange}
      onAssignmentChange={handleAssignmentChange}
      updatingTasks={updatingTasks}
    />);

// Replace your existing SummaryPanel component with this enhanced version
const SummaryPanel = ({ task, showSummary }: any) => {
  const { data: messagesData } = useQuery(
    ['messages', task.id],
    () => apiService.getMessages(task.id),
    { enabled: !!task.id }
  );

  return showSummary ? (
    <EnhancedSummaryPanel
      task={task}
      showSummary={showSummary}
      messages={messagesData?.messages || []}
    />
  ) : null;
};

  // Filter tasks
  const filteredTasks = tasksData?.tasks?.filter((task: Task) => {
    const matchesSearch = !filters.search ||
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.requester_name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-4">Failed to connect to the backend server</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">FAFF v0</h1>
              <span className="text-sm text-gray-500">Internal Ticketing & Chat System</span>
              <div className={`flex items-center space-x-1 text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{isConnected ? 'Real-time connected' : 'Connecting...'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Operations Team</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </header>      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task List Panel */}
        <ResizablePanel
          defaultWidth={selectedTask ? 600 : window.innerWidth}
          minWidth={400}
          maxWidth={800}
          position="left"
          className="bg-white border-r border-gray-200"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Tasks ({filteredTasks.length})
              </h2>
              <button
                onClick={handleNewTask}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
              >
                + New Task
              </button>
            </div>
            <TaskFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              filteredTasks.map((task: Task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onSelect={() => handleTaskSelect(task)}
                />
              ))
            )}
          </div>
        </ResizablePanel>

        {/* Chat Panel */}
        {selectedTask && (
          <div className="flex-1 flex">
            <div className={`flex flex-col transition-all duration-300 ${showSummary && showQA ? 'w-1/3' :
              showSummary || showQA ? 'w-2/3' : 'w-full'
              }`}>
              {/* Chat Header - Update this section */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
                    <p className="text-sm text-gray-600">
                      Assigned to: {selectedTask.assigned_to || 'Unassigned'} •
                      Priority: {selectedTask.priority} •
                      Status: {selectedTask.status}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Summary Toggle */}
                    <button
                      onClick={() => setShowSummary(!showSummary)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${showSummary
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {showSummary ? 'Hide Summary' : 'Show Summary'}
                    </button>

                    {/* QA Toggle - Add this button */}
                    <button
                      onClick={() => setShowQA(!showQA)}
                      className={`px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1 ${showQA
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      <span>🔍</span>
                      <span>{showQA ? 'Hide QA' : 'Show QA'}</span>
                    </button>

                    {/* Close Button */}
                    <button
                      onClick={handleTaskDeselect}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <MessageThread messages={messagesData?.messages || []} />

              {/* Message Input */}
              <MessageInput taskId={selectedTask.id} onMessageSent={refetchMessages} />
            </div>

            {/* Summary Panel */}
            <SummaryPanel
              task={selectedTask}
              showSummary={showSummary}
            />

            {/* QA Panel - Add this section */}
            {showQA && (
              <EnhancedQAReviewPanel
                taskId={selectedTask.id}
                onClose={() => setShowQA(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSubmit={handleCreateTask}
        isLoading={createTaskMutation.isLoading}
      />
    </div>
  );
};

// App wrapper with QueryClient
const App: React.FC = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        staleTime: 5 * 60 * 1000,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;