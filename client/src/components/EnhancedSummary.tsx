import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// Define proper TypeScript interfaces
interface ExtractedEntities {
  phoneNumbers: string[];
  emails: string[];
  urls: string[];
  dates: string[];
  names: string[];
  companies: string[];
}

class SummaryService {
  private static instance: SummaryService;
  
  static getInstance(): SummaryService {
    if (!SummaryService.instance) {
      SummaryService.instance = new SummaryService();
    }
    return SummaryService.instance;
  }

  extractEntities(text: string): ExtractedEntities {
    // ✅ Use type assertion to fix the never[] issue
    const entities = {
      phoneNumbers: [] as string[],
      emails: [] as string[],
      urls: [] as string[],
      dates: [] as string[],
      names: [] as string[],
      companies: [] as string[]
    };

    // Phone number patterns - Using Array.from instead of spread
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    entities.phoneNumbers = Array.from(text.matchAll(phoneRegex)).map(match => match[0].trim());

    // Email patterns - Using Array.from instead of spread
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    entities.emails = Array.from(text.matchAll(emailRegex)).map(match => match[0]);

    // URL patterns - Using Array.from instead of spread
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    entities.urls = Array.from(text.matchAll(urlRegex)).map(match => match[0]);

    // Date patterns - Using Array.from instead of spread
    const dateRegex = /\b(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}-\d{1,2}-\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi;
    entities.dates = Array.from(text.matchAll(dateRegex)).map(match => match[0]);

    // Company patterns - Using Array.from instead of spread
    const companyRegex = /\b([A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Co|Group|Systems|Solutions|Technologies|Tech)\.?)\b/g;
    entities.companies = Array.from(text.matchAll(companyRegex)).map(match => match[0]);

    // Remove duplicates - Handle each property individually
    entities.phoneNumbers = Array.from(new Set(entities.phoneNumbers)).filter(item => item && item.length > 0);
    entities.emails = Array.from(new Set(entities.emails)).filter(item => item && item.length > 0);
    entities.urls = Array.from(new Set(entities.urls)).filter(item => item && item.length > 0);
    entities.dates = Array.from(new Set(entities.dates)).filter(item => item && item.length > 0);
    entities.names = Array.from(new Set(entities.names)).filter(item => item && item.length > 0);
    entities.companies = Array.from(new Set(entities.companies)).filter(item => item && item.length > 0);

    return entities;
  }

