// server/src/controllers/qaController.ts - FIXED VERSION
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { qaService, QAResult } from '../services/qaService';
import { chatController } from './chatController';

// In-memory storage for QA reviews - replace with database in production
let qaReviews: any[] = [];

export class QAController {
  private io: any; // Socket.io instance

  constructor(io?: any) {
    this.io = io;
  }

  setSocketIO(io: any) {
    this.io = io;
  }

  async triggerQAReview(req: Request, res: Response) {
    try {
      const { messageId, taskId, messageContent } = req.body;

      console.log('🔍 QA Review triggered:', { messageId, taskId, messageContentLength: messageContent?.length });

      // Validate required fields
      if (!messageId || !taskId || !messageContent) {
        return res.status(400).json({
          error: 'Missing required fields: messageId, taskId, and messageContent are required'
        });
      }

      // Get conversation history for context - with proper error handling
      let conversationHistory: any[] = [];
      try {
        conversationHistory = chatController.getMessagesForTask(taskId) || [];
        console.log('📝 Retrieved conversation history:', { count: conversationHistory.length });
      } catch (error) {
        console.warn('⚠️ Failed to get conversation history, proceeding without it:', error);
        conversationHistory = [];
      }

      // Get task information (mock data for now) - with proper defaults
      const taskInfo = this.getTaskInfo(taskId);
      console.log('📋 Using task info:', taskInfo);

      // Perform comprehensive QA review
      console.log('🤖 Starting QA analysis...');
      const qaResult: QAResult = await qaService.performQAReview(
        messageContent,
        taskInfo,
        conversationHistory
      );

      console.log('✅ QA analysis completed:', { 
        score: qaResult.score, 
        category: qaResult.category,
        issuesCount: qaResult.issues.length 
      });

      // Save QA review result
      const reviewData = {
        id: uuidv4(),
        message_id: messageId,
        task_id: taskId,
        message_content: messageContent,
        score: qaResult.score,
        feedback: qaResult.feedback,
        suggestions: qaResult.suggestions,
        issues: qaResult.issues,
        link_validation: qaResult.linkValidation,
        rule_results: qaResult.ruleResults,
        category: qaResult.category,
        status: qaResult.category === 'approved' ? 'approved' :
          qaResult.category === 'rejected' ? 'rejected' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      qaReviews.push(reviewData);

      // Return comprehensive review results
      const result = {
        reviewId: reviewData.id,
        score: qaResult.score,
        feedback: qaResult.feedback,
        suggestions: qaResult.suggestions,
        issues: qaResult.issues,
        linkValidation: qaResult.linkValidation,
        category: qaResult.category,
        status: reviewData.status,
        ruleResults: qaResult.ruleResults,
        timestamp: reviewData.created_at
      };

      // Emit socket events for real-time updates
      if (this.io) {
        // Emit QA review completed event
        this.io.to(`task_${taskId}`).emit('qa_review_completed', {
          messageId: messageId,
          taskId: taskId,
          qaResult: result,
          timestamp: new Date().toISOString()
        });

        // Emit QA stats update event to trigger refresh
        this.io.to(`task_${taskId}`).emit('qa_stats_updated', {
          taskId: taskId,
          timestamp: new Date().toISOString(),
          triggeredBy: 'manual_qa_review'
        });

        console.log(`🔍 Broadcasting QA review completion and stats update for task ${taskId}`);
      }

      res.json(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ QA Review error:', errorMessage);
      res.status(500).json({
        error: 'Failed to perform QA review',
        details: errorMessage
      });
    }
  }

  async getQAReviews(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { status, category } = req.query;

      let reviews = qaReviews.filter(review => review.task_id === taskId);

      // Apply filters
      if (status) {
        reviews = reviews.filter(review => review.status === status);
      }
      if (category) {
        reviews = reviews.filter(review => review.category === category);
      }

      // Sort by creation date (newest first)
      reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('📊 QA reviews retrieved:', { taskId, count: reviews.length });

      res.json({
        reviews,
        count: reviews.length,
        filters: { status, category }
      });
    } catch (error) {
      console.error('❌ Error fetching QA reviews:', error);
      res.status(500).json({ error: 'Failed to fetch QA reviews' });
    }
  }

  async getRules(req: Request, res: Response) {
    try {
      const rules = qaService.getRules();

      res.json({
        rules,
        count: rules.length,
        categories: ['formatting', 'content', 'technical', 'links']
      });
    } catch (error) {
      console.error('❌ Error fetching QA rules:', error);
      res.status(500).json({ error: 'Failed to fetch QA rules' });
    }
  }

  async updateRules(req: Request, res: Response) {
    try {
      const { rules } = req.body;

      if (!Array.isArray(rules)) {
        return res.status(400).json({ error: 'Rules must be an array' });
      }

      // Update existing rules
      for (const ruleUpdate of rules) {
        if (ruleUpdate.id) {
          qaService.updateRule(ruleUpdate.id, ruleUpdate);
        }
      }

      console.log('⚙️ QA rules updated:', { count: rules.length });

      res.json({
        message: 'QA rules updated successfully',
        rules: qaService.getRules()
      });
    } catch (error) {
      console.error('❌ Error updating QA rules:', error);
      res.status(500).json({ error: 'Failed to update QA rules' });
    }
  }

  async getQAStats(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { timeframe = '7d' } = req.query;

      // Calculate date range
      const now = new Date();
      const days = timeframe === '30d' ? 30 : timeframe === '7d' ? 7 : 1;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Filter reviews by task and timeframe
      const taskReviews = qaReviews.filter(review =>
        (!taskId || review.task_id === taskId) &&
        new Date(review.created_at) >= startDate
      );

      // Get actual message counts from chat controller
      let actualMessages: any[] = [];
      let messageCountsInTimeframe: any[] = [];
      
      try {
        actualMessages = taskId ? chatController.getMessagesForTask(taskId) : chatController.getAllMessages();
        messageCountsInTimeframe = actualMessages.filter(msg =>
          new Date(msg.created_at) >= startDate
        );
      } catch (error) {
        console.warn('⚠️ Failed to get message counts for stats');
        actualMessages = [];
        messageCountsInTimeframe = [];
      }

      // Calculate statistics
      const stats = {
        totalReviews: taskReviews.length,
        averageScore: taskReviews.length > 0 ?
          Math.round((taskReviews.reduce((sum, r) => sum + r.score, 0) / taskReviews.length) * 10) / 10 : 0,
        approvedCount: taskReviews.filter(r => r.category === 'approved').length,
        rejectedCount: taskReviews.filter(r => r.category === 'rejected').length,
        needsRevisionCount: taskReviews.filter(r => r.category === 'needs_revision').length,
        commonIssues: this.getCommonIssues(taskReviews),
        scoreDistribution: this.getScoreDistribution(taskReviews),
        linkValidationStats: this.getLinkValidationStats(taskReviews),
        // Add actual message counts
        messageStats: {
          totalMessages: actualMessages.length,
          messagesInTimeframe: messageCountsInTimeframe.length,
          messagesWithQA: taskReviews.length,
          qaPercentage: actualMessages.length > 0 ?
            Math.round((taskReviews.length / actualMessages.length) * 100) : 0
        }
      };

      console.log('📈 QA stats generated:', { 
        taskId: taskId || 'all_tasks',
        totalReviews: stats.totalReviews,
        averageScore: stats.averageScore
      });

      res.json({
        stats,
        timeframe,
        taskId: taskId || 'all_tasks'
      });

    } catch (error) {
      console.error('❌ Error fetching QA stats:', error);
      res.status(500).json({ error: 'Failed to fetch QA statistics' });
    }
  }

