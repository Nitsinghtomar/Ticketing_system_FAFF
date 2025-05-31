import React from 'react';
import { useQuery, useMutation } from 'react-query';
import { Task } from '../../types/Task';
import { Message } from '../../types/Message';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface SummaryPanelProps {
  task: Task;
  messages: Message[];
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ task, messages }) => {
  const { data: summaryData, refetch } = useQuery(
    ['summary', task.id],
    () => api.getSummary(task.id),
    {
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  const generateSummaryMutation = useMutation(
    () => api.generateSummary(task.id),
    {
      onSuccess: () => {
        refetch();
        toast.success('Summary generated successfully');
      },
      onError: () => {
        toast.error('Failed to generate summary');
      }
    }
  );

  const handleGenerateSummary = () => {
    if (messages.length === 0) {
      toast.error('No messages to summarize');
      return;
    }
    generateSummaryMutation.mutate();
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Task Summary</h3>
        <button
          onClick={handleGenerateSummary}
          disabled={generateSummaryMutation.isLoading}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {generateSummaryMutation.isLoading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {summaryData ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {summaryData.summary}
              </p>
            </div>
            
            {summaryData.entities && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Extracted Information</h4>
                
                {summaryData.entities.phoneNumbers?.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Phone Numbers</h5>
                    {summaryData.entities.phoneNumbers.map((phone: string, index: number) => (
                      <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                        {phone}
                      </div>
                    ))}
                  </div>
                )}
                
                {summaryData.entities.emails?.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Email Addresses</h5>
                    {summaryData.entities.emails.map((email: string, index: number) => (
                      <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                        {email}
                      </div>
                    ))}
                  </div>
                )}
                
                {summaryData.entities.urls?.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Links</h5>
                    {summaryData.entities.urls.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Last updated: {new Date(summaryData.updated_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="mb-2">No summary available</p>
            <p className="text-sm">Click "Generate Summary" to create an AI-powered summary of this conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;