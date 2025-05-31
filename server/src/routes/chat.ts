// server/src/routes/chat.ts
import express from 'express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Define interfaces for type safety
interface Attachment {
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
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

interface AttachmentInput {
  filename: string;
  url: string;
  type: string;
  size: number;
}

// In-memory storage for demo - replace with database in production
let messages: Message[] = [
  {
    id: 'm1',
    task_id: '1',
    sender_name: 'Alice Cooper',
    sender_email: 'alice@enterprise.com',
    content: 'Hi team, we\'re experiencing login issues affecting 50+ users.',
    message_type: 'text',
    attachments: [],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get messages for a task
router.get('/:taskId/messages', async (req: Request, res: Response) => {
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
    
    res.json({
      messages: taskMessages,
      pagination: { 
        page: pageNum, 
        limit: limitNum, 
        total: messages.filter(msg => msg.task_id === taskId).length 
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/:taskId/messages', async (req: Request, res: Response) => {
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

    // Process attachments if provided - explicitly type the variable
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

    // Save message
    messages.push(messageData);

    // Log the message for debugging
    console.log(`✅ Message sent in task ${taskId}:`);
    console.log(`   Content: ${content ? content.substring(0, 50) + '...' : '[no text]'}`);
    console.log(`   Attachments: ${processedAttachments.length}`);
    if (processedAttachments.length > 0) {
      console.log(`   Files: ${processedAttachments.map(a => a.filename).join(', ')}`);
    }

    // Note: In your server.ts, you should emit socket events here
    // Example: io.to(`task_${taskId}`).emit('new_message', messageData);

    res.status(201).json(messageData);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete a message
router.delete('/:taskId/messages/:messageId', async (req: Request, res: Response) => {
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
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get all attachments for a task
router.get('/:taskId/attachments', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const taskMessages = messages.filter(msg => msg.task_id === taskId);
    const attachments = taskMessages
      .filter(msg => msg.attachments && msg.attachments.length > 0)
      .flatMap(msg => 
        msg.attachments.map((attachment: Attachment) => ({
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
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

export default router;