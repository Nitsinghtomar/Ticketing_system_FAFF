import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Task } from '../../types/Task';
import { Message } from '../../types/Message';
import { api } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { MessageThread } from './MessageThread';

import MessageInput from './MessageInput';
import SummaryPanel from './SummaryPanel';

interface ChatPaneProps {
  task: Task;
}

const ChatPane: React.FC<ChatPaneProps> = ({ task }) => {
  const [showSummary, setShowSummary] = useState(false);
  const { socket } = useSocket();

  const { data: messagesData, refetch } = useQuery(
    ['messages', task.id],
    () => api.getMessages(task.id),
    {
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );

  // Real-time message updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (message.task_id === task.id) {
        refetch();
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, task.id, refetch]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 flex">
        {/* Chat Messages */}
        <div className={`transition-all duration-300 ${showSummary ? 'w-2/3' : 'w-full'} flex flex-col`}>
          <MessageThread messages={messagesData?.messages || []} />
          <MessageInput taskId={task.id} onMessageSent={refetch} />
        </div>
        
        {/* Summary Panel */}
        {showSummary && (
          <div className="w-1/3 border-l border-gray-200">
            <SummaryPanel task={task} messages={messagesData?.messages || []} />
          </div>
        )}
      </div>
      
      {/* Summary Toggle */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showSummary ? 'Hide Summary' : 'Show Summary'}
        </button>
      </div>
    </div>
  );
};

export default ChatPane;