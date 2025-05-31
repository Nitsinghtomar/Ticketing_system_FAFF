// server/src/routes/summary.ts
import express from 'express';
import { Request, Response } from 'express';
import { anthropicService } from '../services/anthropicService';
import { db } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    console.log(`🤖 Generating summary for task ${taskId}...`);

    // Get messages for the task - fallback to empty array if DB query fails
    let messages: any[] = [];
    try {
      messages = await db('messages')
        .where('task_id', taskId)
        .orderBy('created_at', 'asc');
    } catch (dbError) {
      console.warn('⚠️ Database query failed, using in-memory messages');
      // Import chat controller to get in-memory messages as fallback
      const { chatController } = await import('../controllers/chatController');
      messages = chatController.getMessagesForTask(taskId);
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: 'No messages found for this task' });
    }

    // Get task info - fallback to mock data if needed
    let taskInfo: any = {};
    try {
      taskInfo = await db('tasks').where('id', taskId).first();
    } catch (dbError) {
      console.warn('⚠️ Task lookup failed, using fallback data');
      taskInfo = {
        id: taskId,
        title: `Task ${taskId}`,
        status: 'ongoing',
        priority: 'medium',
        assigned_to: 'Unknown',
        requester_name: 'Unknown User'
      };
    }

    // Generate summary using Anthropic API
    const summaryResult = await anthropicService.generateTaskSummary(messages, taskInfo);

    // Extract entities (simple regex-based extraction as fallback)
    const extractedEntities = extractEntities(messages);

    // Combine AI entities with extracted entities
    const combinedEntities = {
      ...extractedEntities,
      ...summaryResult.entities
    };

    const summaryData = {
      id: uuidv4(),
      task_id: taskId,
      summary: summaryResult.summary,
      entities: combinedEntities,
      metadata: {
        messageCount: messages.length,
        participantCount: new Set(messages.map(m => m.sender_name)).size,
        generatedAt: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to save to database, but don't fail if DB is not available
    try {
      await db('summaries')
        .insert({
          id: summaryData.id,
          task_id: taskId,
          content: summaryData.summary,
          entities: JSON.stringify(summaryData.entities),
          created_at: summaryData.created_at,
          updated_at: summaryData.updated_at
        })
        .onConflict('task_id')
        .merge(['content', 'entities', 'updated_at']);
      
      console.log(`✅ Summary saved to database for task ${taskId}`);
    } catch (dbError) {
      console.warn('⚠️ Failed to save summary to database, returning generated summary anyway');
    }

    res.json(summaryData);
  } catch (error) {
    console.error('❌ Summary generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    // Try to get from database first
    try {
      const summary = await db('summaries')
        .where('task_id', taskId)
        .first();

      if (summary) {
        const result = {
          id: summary.id,
          task_id: summary.task_id,
          summary: summary.content,
          entities: JSON.parse(summary.entities || '{}'),
          created_at: summary.created_at,
          updated_at: summary.updated_at
        };
        
        return res.json(result);
      }
    } catch (dbError) {
      console.warn('⚠️ Database query failed for summary lookup');
    }
    
    // If not found in database or DB error, return 404
    res.status(404).json({ error: 'Summary not found' });
  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Helper functions for entity extraction
function extractEntities(messages: any[]) {
  const entities = {
    phoneNumbers: new Set<string>(),
    emails: new Set<string>(),
    urls: new Set<string>(),
    dates: new Set<string>(),
    mentions: new Set<string>()
  };

  const allContent = messages.map(msg => msg.content).join(' ');

  // Extract phone numbers
  const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = allContent.match(phoneRegex);
  if (phones) {
    phones.forEach((phone: string) => entities.phoneNumbers.add(phone.trim()));
  }

  // Extract email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = allContent.match(emailRegex);
  if (emails) {
    emails.forEach((email: string) => entities.emails.add(email));
  }

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = allContent.match(urlRegex);
  if (urls) {
    urls.forEach((url: string) => entities.urls.add(url));
  }

  // Extract dates
  const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
  const dates = allContent.match(dateRegex);
  if (dates) {
    dates.forEach((date: string) => entities.dates.add(date));
  }

  // Extract @mentions
  const mentionRegex = /@(\w+)/g;
  const mentions = allContent.match(mentionRegex);
  if (mentions) {
    mentions.forEach((mention: string) => entities.mentions.add(mention));
  }

  return {
    phoneNumbers: Array.from(entities.phoneNumbers),
    emails: Array.from(entities.emails),
    urls: Array.from(entities.urls),
    dates: Array.from(entities.dates),
    mentions: Array.from(entities.mentions)
  };
}

export default router;