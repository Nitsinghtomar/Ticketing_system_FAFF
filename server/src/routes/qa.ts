// server/src/routes/qa.ts
import express from 'express';
import { qaController } from '../controllers/qaController';

const router = express.Router();

// QA Review endpoints
router.post('/review', qaController.triggerQAReview.bind(qaController));
router.get('/reviews/:taskId', qaController.getQAReviews.bind(qaController));

// QA Rules management
router.get('/rules', qaController.getRules.bind(qaController));
router.put('/rules', qaController.updateRules.bind(qaController));

// QA Statistics and analytics
router.get('/stats/:taskId?', qaController.getQAStats.bind(qaController));

// Test endpoint for QA functionality
router.post('/test', async (req, res) => {
  try {
    const { messageContent, taskId = 'test' } = req.body;
    
    if (!messageContent) {
      return res.status(400).json({ error: 'messageContent is required for testing' });
    }

    const result = await qaController.triggerQAReview({
      body: {
        messageId: `test-${Date.now()}`,
        taskId,
        messageContent
      }
    } as any, res);

  } catch (error) {
    // ✅ Fix: Handle unknown error type with type guard
    let errorMessage: string;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String((error as any).message);
    } else {
      errorMessage = 'Unknown error occurred during QA test';
    }
    
    res.status(500).json({ 
      error: 'QA test failed', 
      details: errorMessage 
    });
  }
});

export default router;