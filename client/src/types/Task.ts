export interface Task {
  id: string;
  title: string;
  description?: string;
  requester_name: string;
  requester_email?: string;
  assigned_to?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags?: string[];
  created_at: string;
  updated_at: string;
  due_date?: string;
}

export enum TaskStatus {
  LOGGED = 'logged',
  ONGOING = 'ongoing',
  REVIEWED = 'reviewed',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}