// types/Message.ts
export interface Attachment {
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt?: string;
}

export interface Message {
  id: string;
  task_id: string;
  sender_name: string;
  sender_email?: string;
  content: string;
  message_type: MessageType;
  parent_message_id?: string;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  QA_REVIEW = 'qa_review'
}