  // Helper method to get task information
  private getTaskInfo(taskId: string) {
    // Mock task data - replace with actual task lookup
    const mockTasks: { [key: string]: any } = {
      '1': {
        title: 'Fix login issue for enterprise customers',
        status: 'ongoing',
        priority: 'high',
        requester_name: 'Alice Cooper'
      },
      '2': {
        title: 'Database performance optimization',
        status: 'reviewed',
        priority: 'medium',
        requester_name: 'Bob Martinez'
      },
      '3': {
        title: 'Add new payment gateway integration',
        status: 'logged',
        priority: 'medium',
        requester_name: 'Carol Davis'
      },
      '4': {
        title: 'Security vulnerability in file upload',
        status: 'blocked',
        priority: 'urgent',
        requester_name: 'Dave Thompson'
      },
      '5': {
        title: 'Mobile app notification system',
        status: 'ongoing',
        priority: 'medium',
        requester_name: 'Emma Wilson'
      }
    };

    return mockTasks[taskId] || {
      title: `Task ${taskId}`,
      status: 'logged',
      priority: 'medium',
      requester_name: 'Unknown User'
    };
  }

  // Helper method to get common issues
  private getCommonIssues(reviews: any[]): Array<{ issue: string; count: number }> {
    const issueMap = new Map<string, number>();

    for (const review of reviews) {
      if (review.issues && Array.isArray(review.issues)) {
        for (const issue of review.issues) {
          const key = issue.ruleId || 'unknown';
          issueMap.set(key, (issueMap.get(key) || 0) + 1);
        }
      }
    }

    return Array.from(issueMap.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Helper method to get score distribution
  private getScoreDistribution(reviews: any[]): Array<{ range: string; count: number }> {
    const ranges = [
      { range: '9-10', min: 9, max: 10 },
      { range: '7-8', min: 7, max: 8.9 },
      { range: '5-6', min: 5, max: 6.9 },
      { range: '1-4', min: 1, max: 4.9 }
    ];

    return ranges.map(({ range, min, max }) => ({
      range,
      count: reviews.filter(r => r.score >= min && r.score <= max).length
    }));
  }

  // Helper method to get link validation statistics
  private getLinkValidationStats(reviews: any[]): any {
    let totalLinks = 0;
    let validLinks = 0;
    let invalidLinks = 0;
    let unreachableLinks = 0;

    for (const review of reviews) {
      if (review.link_validation && Array.isArray(review.link_validation)) {
        for (const link of review.link_validation) {
          totalLinks++;
          if (link.status === 'valid') validLinks++;
          else if (link.status === 'invalid') invalidLinks++;
          else if (link.status === 'unreachable') unreachableLinks++;
        }
      }
    }

    return {
      totalLinks,
      validLinks,
      invalidLinks,
      unreachableLinks,
      validPercentage: totalLinks > 0 ? Math.round((validLinks / totalLinks) * 100) : 0
    };
  }
}

export const qaController = new QAController();