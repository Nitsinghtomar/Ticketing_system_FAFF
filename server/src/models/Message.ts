export interface Message {
  id: string;
  task_id: string;
  sender_name: string;
  sender_email?: string;
  content: string;
  message_type: MessageType;
  parent_message_id?: string;
  attachments?: string[];
  created_at: Date;
  updated_at: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  QA_REVIEW = 'qa_review'
}