  async generateTaskSummary(messages: any[], task: any): Promise<any> {
    console.log('🤖 Generating summary for task:', task.title);
    console.log('📝 Messages count:', messages.length);
    
    if (!messages || messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    // Combine all message content
    const conversationText = messages
      .map(msg => `${msg.sender_name}: ${msg.content}`)
      .join('\n');

    console.log('💬 Conversation text:', conversationText.substring(0, 200) + '...');

    // Extract entities
    const entities = this.extractEntities(conversationText);
    console.log('🔍 Extracted entities:', entities);

    // Create context - Using Array.from instead of spread
    const context = {
      taskTitle: task.title,
      taskStatus: task.status,
      taskPriority: task.priority,
      assignedTo: task.assigned_to,
      requesterName: task.requester_name,
      messageCount: messages.length,
      participants: Array.from(new Set(messages.map(msg => msg.sender_name))),
      conversation: conversationText
    };

    console.log('📊 Context:', context);

    // Generate AI summary
    const summary = await this.callAIService(context, entities);
    console.log('✨ Generated summary:', summary.text);

    return {
      id: `summary_${task.id}_${Date.now()}`,
      task_id: task.id,
      summary: summary.text,
      entities,
      context: {
        messageCount: messages.length,
        participants: context.participants,
        lastUpdated: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private async callAIService(context: any, entities: ExtractedEntities): Promise<{ text: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    let summary = '';
    const content = context.conversation.toLowerCase();
    
    console.log('🔍 Analyzing conversation content...');

    if (context.conversation.length < 20) {
      summary = `Initial task "${context.taskTitle}" was logged by ${context.requesterName}. Currently ${context.taskStatus} status with ${context.messageCount} message(s).`;
    } else {
      // Analyze conversation patterns
      if (content.includes('issue') || content.includes('problem') || content.includes('error') || content.includes('login') || content.includes('bug')) {
        summary = `Issue reported in "${context.taskTitle}" by ${context.requesterName}. `;
        if (content.includes('resolved') || content.includes('fixed') || content.includes('solved') || context.taskStatus === 'done') {
          summary += `Problem has been resolved and is currently in ${context.taskStatus} status. `;
        } else if (content.includes('investigating') || content.includes('looking into') || content.includes('working on')) {
          summary += `Team is actively investigating the issue. `;
        } else {
          summary += `Issue is being addressed by the team. `;
        }
      } else if (content.includes('feature') || content.includes('enhancement') || content.includes('improvement') || content.includes('add') || content.includes('new')) {
        summary = `Feature request "${context.taskTitle}" submitted by ${context.requesterName}. Currently in ${context.taskStatus} status with active discussion among ${context.participants.length} team member(s). `;
      } else if (content.includes('how') || content.includes('hello') || content.includes('hi') || content.includes('doing')) {
        summary = `Communication thread for "${context.taskTitle}" initiated by ${context.requesterName}. Team members ${context.participants.join(', ')} are coordinating on this ${context.taskStatus} task. `;
      } else {
        summary = `Task "${context.taskTitle}" has ongoing discussion between ${context.participants.join(', ')}. Current status: ${context.taskStatus}. `;
      }

      // Add entity information
      if (entities.phoneNumbers.length > 0) {
        summary += `Contact number provided: ${entities.phoneNumbers[0]}. `;
      }
      if (entities.emails.length > 0) {
        summary += `Email contact: ${entities.emails[0]}. `;
      }
      if (entities.urls.length > 0) {
        summary += `Reference link shared: ${entities.urls[0]}. `;
      }

      // Add assignment info
      if (context.assignedTo) {
        summary += `Currently assigned to ${context.assignedTo}.`;
      } else {
        summary += `Task is currently unassigned.`;
      }
    }

    return { text: summary.trim() };
  }
}

const EnhancedSummaryPanel: React.FC<{ 
  task: any; 
  messages: any[];
  showSummary: boolean;
  onClose?: () => void;
  apiService?: any;
}> = ({ task, messages, showSummary, onClose, apiService }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Scroll position preservation
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const summaryService = SummaryService.getInstance();

  // Save scroll position before re-renders
  const saveScrollPosition = useCallback(() => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollTop);
    }
  }, []);

  // Restore scroll position after re-renders
  const restoreScrollPosition = useCallback(() => {
    if (scrollRef.current && scrollPosition > 0) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollPosition;
        }
      });
    }
  }, [scrollPosition]);

  // Set up scroll position preservation
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      saveScrollPosition();
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [saveScrollPosition]);

  // Restore scroll position after content changes
  useEffect(() => {
    restoreScrollPosition();
  }, [summaryData, restoreScrollPosition]);

  const generateSummary = async () => {
    console.log('🎯 Generate Summary clicked');
    console.log('📝 Messages available:', messages?.length);
    console.log('🎫 Task:', task?.title);

    if (!messages || messages.length === 0) {
      toast.error('No messages to summarize');
      return;
    }

    // Save current scroll position before generating
    saveScrollPosition();

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🚀 Starting summary generation...');
      const result = await summaryService.generateTaskSummary(messages, task);
      console.log('✅ Summary generated:', result);
      
      setSummaryData(result);
      
      // Save to backend if available
      if (apiService?.saveSummary) {
        try {
          await apiService.saveSummary(task.id, result);
          console.log('💾 Summary saved to backend');
        } catch (saveError) {
          console.warn('⚠️ Failed to save summary to backend:', saveError);
        }
      }

      toast.success('Summary generated successfully!');
    } catch (err) {
      console.error('❌ Summary generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
      // Restore scroll position after generation
      setTimeout(restoreScrollPosition, 100);
    }
  };

  // Load existing summary when component mounts
  useEffect(() => {
    if (showSummary && task.id && apiService?.getSummary) {
      const loadExistingSummary = async () => {
        try {
          const existing = await apiService.getSummary?.(task.id);
          if (existing) {
            console.log('📄 Loaded existing summary:', existing);
            setSummaryData(existing);
          }
        } catch (err) {
          console.log('ℹ️ No existing summary found');
        }
      };
      loadExistingSummary();
    }
  }, [showSummary, task.id, apiService]);

  // Memoized format entity list to prevent unnecessary re-renders
  const formatEntityList = useCallback((entities: string[], type: string) => {
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
      <div className="mb-4" key={type}>
        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
          <span>{getIcon(type)}</span>
          <span>{getLabel(type)}</span>
        </h5>
        <div className="space-y-1">
          {entities.map((entity: string, index: number) => (
            <div key={`${type}-${index}`} className="text-sm bg-white border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors">
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
  }, []);

  if (!showSummary) return null;

  return (
    <div className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col">
      {/* Header - Fixed position */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <span>🤖</span>
            <span>AI Summary</span>
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        <button
          onClick={generateSummary}
          disabled={isGenerating || !messages?.length}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Generate Summary</span>
            </>
          )}
        </button>

        {!messages?.length && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            No messages to summarize
          </p>
        )}
      </div>
      
      {/* Scrollable Content - This is where we preserve scroll position */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto"
        style={{ 
          scrollBehavior: 'auto', // Disable smooth scrolling to prevent conflicts
          overflowAnchor: 'none'   // Prevent browser's scroll anchoring
        }}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-red-800 text-sm font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {summaryData ? (
          <div className="space-y-4">
            {/* Main Summary */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <span>📋</span>
                <span>Summary</span>
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {summaryData.summary}
              </p>
            </div>
            
            {/* Context Information */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <span>📊</span>
                <span>Context</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Messages:</span>
                  <span className="ml-2 font-medium">{summaryData.context?.messageCount || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Participants:</span>
                  <span className="ml-2 font-medium">{summaryData.context?.participants?.length || 0}</span>
                </div>
              </div>
              {summaryData.context?.participants && (
                <div className="mt-2">
                  <span className="text-gray-500 text-sm">Team: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {summaryData.context.participants.map((participant: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Entities */}
            {summaryData.entities && Object.values(summaryData.entities).some((arr: any) => arr?.length > 0) && (
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <span>🔍</span>
                  <span>Extracted Information</span>
                </h4>
                
                {Object.entries(summaryData.entities).map(([key, value]) => {
                  if (Array.isArray(value) && value.length > 0) {
                    return formatEntityList(value, key);
                  }
                  return null;
                })}
              </div>
            )}
            
            {/* Timestamp */}
            <div className="text-xs text-gray-500 bg-white p-2 rounded border text-center">
              Last updated: {new Date(summaryData.updated_at).toLocaleString()}
            </div>
          </div>
        ) : !isGenerating ? (
          <div className="text-center text-gray-500 py-8">
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-4xl mb-2">🤖</div>
              <p className="mb-2 font-medium">No summary available</p>
              <p className="text-sm">Click "Generate Summary" to create an AI-powered summary of this conversation with entity extraction</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { EnhancedSummaryPanel, SummaryService };