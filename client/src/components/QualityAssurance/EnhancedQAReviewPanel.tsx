// client/src/components/QualityAssurance/EnhancedQAReviewPanel.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import ResizablePanel from '../ResizablePanel';

interface QAIssue {
  ruleId: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

interface LinkValidationResult {
  url: string;
  status: 'valid' | 'invalid' | 'unreachable';
  statusCode?: number;
  error?: string;
  redirectedTo?: string;
}

interface QAReview {
  id: string;
  message_id: string;
  task_id: string;
  score: number;
  feedback: string;
  suggestions: string[];
  issues: QAIssue[];
  linkValidation?: LinkValidationResult[];
  category: 'approved' | 'needs_revision' | 'rejected';
  status: string;
  created_at: string;
}

interface QARule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  weight: number;
  category: 'formatting' | 'content' | 'technical' | 'links';
}

interface EnhancedQAReviewPanelProps {
  taskId: string;
  onClose?: () => void;
}

const EnhancedQAReviewPanel: React.FC<EnhancedQAReviewPanelProps> = ({ taskId, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'reviews' | 'rules' | 'stats'>('reviews');
  const [testMessage, setTestMessage] = useState('');
  const [isTestingQA, setIsTestingQA] = useState(false);
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Fetch QA reviews for the task
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery(
    ['qa-reviews', taskId],
    () => fetchQAReviews(taskId),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch QA rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery(
    ['qa-rules'],
    fetchQARules
  );
  // Fetch QA statistics
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery(
    ['qa-stats', taskId],
    () => fetchQAStats(taskId)
  );

  // Listen for real-time QA socket events
  useEffect(() => {
    if (!socket) return;

    const handleQAReviewCompleted = (data: any) => {
      console.log('QA review completed:', data);

      // Force immediate refresh of both reviews and stats
      refetchReviews();
      refetchStats();

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries(['qa-reviews', taskId]);
      queryClient.invalidateQueries(['qa-stats', taskId]);

      // Show a toast notification
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

      // Force immediate stats refresh
      refetchStats();
      queryClient.invalidateQueries(['qa-stats', taskId]);
    };

    // Listen for QA events
    socket.on('qa_review_completed', handleQAReviewCompleted);
    socket.on('qa_stats_updated', handleQAStatsUpdated);

    // Cleanup listeners on unmount
    return () => {
      socket.off('qa_review_completed', handleQAReviewCompleted);
      socket.off('qa_stats_updated', handleQAStatsUpdated);
    };
  }, [socket, refetchReviews, refetchStats, queryClient, taskId]);
  // Test QA functionality
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

        // Force immediate refresh of both reviews and stats
        refetchReviews();
        refetchStats();

        // Also invalidate queries to ensure fresh data
        queryClient.invalidateQueries(['qa-reviews', taskId]);
        queryClient.invalidateQueries(['qa-stats', taskId]);
      },
      onError: (error: any) => {
        toast.error(`QA test failed: ${error.message}`);
      }
    }
  );

  const handleTestQA = () => {
    if (!testMessage.trim()) {
      toast.error('Please enter a message to test');
      return;
    }

    setIsTestingQA(true);
    testQAMutation.mutate(testMessage);
    setTimeout(() => setIsTestingQA(false), 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'approved': return 'text-green-700 bg-green-100 border-green-200';
      case 'rejected': return 'text-red-700 bg-red-100 border-red-200';
      case 'needs_revision': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  return (
    <ResizablePanel
      defaultWidth={420}
      minWidth={350}
      maxWidth={800}
      position="right"
      className="bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <span>🔍</span>
            <span>Quality Assurance</span>
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 border">
          {[
            { id: 'reviews', label: 'Reviews', icon: '📋' },
            { id: 'rules', label: 'Rules', icon: '⚙️' },
            { id: 'stats', label: 'Stats', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded transition-colors ${selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedTab === 'reviews' && (
          <div className="p-4 space-y-4">
            {/* Test QA Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-1">
                <span>🧪</span>
                <span>Test QA Review</span>
              </h4>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a message to test QA review..."
                className="w-full p-2 border border-blue-300 rounded text-sm resize-none"
                rows={3}
              />
              <button
                onClick={handleTestQA}
                disabled={isTestingQA || !testMessage.trim()}
                className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
              >
                {isTestingQA ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Test QA Review</span>
                  </>
                )}
              </button>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : reviewsData?.reviews?.length > 0 ? (
              <div className="space-y-3">
                {reviewsData.reviews.map((review: QAReview) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    {/* Review Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">Score: {review.score}/10</span>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(review.category)}`}>
                          {review.category.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(review.created_at)}
                      </span>
                    </div>

                    {/* Feedback */}
                    <p className="text-sm text-gray-700 mb-2">{review.feedback}</p>

                    {/* Issues */}
                    {review.issues && review.issues.length > 0 && (
                      <div className="mb-2">
                        <h5 className="text-xs font-medium text-gray-900 mb-1">Issues:</h5>
                        <div className="space-y-1">
                          {review.issues.map((issue, index) => (
                            <div
                              key={index}
                              className={`text-xs p-2 rounded border ${getSeverityColor(issue.severity)}`}
                            >
                              <div className="font-medium">{issue.message}</div>
                              <div className="mt-1 opacity-90">{issue.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Link Validation */}
                    {review.linkValidation && review.linkValidation.length > 0 && (
                      <div className="mb-2">
                        <h5 className="text-xs font-medium text-gray-900 mb-1">Link Validation:</h5>
                        <div className="space-y-1">
                          {review.linkValidation.map((link, index) => (
                            <div key={index} className="text-xs p-2 bg-gray-50 rounded border">
                              <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${link.status === 'valid' ? 'bg-green-500' :
                                  link.status === 'invalid' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}></span>
                                <span className="truncate">{link.url}</span>
                              </div>
                              {link.error && (
                                <div className="text-red-600 mt-1">{link.error}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {review.suggestions && review.suggestions.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 mb-1">Suggestions:</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {review.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🔍</div>
                <p className="font-medium">No QA reviews yet</p>
                <p className="text-sm">Use @QAreview in a message to trigger quality assurance</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'rules' && (
          <div className="p-4 space-y-4">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : rulesData?.rules ? (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>QA Rules Configuration</span>
                </h4>
                {rulesData.rules.map((rule: QARule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{rule.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${rule.category === 'formatting' ? 'bg-blue-100 text-blue-700' :
                          rule.category === 'content' ? 'bg-green-100 text-green-700' :
                            rule.category === 'technical' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                          }`}>
                          {rule.category}
                        </span>
                        <span className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Weight: {Math.round(rule.weight * 100)}%</span>
                      <span>{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">⚙️</div>
                <p>No QA rules configured</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'stats' && (
          <div className="p-4 space-y-4">
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : statsData?.stats ? (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <span>📊</span>
                  <span>QA Statistics</span>
                </h4>                {/* Overview Stats */}
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

                {/* Message Statistics */}
                {statsData.stats.messageStats && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Message Statistics</h5>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Messages</span>
                        <span className="font-medium text-gray-900">{statsData.stats.messageStats.totalMessages}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Messages with QA</span>
                        <span className="font-medium text-gray-900">{statsData.stats.messageStats.messagesWithQA}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">QA Coverage</span>
                        <span className="font-medium text-purple-600">{statsData.stats.messageStats.qaPercentage}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Breakdown */}
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Review Categories</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-green-700">Approved</span>
                      <span className="font-medium text-green-700">{statsData.stats.approvedCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                      <span className="text-sm text-yellow-700">Needs Revision</span>
                      <span className="font-medium text-yellow-700">{statsData.stats.needsRevisionCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm text-red-700">Rejected</span>
                      <span className="font-medium text-red-700">{statsData.stats.rejectedCount}</span>
                    </div>
                  </div>
                </div>

                {/* Score Distribution */}
                {statsData.stats.scoreDistribution && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Score Distribution</h5>
                    <div className="space-y-1">
                      {statsData.stats.scoreDistribution.map((range: any) => (
                        <div key={range.range} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{range.range}</span>
                          <span className="font-medium text-gray-700">{range.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link Validation Stats */}
                {statsData.stats.linkValidationStats && statsData.stats.linkValidationStats.totalLinks > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Link Validation</h5>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Total Links</span>
                        <span className="font-medium">{statsData.stats.linkValidationStats.totalLinks}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-green-600">Valid</span>
                        <span className="font-medium text-green-600">{statsData.stats.linkValidationStats.validLinks}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-red-600">Invalid</span>
                        <span className="font-medium text-red-600">{statsData.stats.linkValidationStats.invalidLinks}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium">{statsData.stats.linkValidationStats.validPercentage}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Issues */}
                {statsData.stats.commonIssues && statsData.stats.commonIssues.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Common Issues</h5>
                    <div className="space-y-1">
                      {statsData.stats.commonIssues.map((issue: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <span className="text-sm text-red-700">{issue.issue.replace('_', ' ')}</span>
                          <span className="font-medium text-red-700">{issue.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <p>No statistics available</p>
              </div>
            )}
          </div>
        )}
      </div>      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          💡 Use <code className="bg-gray-200 px-1 rounded">@QAreview</code> in messages to trigger quality checks
        </div>
      </div>
    </ResizablePanel>
  );
};

// API Functions
async function fetchQAReviews(taskId: string) {
  const response = await fetch(`/api/qa/reviews/${taskId}`);
  if (!response.ok) throw new Error('Failed to fetch QA reviews');
  return response.json();
}

async function fetchQARules() {
  const response = await fetch('/api/qa/rules');
  if (!response.ok) throw new Error('Failed to fetch QA rules');
  return response.json();
}

async function fetchQAStats(taskId: string) {
  const response = await fetch(`/api/qa/stats/${taskId}`);
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

export default EnhancedQAReviewPanel;