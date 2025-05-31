import axios from 'axios';
import { Task, TaskStatus, TaskPriority } from '../types/Task';
import { Message } from '../types/Message';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

export const apiService = {
  // Tasks
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

  async deleteTask(taskId: string) {
    await api.delete(`/tasks/${taskId}`);
  },

  // Chat
  async getMessages(taskId: string, page?: number) {
    const response = await api.get(`/chat/${taskId}/messages`, {
      params: { page }
    });
    return response.data;
  },

  async sendMessage(taskId: string, messageData: {
    content: string;
    sender_name: string;
    sender_email?: string;
    parent_message_id?: string;
  }) {
    const response = await api.post(`/chat/${taskId}/messages`, messageData);
    return response.data;
  },

  // Summary
  async generateSummary(taskId: string) {
    const response = await api.post(`/summary/tasks/${taskId}`);
    return response.data;
  },

  async getSummary(taskId: string) {
    const response = await api.get(`/summary/tasks/${taskId}`);
    return response.data;
  },

  // Quality Assurance
  async triggerQAReview(messageId: string, taskId: string) {
    const response = await api.post('/qa/review', { messageId, taskId });
    return response.data;
  },

  async getQAReviews(taskId: string) {
    const response = await api.get(`/qa/reviews/${taskId}`);
    return response.data;
  }
};

export { apiService as api };