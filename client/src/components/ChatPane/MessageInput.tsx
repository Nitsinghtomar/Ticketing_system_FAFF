import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

interface MessageInputProps {
  taskId: string;
  onMessageSent: () => void;
}

// File type validation
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File upload service
const uploadFile = async (file: File, taskId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('taskId', taskId);

  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  return await response.json();
};

// Send message service
const sendMessage = async (taskId: string, messageData: any) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat/${taskId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return await response.json();
};

const MessageInput: React.FC<MessageInputProps> = ({ taskId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    preview?: string;
    uploading: boolean;
    uploadedUrl?: string;
    id: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation(
    (messageData: any) => sendMessage(taskId, messageData),
    {
      onSuccess: () => {
        setMessage('');
        setUploadedFiles([]);
        onMessageSent();
        queryClient.invalidateQueries(['messages', taskId]);
        toast.success('Message sent');
      },
      onError: () => {
        toast.error('Failed to send message');
      }
    }
  );

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file type
    const allAllowedTypes = [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents];
    if (!allAllowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload images (JPEG, PNG, GIF, WebP) or documents (PDF, Word, Excel, TXT, CSV)';
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }

      const fileId = `${Date.now()}-${Math.random()}`;
      const fileData = {
        file,
        uploading: true,
        id: fileId,
        preview: ALLOWED_FILE_TYPES.images.includes(file.type) 
          ? URL.createObjectURL(file) 
          : undefined
      };

      setUploadedFiles(prev => [...prev, fileData]);

      try {
        const uploadResult = await uploadFile(file, taskId);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, uploading: false, uploadedUrl: uploadResult.url }
              : f
          )
        );
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      }
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleSubmit = async () => {
    if (!message.trim() && uploadedFiles.length === 0) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    if (uploadedFiles.some(f => f.uploading)) {
      toast.error('Please wait for all files to finish uploading');
      return;
    }

    const attachments = uploadedFiles.map(f => ({
      filename: f.file.name,
      url: f.uploadedUrl,
      type: f.file.type,
      size: f.file.size
    }));

    const messageData = {
      content: message.trim(),
      sender_name: 'Current User',
      sender_email: 'user@company.com',
      message_type: attachments.length > 0 ? 'file' : 'text',
      attachments: attachments.length > 0 ? attachments : undefined
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getFileIcon = (type: string) => {
    if (ALLOWED_FILE_TYPES.images.includes(type)) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('csv')) return '📊';
    return '📎';
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* File Previews */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {uploadedFiles.map((fileData) => (
            <div key={fileData.id} className="relative bg-gray-50 border border-gray-200 rounded-lg p-2 max-w-xs">
              <div className="flex items-center space-x-2">
                {fileData.preview ? (
                  <img 
                    src={fileData.preview} 
                    alt={fileData.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xl">
                    {getFileIcon(fileData.file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileData.file.size / 1024).toFixed(1)} KB
                  </p>
                  {fileData.uploading && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div className="bg-blue-600 h-1 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(fileData.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  disabled={fileData.uploading}
                >
                  ✕
                </button>
              </div>
              {fileData.uploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Use @QAreview to trigger quality review)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            disabled={sendMessageMutation.isLoading}
          />
          
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Attach file"
            disabled={sendMessageMutation.isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={sendMessageMutation.isLoading || (uploadedFiles.some(f => f.uploading))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>{sendMessageMutation.isLoading ? 'Sending...' : 'Send'}</span>
        </button>
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={[...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents].join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="mt-2 text-xs text-gray-500">
        <strong>Pro tip:</strong> Use @QAreview in your message to trigger quality assurance review • 
        Attach images or documents up to 10MB
      </div>
    </div>
  );
};

export default MessageInput;