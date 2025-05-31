// Shared message storage
let messages: any[] = [];

export const messageStorage = {
  addMessage: (message: any) => {
    messages.push(message);
  },
  
  getMessagesForTask: (taskId: string) => {
    return messages.filter(msg => msg.task_id === taskId);
  },
  
  getAllMessages: () => {
    return messages;
  }
};