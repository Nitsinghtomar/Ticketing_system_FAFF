// client/src/components/SimpleQAPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import ResizablePanel from './ResizablePanel';

interface SimpleQAPanelProps {
  taskId: string;
  showQA: boolean;
}

const SimpleQAPanel: React.FC<SimpleQAPanelProps> = ({ taskId, showQA }) => {
  const [selectedTab, setSelectedTab] = useState<'reviews' | 'stats'>('reviews');
  const [testMessage, setTestMessage] = useState('');
  const [isTestingQA, setIsTestingQA] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const forceStatsRefresh = useCallback(() => {
    setLastRefreshTime(Date.now());
    queryClient.invalidateQueries(['qa-stats', taskId]);
    queryClient.refetchQueries(['qa-stats', taskId]);
  }, [queryClient, taskId]);

  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery(
    ['qa-reviews', taskId],
    () => fetchQAReviews(taskId),
    {
      enabled: showQA,
      refetchInterval: 3000,
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  );

  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['qa-stats', taskId, lastRefreshTime],
    () => fetchQAStats(taskId),
    {
      enabled: showQA && selectedTab === 'stats',
      refetchInterval: 2000,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 0,
    }
  );

  const testQAMutation = useMutation(
    (messageContent: string) => testQAReview(messageContent, taskId),
    {
      onSuccess: (result) => {
        toast.success(
          <div>
            <div className="font-medium">QA Test Complete</div>
            <div className="text-sm">Score: {result.score}/10 • {result.category}</div>
          </div>
        );
        setTestMessage('');
        setTimeout(() => {
          refetchReviews();
          forceStatsRefresh();
        }, 1000);
      },
      onError: (error: any) => {
        toast.error(`QA test failed: ${error.message}`);
      },
      onSettled: () => {
        setIsTestingQA(false);
      }
    }
  );

  useEffect(() => {
    if (!socket || !showQA) return;

    const handleQAReviewCompleted = (data: any) => {
      console.log('QA review completed:', data);
      refetchReviews();
      forceStatsRefresh();

      if (data.score !== undefined) {
        toast.success(
          <div>
            <div className="font-medium">New QA Review</div>
            <div className="text-sm">Score: {data.score}/10 • {data.category}</div>
          </div>,
          { duration: 3000 }
        );
      }
    };

    const handleQAStatsUpdated = () => {
      console.log('QA stats updated via socket');
      forceStatsRefresh();
    };

    socket.on('qa_review_completed', handleQAReviewCompleted);
    socket.on('qa_stats_updated', handleQAStatsUpdated);

    return () => {
      socket.off('qa_review_completed', handleQAReviewCompleted);
      socket.off('qa_stats_updated', handleQAStatsUpdated);
    };
  }, [socket, showQA, refetchReviews, forceStatsRefresh]);

  const handleTestQA = async () => {
    if (!testMessage.trim()) {
      toast.error('Please enter a message to test');
      return;
    }

    setIsTestingQA(true);
    testQAMutation.mutate(testMessage);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_revision': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!showQA) return null;

  return (
    <ResizablePanel
      defaultWidth={400}
      minWidth={320}
      maxWidth={800}
      position="right"
      className="bg-gray-50"
    >
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900 flex items-center space-x-2 mb-3">
          <span>🔍</span>
          <span>Quality Assurance</span>
        </h3>

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-3">
          {[
            { id: 'reviews', label: 'Reviews', icon: '📋' },
            { id: 'stats', label: 'Stats', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded transition-colors ${selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {selectedTab === 'reviews' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
              <span>🧪</span>
              <span>Test QA Review</span>
            </h4>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test a message for QA review..."
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
              rows={3}
            />
            <button
              onClick={handleTestQA}
              disabled={isTestingQA || !testMessage.trim()}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              {isTestingQA ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Test QA</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'reviews' ? (
          <>
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : reviewsData?.reviews?.length > 0 ? (
              <div className="space-y-3">
                {reviewsData.reviews.map((review: any) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        Score: {review.score}/10
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(review.category)}`}>
                        {review.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 break-words leading-relaxed">{review.feedback}</p>
                    {review.issues?.length > 0 && (
                      <div className="mb-2">
                        <h5 className="text-xs font-medium text-gray-900 mb-1">Issues:</h5>
                        <div className="space-y-1">
                          {review.issues.map((issue: any, index: number) => (
                            <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                              <div className="font-medium text-red-800 break-words">{issue.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {review.suggestions?.length > 0 && (
                      <div className="mb-2">
                        <h5 className="text-xs font-medium text-gray-900 mb-1">Suggestions:</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {review.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="flex-shrink-0">•</span>
                              <span className="break-words leading-relaxed">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {formatTimestamp(review.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🔍</div>
                <p className="font-medium">No QA reviews yet</p>
                <p className="text-sm">Use @QAreview in a message to trigger analysis</p>
              </div>
            )}
          </>
        ) : (
          <>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : statsData?.stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-700">{statsData.stats.totalReviews}</div>
                    <div className="text-sm text-blue-600">QA Reviews</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-700">
                      {statsData.stats.averageScore ? statsData.stats.averageScore.toFixed(1) : '0.0'}
                    </div>
                    <div className="text-sm text-green-600">Avg Score</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <p>No statistics available yet</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
        <div className="text-xs text-gray-500">
          💡 Use <code className="bg-gray-200 px-1 rounded text-xs">@QAreview</code> to trigger quality checks
        </div>
      </div>
    </ResizablePanel>
  );
};

// API functions
async function fetchQAReviews(taskId: string) {
  const response = await fetch(`/api/qa/reviews/${taskId}`);
  if (!response.ok) throw new Error('Failed to fetch QA reviews');
  return response.json();
}

async function fetchQAStats(taskId: string) {
  const response = await fetch(`/api/qa/stats/${taskId}?_t=${Date.now()}`);
  if (!response.ok) throw new Error('Failed to fetch QA stats');
  return response.json();
}

async function testQAReview(messageContent: string, taskId: string) {
  const response = await fetch('/api/qa/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageContent, taskId })
  });
  if (!response.ok) throw new Error('Failed to test QA review');
  return response.json();
}

export default SimpleQAPanel;