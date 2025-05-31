// server/src/services/anthropicService.ts
import Anthropic from '@anthropic-ai/sdk';

class AnthropicService {
  private client: Anthropic;

 constructor() {
  const apiKey = process.env.ANTHROPIC_API_KEY ;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
  
  this.client = new Anthropic({
    apiKey: apiKey,
  });
}

  async generateTaskSummary(messages: any[], taskInfo: any): Promise<{ summary: string; entities: any }> {
    try {
      console.log(`🤖 Generating summary for task: ${taskInfo.title}`);
      
      // Prepare conversation text
      const conversationText = messages
        .map(msg => `[${new Date(msg.created_at).toLocaleString()}] ${msg.sender_name}: ${msg.content}`)
        .join('\n');

      const prompt = `You are an AI assistant helping to summarize internal support ticket conversations. Please analyze the following conversation and provide a comprehensive summary.

TASK INFORMATION:
- Title: ${taskInfo.title}
- Status: ${taskInfo.status}
- Priority: ${taskInfo.priority}
- Assigned to: ${taskInfo.assigned_to || 'Unassigned'}
- Requested by: ${taskInfo.requester_name}

CONVERSATION:
${conversationText}

Please provide your response in the following JSON format:
{
  "summary": "A 2-3 sentence summary that includes the problem, current status, and next steps. Mention any important contact information, links, or deadlines shared in the conversation.",
  "entities": {
    "phoneNumbers": ["any phone numbers mentioned"],
    "emails": ["any email addresses mentioned"], 
    "urls": ["any URLs or links shared"],
    "keyPeople": ["important people mentioned"],
    "technologies": ["technical terms, tools, or systems mentioned"],
    "deadlines": ["any deadlines or time-sensitive information"],
    "actionItems": ["specific next steps or action items mentioned"]
  }
}

Focus on:
1. The core issue or request
2. Progress made and current status
3. Important contact information (phone numbers, emails)
4. Relevant links or documentation shared
5. Next steps or pending actions
6. Any blockers or dependencies

Make the summary concise but informative, helping someone quickly understand what this task is about and its current state.`;

      // ✅ Fixed: Use the correct API method
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Updated to latest model
        max_tokens: 800,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // ✅ Fixed: Properly handle the response content
      let responseText = '';
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text') {
          responseText = firstContent.text;
        }
      }
      
      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(responseText);
        
        console.log(`✅ Summary generated successfully: ${parsedResponse.summary?.substring(0, 100)}...`);
        
        return {
          summary: parsedResponse.summary || 'Unable to generate summary',
          entities: parsedResponse.entities || {}
        };
      } catch (parseError) {
        console.warn('⚠️ Failed to parse JSON response, extracting summary manually');
        
        // Fallback: try to extract summary from text
        const summaryMatch = responseText.match(/"summary":\s*"([^"]+)"/);
        const fallbackSummary = summaryMatch ? summaryMatch[1] : responseText.substring(0, 200) + '...';
        
        return {
          summary: fallbackSummary,
          entities: {
            phoneNumbers: [],
            emails: [],
            urls: [],
            keyPeople: [],
            technologies: [],
            deadlines: [],
            actionItems: []
          }
        };
      }
    } catch (error) {
      console.error('❌ Anthropic API error:', error);
      
      // Fallback summary generation
      const fallbackSummary = this.generateFallbackSummary(messages, taskInfo);
      
      return {
        summary: fallbackSummary,
        entities: {
          phoneNumbers: [],
          emails: [],
          urls: [],
          keyPeople: messages.map(m => m.sender_name).filter((name, index, arr) => arr.indexOf(name) === index),
          technologies: [],
          deadlines: [],
          actionItems: []
        }
      };
    }
  }

  private generateFallbackSummary(messages: any[], taskInfo: any): string {
    const participantCount = new Set(messages.map(m => m.sender_name)).size;
    const latestMessage = messages[messages.length - 1];
    const duration = this.calculateDuration(messages[0]?.created_at, latestMessage?.created_at);
    
    return `Task "${taskInfo.title}" (${taskInfo.priority} priority) has ${messages.length} messages from ${participantCount} participants over ${duration}. Current status: ${taskInfo.status}. ${taskInfo.assigned_to ? `Assigned to ${taskInfo.assigned_to}.` : 'Currently unassigned.'} Latest update: ${latestMessage?.content?.substring(0, 100)}...`;
  }

  private calculateDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'unknown duration';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffHours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'less than an hour';
    if (diffHours < 24) return `${Math.round(diffHours)} hours`;
    const days = Math.round(diffHours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  // Legacy method for backward compatibility
  async generateSummary(messages: any[]): Promise<string> {
    try {
      const conversationText = messages
        .map(msg => `${msg.sender_name}: ${msg.content}`)
        .join('\n');

      const prompt = `Please provide a concise 2-3 sentence summary of this task conversation, including any important contact numbers, links, or key decisions made. Also mention the current status of the task.

Conversation:
${conversationText}

Summary:`;

      // ✅ Fixed: Use the correct API method
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // ✅ Fixed: Properly handle the response content
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text') {
          return firstContent.text;
        }
      }
      
      return 'Unable to generate summary';
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async performQAReview(content: string, context: string): Promise<any> {
    try {
      const prompt = `Please review this message for quality assurance. Check for:
1. Professional tone and clarity
2. Completeness of information
3. Accuracy of any links or contact information
4. Proper formatting

Message to review: ${content}
Context: ${context}

Provide feedback in JSON format with: { "score": 1-10, "feedback": "detailed feedback", "suggestions": ["suggestion1", "suggestion2"] }`;

      // ✅ Fixed: Use the correct API method
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // ✅ Fixed: Properly handle the response content
      let responseText = '';
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text') {
          responseText = firstContent.text;
        }
      }
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error('QA Review error:', error);
      throw new Error('Failed to perform QA review');
    }
  }
}

export const anthropicService = new AnthropicService();