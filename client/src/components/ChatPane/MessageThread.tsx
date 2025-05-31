// 1. FIRST - Update the MessageThread component to prevent any scroll interference
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Message } from '../../types/Message';
import toast from 'react-hot-toast';

interface MessageThreadProps {
  messages: Message[];
}

const MessageThread: React.FC<MessageThreadProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const lastScrollTime = useRef(0);

  // Check if user is near the bottom of the scroll container
  const isNearBottom = () => {
    if (!containerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    lastScrollTime.current = Date.now();
    const wasNearBottom = isNearBottom();
    setShouldAutoScroll(wasNearBottom);
    
    // Set user scrolling flag
    setIsUserScrolling(true);
    
    // Clear the flag after user stops scrolling
    setTimeout(() => {
      // Only clear if no scroll happened in the last 150ms
      if (Date.now() - lastScrollTime.current >= 150) {
        setIsUserScrolling(false);
      }
    }, 150);
  };

  // Auto-scroll ONLY when new messages are added
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessagesLength.current;
    
    // Update the ref after checking
    prevMessagesLength.current = messages.length;

    // Only auto-scroll if there are actually NEW messages AND user wants it
    if (hasNewMessages && shouldAutoScroll && !isUserScrolling) {
      // Use a longer delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current && containerRef.current) {
          // Double-check user hasn't started scrolling
          if (!isUserScrolling && Date.now() - lastScrollTime.current > 200) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          }
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, shouldAutoScroll, isUserScrolling]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Initial scroll to bottom ONLY on first mount
  useEffect(() => {
    if (messages.length > 0 && prevMessagesLength.current === 0) {
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'auto',
            block: 'end'
          });
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Rest of your component code stays the same...
  const formatDistanceToNow = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ 
        scrollBehavior: 'auto', // Prevent smooth scroll conflicts
        overflowAnchor: 'none'   // Prevent browser scroll anchoring
      }}
    >
      {messages.map((message) => (
        <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          {/* Your existing message rendering code */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {message.sender_name.charAt(0)}
              </div>
              <div>
                <span className="font-medium text-gray-900">{message.sender_name}</span>
                {message.sender_email && (
                  <span className="text-sm text-gray-500 ml-2">({message.sender_email})</span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(message.created_at)}
            </span>
          </div>
          
          {message.content && (
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-2">
              {message.content}
            </div>
          )}
          
          {message.content.includes('@QAreview') && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-green-800 font-medium">QA Review Triggered</span>
              </div>
              <p className="text-green-700 mt-1">This message has been flagged for quality assurance review.</p>
            </div>
          )}
        </div>
      ))}
      
      {/* Scroll to bottom button */}
      {!shouldAutoScroll && (
        <button
          onClick={() => {
            setShouldAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          }}
          className="fixed bottom-24 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
          title="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

// 2. SECOND - Create a scroll-locked Summary Panel component

const ScrollLockedSummaryPanel: React.FC<{ 
  task: any; 
  messages: any[];
  showSummary: boolean;
  onClose?: () => void;
  apiService?: any;
}> = ({ task, messages, showSummary, onClose, apiService }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // CRITICAL: Multiple refs for different scroll containers
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [savedScrollTop, setSavedScrollTop] = useState(0);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Lock scroll position
  const lockScrollPosition = useCallback(() => {
    if (mainScrollRef.current) {
      const currentScrollTop = mainScrollRef.current.scrollTop;
      setSavedScrollTop(currentScrollTop);
      setIsScrollLocked(true);
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Unlock after a delay
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrollLocked(false);
      }, 1000);
    }
  }, []);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (isScrollLocked && mainScrollRef.current && savedScrollTop > 0) {
      // Use multiple methods to ensure scroll restoration
      const scrollElement = mainScrollRef.current;
      
      // Method 1: Direct assignment
      scrollElement.scrollTop = savedScrollTop;
      
      // Method 2: requestAnimationFrame for next frame
      requestAnimationFrame(() => {
        scrollElement.scrollTop = savedScrollTop;
        
        // Method 3: Another frame for safety
        requestAnimationFrame(() => {
          scrollElement.scrollTop = savedScrollTop;
        });
      });
    }
  }, [isScrollLocked, savedScrollTop]);

  // Track scroll changes and save position
  useEffect(() => {
    const scrollElement = mainScrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      if (!isScrollLocked) {
        setSavedScrollTop(scrollElement.scrollTop);
      }
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isScrollLocked]);

  // Restore scroll position whenever content changes
  useEffect(() => {
    restoreScrollPosition();
  }, [summaryData, isGenerating, error, restoreScrollPosition]);

  // Memoize the summary service to prevent recreations
  const summaryService = useMemo(() => {
    class SummaryService {
      async generateTaskSummary(messages: any[], task: any): Promise<any> {
        console.log('🤖 Generating summary for task:', task.title);
        
        if (!messages || messages.length === 0) {
          throw new Error('No messages to summarize');
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const conversationText = messages
          .map(msg => `${msg.sender_name}: ${msg.content}`)
          .join('\n');

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

        let summary = `Task "${context.taskTitle}" has ${context.messageCount} messages from ${context.participants.length} participants. Current status: ${context.taskStatus}. ${context.assignedTo ? `Assigned to ${context.assignedTo}.` : 'Currently unassigned.'}`;

        return {
          id: `summary_${task.id}_${Date.now()}`,
          task_id: task.id,
          summary,
          entities: {
            phoneNumbers: [],
            emails: [],
            urls: [],
            participants: context.participants
          },
          context: {
            messageCount: messages.length,
            participants: context.participants,
            lastUpdated: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }
    return new SummaryService();
  }, []);

  const generateSummary = async () => {
    if (!messages || messages.length === 0) {
      toast.error('No messages to summarize');
      return;
    }

    // CRITICAL: Lock scroll position before any state changes
    lockScrollPosition();

    setIsGenerating(true);
    setError(null);

    try {
      const result = await summaryService.generateTaskSummary(messages, task);
      setSummaryData(result);
      
      if (apiService?.saveSummary) {
        try {
          await apiService.saveSummary(task.id, result);
        } catch (saveError) {
          console.warn('Failed to save summary to backend:', saveError);
        }
      }

      toast.success('Summary generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
      // Ensure scroll position is restored after state updates
      setTimeout(restoreScrollPosition, 100);
    }
  };

  // Load existing summary
  useEffect(() => {
    if (showSummary && task.id && apiService?.getSummary) {
      const loadExistingSummary = async () => {
        try {
          const existing = await apiService.getSummary?.(task.id);
          if (existing) {
            setSummaryData(existing);
          }
        } catch (err) {
          console.log('No existing summary found');
        }
      };
      loadExistingSummary();
    }
  }, [showSummary, task.id, apiService]);

  if (!showSummary) return null;

  return (
    <div className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col">
      {/* Fixed Header */}
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
      </div>
      
      {/* Scrollable Content with Position Locking */}
      <div 
        ref={mainScrollRef}
        className="flex-1 overflow-y-auto"
        style={{ 
          scrollBehavior: 'auto',
          overflowAnchor: 'none',
          // Force GPU acceleration for smoother scrolling
          transform: 'translateZ(0)',
          willChange: isScrollLocked ? 'auto' : 'scroll-position'
        }}
      >
        <div ref={contentScrollRef} className="p-4">
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
                <p className="text-sm">Click "Generate Summary" to create an AI-powered summary of this conversation</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// 3. THIRD - Update your main App component to use React.memo and prevent unnecessary re-renders
const MemoizedSummaryPanel = React.memo(ScrollLockedSummaryPanel, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.showSummary === nextProps.showSummary &&
    prevProps.task.id === nextProps.task.id &&
    prevProps.messages.length === nextProps.messages.length &&
    JSON.stringify(prevProps.task) === JSON.stringify(nextProps.task)
  );
});

export { MessageThread, ScrollLockedSummaryPanel, MemoizedSummaryPanel };