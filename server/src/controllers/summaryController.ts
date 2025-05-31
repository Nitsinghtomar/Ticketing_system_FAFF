// server/src/controllers/summaryController.ts
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { anthropicService } from '../services/anthropicService';

// In-memory storage for summaries - replace with database in production
let summaries: any[] = [];

// In-memory storage for messages - this should come from your actual message storage
let messages: any[] = [
  {
    id: 'm1',
    task_id: '1',
    sender_name: 'Alice Cooper',
    sender_email: 'alice@enterprise.com',
    content: 'Hi team, we\'re experiencing login issues affecting 50+ users. Our support contact is +1-555-0123 and you can reach me at alice@enterprise.com',
    message_type: 'text',
    attachments: [],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'm2',
    task_id: '1',
    sender_name: 'John Smith',
    sender_email: 'john@company.com',
    content: 'Thanks Alice. I\'ve found the issue in our OAuth configuration. Check this documentation: https://docs.oauth.com/tokens and I\'ll have a fix ready soon.',
    message_type: 'text',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'm3',
    task_id: '2',
    sender_name: 'Bob Martinez',
    sender_email: 'bob@company.com',
    content: 'Database performance has degraded significantly. Query times increased from 100ms to 2000ms. Need to optimize indexes.',
    message_type: 'text',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class SummaryController {
  async generateSummary(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      
      console.log(`🤖 Generating AI summary for task ${taskId}...`);

      // Get messages for this specific task
      const taskMessages = messages.filter(msg => msg.task_id === taskId);
      
      if (taskMessages.length === 0) {
        return res.status(400).json({ error: 'No messages found for this task' });
      }

      // Get task information (this should come from your task storage)
      const taskInfo = await this.getTaskInfo(taskId);

      console.log(`📝 Found ${taskMessages.length} messages for task ${taskId}`);

      // Generate AI summary using Claude
      const aiSummary = await anthropicService.generateTaskSummary(taskMessages, taskInfo);

      console.log(`✅ AI summary generated successfully for task ${taskId}`);

      // Extract entities from the conversation
      const extractedEntities = this.extractEntities(taskMessages);

      const summaryData = {
        id: uuidv4(),
        task_id: taskId,
        summary: aiSummary.summary,
        entities: {
          ...extractedEntities,
          ...aiSummary.entities
        },
        metadata: {
          messageCount: taskMessages.length,
          participantCount: new Set(taskMessages.map(m => m.sender_name)).size,
          generatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };

      // Store or update summary
      const existingIndex = summaries.findIndex(s => s.task_id === taskId);
      if (existingIndex >= 0) {
        summaries[existingIndex] = summaryData;
        console.log(`🔄 Updated existing summary for task ${taskId}`);
      } else {
        summaries.push(summaryData);
        console.log(`🆕 Created new summary for task ${taskId}`);
      }

      res.json(summaryData);
    } catch (error) {
      console.error('❌ Summary generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const summary = summaries.find(s => s.task_id === taskId);
      
      if (!summary) {
        return res.status(404).json({ error: 'Summary not found' });
      }

      console.log(`📖 Retrieved summary for task ${taskId}`);
      res.json(summary);
    } catch (error) {
      console.error('❌ Error fetching summary:', error);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  }

  // Helper method to get task information
  private async getTaskInfo(taskId: string) {
    // This should fetch from your actual task storage
    // For now, returning mock data based on taskId
    const taskMockData: { [key: string]: any } = {
      '1': {
        title: 'Fix login issue for enterprise customers',
        status: 'ongoing',
        priority: 'high',
        assigned_to: 'John Smith',
        requester_name: 'Alice Cooper'
      },
      '2': {
        title: 'Database performance optimization',
        status: 'reviewed',
        priority: 'medium',
        assigned_to: 'Sarah Johnson',
        requester_name: 'Bob Martinez'
      },
      '3': {
        title: 'Add new payment gateway integration',
        status: 'logged',
        priority: 'medium',
        assigned_to: null,
        requester_name: 'Carol Davis'
      }
    };

    return taskMockData[taskId] || {
      title: 'Unknown Task',
      status: 'logged',
      priority: 'medium',
      assigned_to: null,
      requester_name: 'Unknown'
    };
  }

  // Enhanced entity extraction method
  private extractEntities(messages: any[]) {
    const entities = {
      phoneNumbers: new Set<string>(),
      emails: new Set<string>(),
      urls: new Set<string>(),
      dates: new Set<string>(),
      mentions: new Set<string>()
    };

    messages.forEach(message => {
      const content = message.content;

      // Extract phone numbers (various formats)
      const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
      const phones = content.match(phoneRegex);
      if (phones) {
        phones.forEach((phone: string) => entities.phoneNumbers.add(phone.trim()));
      }

      // Extract email addresses
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = content.match(emailRegex);
      if (emails) {
        emails.forEach((email: string) => entities.emails.add(email));
      }

      // Extract URLs
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = content.match(urlRegex);
      if (urls) {
        urls.forEach((url: string) => entities.urls.add(url));
      }

      // Extract dates
      const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
      const dates = content.match(dateRegex);
      if (dates) {
        dates.forEach((date: string) => entities.dates.add(date));
      }

      // Extract @mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = content.match(mentionRegex);
      if (mentions) {
        mentions.forEach((mention: string) => entities.mentions.add(mention));
      }
    });

    return {
      phoneNumbers: Array.from(entities.phoneNumbers),
      emails: Array.from(entities.emails),
      urls: Array.from(entities.urls),
      dates: Array.from(entities.dates),
      mentions: Array.from(entities.mentions)
    };
  }

  // Method to add a message (for testing purposes)
  addMessage(message: any) {
    messages.push(message);
  }

  // Method to get messages for a task (for debugging)
  getMessagesForTask(taskId: string) {
    return messages.filter(msg => msg.task_id === taskId);
  }
}