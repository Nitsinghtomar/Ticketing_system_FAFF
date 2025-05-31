import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { chatController } from './chatController';

// Enhanced mock database with more sample data
let tasks: any[] = [
  {
    id: '1',
    title: 'Fix login issue for enterprise customers',
    description: 'Multiple enterprise customers reporting login failures after the recent update',
    requester_name: 'Alice Cooper',
    requester_email: 'alice@enterprise.com',
    assigned_to: 'John Smith',
    status: 'ongoing',
    priority: 'high',
    tags: ['bug', 'authentication', 'enterprise'], created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Database performance optimization',
    description: 'Query response times have increased significantly in the past week',
    requester_name: 'Bob Martinez',
    requester_email: 'bob@company.com',
    assigned_to: 'Sarah Johnson',
    status: 'reviewed',
    priority: 'medium',
    tags: ['performance', 'database', 'optimization'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Add new payment gateway integration',
    description: 'Integrate Stripe payment gateway for European customers',
    requester_name: 'Carol Davis',
    requester_email: 'carol@company.com',
    assigned_to: null,
    status: 'logged',
    priority: 'medium',
    tags: ['feature', 'payment', 'integration'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Security vulnerability in file upload',
    description: 'Potential security issue discovered in file upload functionality',
    requester_name: 'Dave Thompson',
    requester_email: 'dave@security.com',
    assigned_to: 'Mike Wilson',
    status: 'blocked',
    priority: 'urgent',
    tags: ['security', 'vulnerability', 'upload'],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class TaskController {
  async getTasks(req: Request, res: Response) {
    try {
      const { page = '1', limit = '50', status, priority, search } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const offset = (pageNum - 1) * limitNum;

      let filteredTasks = [...tasks];

      if (status) {
        filteredTasks = filteredTasks.filter(task => task.status === status);
      }
      if (priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === priority);
      }
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description?.toLowerCase().includes(searchTerm) ||
          task.requester_name.toLowerCase().includes(searchTerm)
        );
      } const paginatedTasks = filteredTasks.slice(offset, offset + limitNum);

      // Add real message counts to each task
      const tasksWithMessageCounts = paginatedTasks.map(task => ({
        ...task,
        messageCount: chatController.getMessagesForTask(task.id).length
      }));

      res.json({
        tasks: tasksWithMessageCounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredTasks.length,
          pages: Math.ceil(filteredTasks.length / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
  async createTask(req: Request, res: Response) {
    try {
      const taskData = {
        id: uuidv4(),
        ...req.body,
        status: 'logged',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      tasks.push(taskData);

      // Add real message count to the response
      const taskWithMessageCount = {
        ...taskData,
        messageCount: chatController.getMessagesForTask(taskData.id).length
      };

      res.status(201).json(taskWithMessageCount);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = tasks.find(task => task.id === id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Add real message count to the task
      const taskWithMessageCount = {
        ...task,
        messageCount: chatController.getMessagesForTask(task.id).length
      };

      res.json(taskWithMessageCount);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
  // In your server/src/controllers/taskController.ts, 
// make sure your updateTask method handles undefined properly:

// Fixed Server Update Task Method - taskController.ts
// Replace your existing updateTask method with this:

async updateTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Server updateTask called:', {
      taskId: id,
      updates,
      assigned_to: updates.assigned_to,
      assigned_to_type: typeof updates.assigned_to,
      is_undefined: updates.assigned_to === undefined,
      is_null: updates.assigned_to === null,
      raw_body: JSON.stringify(req.body)
    });

    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      console.error('❌ Task not found:', id);
      return res.status(404).json({ error: 'Task not found' });
    }

    const originalTask = { ...tasks[taskIndex] };

    // Handle assignment updates properly
    if ('assigned_to' in updates) {
      if (updates.assigned_to === undefined || updates.assigned_to === null || updates.assigned_to === '') {
        // Unassign the task
        console.log('🚫 Unassigning task');
        updates.assigned_to = null;
      } else {
        // Assign to specific person
        console.log('👤 Assigning task to:', updates.assigned_to);
      }
    }

    // Update the task
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    const updatedTask = tasks[taskIndex];

    console.log('✅ Task updated successfully:', {
      taskId: id,
      originalAssignedTo: originalTask.assigned_to,
      newAssignedTo: updatedTask.assigned_to,
      updatedTask: updatedTask
    });

    // Add real message count to the response
    const taskWithMessageCount = {
      ...updatedTask,
      messageCount: chatController.getMessagesForTask(updatedTask.id).length
    };

    console.log('📤 Sending response:', taskWithMessageCount);
    
    res.json(taskWithMessageCount);
  } catch (error) {
    console.error('❌ Server error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const taskIndex = tasks.findIndex(task => task.id === id);

      if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }

      tasks.splice(taskIndex, 1);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
}