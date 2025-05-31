// server/src/controllers/chatController.ts - Updated with QA integration
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { qaController } from './qaController';
import { logger } from '../utils/logger';

// Define proper TypeScript interfaces
interface Attachment {
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface AttachmentInput {
  filename: string;
  url: string;
  type: string;
  size: number;
}

interface Message {
  id: string;
  task_id: string;
  sender_name: string;
  sender_email: string;
  content: string;
  message_type: 'text' | 'file';
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

interface QAReviewResult {
  score: number;
  category: 'approved' | 'needs_revision' | 'rejected';
  feedback: string;
  suggestions: string[];
  issues: any[];
  linkValidation?: any[];
  ruleResults: any[];
}

// Shared message storage with enhanced sample data
let messages: Message[] = [
  {
    id: 'm1',
    task_id: '1',
    sender_name: 'Alice Cooper',
    sender_email: 'alice@enterprise.com',
    content: 'Hi team, we\'re experiencing login issues affecting 50+ users. Our support contact is +1-555-0123 and you can reach me at alice@enterprise.com for urgent matters.',
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
    content: 'Thanks Alice. I\'ve identified the issue in our OAuth configuration. Here\'s the documentation I\'m following: https://docs.oauth.com/enterprise-auth. I should have a fix deployed by 3 PM today.',
    message_type: 'text',
    attachments: [],
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'm3',
    task_id: '1',
    sender_name: 'Alice Cooper',
    sender_email: 'alice@enterprise.com',
    content: 'Perfect! I\'ll monitor the deployment. Once it\'s live, I\'ll test with our QA environment and notify the affected users.',
    message_type: 'text',
    attachments: [],
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class ChatController {
  private io: any; // Socket.io instance

  constructor(io?: any) {
    this.io = io;
  }

  setSocketIO(io: any) {
    this.io = io;
  }
  async getMessages(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { page = '1', limit = '50' } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const offset = (pageNum - 1) * limitNum;

      const taskMessages = messages
        .filter(msg => msg.task_id === taskId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(offset, offset + limitNum);

      console.log(`📬 Retrieved ${taskMessages.length} messages for task ${taskId}`);

      res.json({
        messages: taskMessages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: messages.filter(msg => msg.task_id === taskId).length
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching messages:', errorMessage);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { content, sender_name, sender_email, message_type = 'text', attachments } = req.body;

      // Validate required fields
      if (!sender_name) {
        return res.status(400).json({ error: 'Sender name is required' });
      }

      if (!content && (!attachments || attachments.length === 0)) {
        return res.status(400).json({ error: 'Message content or attachments are required' });
      }

      // Process attachments if provided
      let processedAttachments: Attachment[] = [];
      if (attachments && Array.isArray(attachments)) {
        processedAttachments = (attachments as AttachmentInput[]).map(attachment => ({
          filename: attachment.filename,
          url: attachment.url,
          type: attachment.type,
          size: attachment.size,
          uploadedAt: new Date().toISOString()
        }));
      }

      const messageData: Message = {
        id: uuidv4(),
        task_id: taskId,
        sender_name,
        sender_email,
        content: content || '',
        message_type: processedAttachments.length > 0 ? 'file' : (message_type as 'text' | 'file'),
        attachments: processedAttachments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save message to shared storage
      messages.push(messageData);

      console.log(`💬 New message in task ${taskId}:`);
      console.log(`   From: ${sender_name}`);
      console.log(`   Content: ${content ? content.substring(0, 50) + '...' : '[file attachment]'}`);
      console.log(`   Attachments: ${processedAttachments.length}`);

      // Check for QA review trigger
      const shouldTriggerQA = content && content.includes('@QAreview');
      let qaReviewResult: QAReviewResult | { error: string } | null = null;

      if (shouldTriggerQA) {
        try {
          console.log(`🔍 QA Review triggered for message ${messageData.id} in task ${taskId}`);

          // Trigger QA review asynchronously
          const qaResponse = await this.triggerQAReviewAsync(messageData.id, taskId, content);
          qaReviewResult = qaResponse as QAReviewResult;

          logger.info('QA Review completed for message', {
            messageId: messageData.id,
            score: (qaReviewResult as QAReviewResult).score,
            category: (qaReviewResult as QAReviewResult).category
          });

        } catch (qaError) {
          const qaErrorMessage = qaError instanceof Error ? qaError.message : 'Unknown QA error occurred';
          logger.error('QA Review failed for message', {
            messageId: messageData.id,
            error: qaErrorMessage
          });
          // Don't fail the message sending if QA fails
          qaReviewResult = { error: 'QA review failed but message was sent successfully' };
        }
      }      // Return message with QA results if triggered
      const response: any = {
        ...messageData,
        qaTriggered: shouldTriggerQA,
        qaReview: qaReviewResult
      };      // Emit socket events for real-time updates
      if (this.io) {
        // Broadcast new message to all users in the task room
        this.io.to(`task_${taskId}`).emit('new_message', messageData);

        // Broadcast message count update for task list refresh
        const currentMessageCount = this.getMessagesForTask(taskId).length;
        this.io.emit('task_message_count_updated', {
          taskId: taskId,
          messageCount: currentMessageCount,
          timestamp: new Date().toISOString()
        });

        console.log(`📊 Broadcasting message count update for task ${taskId}: ${currentMessageCount} messages`);

        // If QA was triggered and completed, emit QA-specific events
        if (shouldTriggerQA && qaReviewResult && !('error' in qaReviewResult)) {
          // Emit QA review completed event
          this.io.to(`task_${taskId}`).emit('qa_review_completed', {
            messageId: messageData.id,
            taskId: taskId,
            qaResult: qaReviewResult,
            timestamp: new Date().toISOString()
          });

          // Emit general QA stats update event to trigger refresh
          this.io.to(`task_${taskId}`).emit('qa_stats_updated', {
            taskId: taskId,
            timestamp: new Date().toISOString(),
            triggeredBy: 'qa_review_completion'
          });

          console.log(`🔍 Broadcasting QA review completion and stats update for message ${messageData.id}`);
        }
      }

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending message:', errorMessage);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Async method to trigger QA review
  private async triggerQAReviewAsync(messageId: string, taskId: string, content: string): Promise<QAReviewResult> {
    try {
      // Create a mock request/response for the QA controller
      const mockReq = {
        body: {
          messageId,
          taskId,
          messageContent: content
        }
      } as Request;

      // Create a promise-based response handler
      return new Promise<QAReviewResult>((resolve, reject) => {
        const mockRes = {
          json: (data: any) => resolve(data as QAReviewResult),
          status: (code: number) => ({
            json: (data: any) => {
              if (code >= 400) {
                reject(new Error(data.error || `HTTP ${code}`));
              } else {
                resolve(data as QAReviewResult);
              }
            }
          })
        } as any;

        qaController.triggerQAReview(mockReq, mockRes);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`QA review failed: ${errorMessage}`);
    }
  }

  async deleteMessage(req: Request, res: Response) {
    try {
      const { taskId, messageId } = req.params;

      const messageIndex = messages.findIndex(msg =>
        msg.id === messageId && msg.task_id === taskId
      );

      if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Remove message
      const deletedMessage = messages.splice(messageIndex, 1)[0];

      console.log(`🗑️ Message ${messageId} deleted from task ${taskId}`);
      res.status(204).send();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error deleting message:', errorMessage);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  async getMessageAttachments(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      const taskMessages = messages.filter(msg => msg.task_id === taskId);
      const attachments = taskMessages
        .filter(msg => msg.attachments && msg.attachments.length > 0)
        .flatMap(msg =>
          msg.attachments.map((attachment: any) => ({
            ...attachment,
            messageId: msg.id,
            sentBy: msg.sender_name,
            sentAt: msg.created_at
          }))
        );

      res.json({
        attachments,
        total: attachments.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching attachments:', errorMessage);
      res.status(500).json({ error: 'Failed to fetch attachments' });
    }
  }

  // Method to get all messages (for summary controller)
  getAllMessages(): Message[] {
    return messages;
  }

  // Method to get messages for a specific task (for summary controller and QA)
  getMessagesForTask(taskId: string): Message[] {
    return messages.filter(msg => msg.task_id === taskId);
  }

  // Method to add a message (for testing or integration)
  addMessage(message: Message): void {
    messages.push(message);
  }
}

// Export a singleton instance for sharing with other controllers
export const chatController = new ChatController();