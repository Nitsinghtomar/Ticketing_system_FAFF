import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('qa_reviews').del();
  await knex('summaries').del();
  await knex('messages').del();
  await knex('tasks').del();
  await knex('users').del();

  // Insert comprehensive sample users (15 users as required)
  const users = [
    {
      id: uuidv4(),
      name: 'John Smith',
      email: 'john@company.com',
      role: 'operator',
      department: 'Technical Support',
      phone_number: '+1-555-0101',
      avatar_url: null,
      last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'admin',
      department: 'Management',
      phone_number: '+1-555-0102',
      avatar_url: null,
      last_login_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      updated_at: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: uuidv4(),
      name: 'Mike Wilson',
      email: 'mike@company.com',
      role: 'qa_reviewer',
      department: 'Quality Assurance',
      phone_number: '+1-555-0103',
      avatar_url: null,
      last_login_at: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      updated_at: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      id: uuidv4(),
      name: 'Emily Chen',
      email: 'emily@company.com',
      role: 'operator',
      department: 'Customer Success',
      phone_number: '+1-555-0104',
      avatar_url: null,
      last_login_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      name: 'David Rodriguez',
      email: 'david@company.com',
      role: 'operator',
      department: 'Technical Support',
      phone_number: '+1-555-0105',
      avatar_url: null,
      last_login_at: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000)
    }
  ];

  await knex('users').insert(users);
  // Generate sample tasks
  const tasks = [];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['logged', 'ongoing', 'reviewed', 'done', 'blocked'];
  const operatorUsers = users.filter(u => u.role === 'operator');
  
  const taskTemplates = [
    { title: 'Fix login issue for enterprise customers', description: 'Multiple enterprise customers reporting login failures', tags: ['bug', 'authentication'] },
    { title: 'Update user dashboard interface', description: 'Redesign dashboard for better user experience', tags: ['ui', 'ux'] },
    { title: 'Implement new payment gateway', description: 'Integrate Stripe payment system', tags: ['payment', 'integration'] },
    { title: 'Database performance optimization', description: 'Optimize slow queries during peak hours', tags: ['database', 'performance'] },
    { title: 'Mobile app notification system', description: 'Implement push notifications', tags: ['mobile', 'notifications'] }
  ];

  for (let i = 0; i < 50; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    const assignedUser = operatorUsers[i % operatorUsers.length];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdDaysAgo = Math.floor(Math.random() * 30) + 1;
    const updatedHoursAgo = Math.floor(Math.random() * 48) + 1;

    tasks.push({
      id: uuidv4(),
      title: `${template.title} #${i + 1}`,
      description: `${template.description} (Task variant ${i + 1})`,
      requester_name: `Customer ${i + 1}`,
      requester_email: `customer${i + 1}@external.com`,
      assigned_to: assignedUser.name,
      status,
      priority,
      tags: JSON.stringify(template.tags),
      created_at: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - updatedHoursAgo * 60 * 60 * 1000)
    });
  }

  await knex('tasks').insert(tasks);

  // Generate sample messages
  const messages = [];
  for (let i = 0; i < Math.min(20, tasks.length); i++) {
    const task = tasks[i];
    const numMessages = Math.floor(Math.random() * 3) + 2; // 2-4 messages
    
    for (let j = 0; j < numMessages; j++) {
      const isFromOperator = j % 2 === 1;
      const messageTime = new Date(task.created_at.getTime() + j * 4 * 60 * 60 * 1000);
      
      messages.push({
        id: uuidv4(),
        task_id: task.id,
        sender_name: isFromOperator ? task.assigned_to : task.requester_name,
        sender_email: isFromOperator ? users.find(u => u.name === task.assigned_to)?.email || 'operator@company.com' : task.requester_email,
        content: isFromOperator ? `Working on resolving task #${i + 1}. Message ${j + 1} from operator.` : `Additional details for task #${i + 1}. Message ${j + 1} from customer.`,
        message_type: 'text',
        created_at: messageTime,
        updated_at: messageTime
      });
    }
  }

  await knex('messages').insert(messages);

  // Generate AI summaries for completed tasks
  const summaries = [];
  const completedTasks = tasks.filter(t => t.status === 'completed').slice(0, 10);

  for (const task of completedTasks) {
    summaries.push({
      id: uuidv4(),
      task_id: task.id,
      summary: `Task "${task.title}" was successfully resolved through systematic troubleshooting.`,
      key_points: JSON.stringify([
        'Issue identified and analyzed',
        'Solution implemented and tested',
        'Customer confirmation received'
      ]),
      action_items: JSON.stringify([
        'Monitor for related issues',
        'Update documentation'
      ]),
      created_at: new Date(task.updated_at.getTime() + 30 * 60 * 1000),
      updated_at: new Date(task.updated_at.getTime() + 30 * 60 * 1000)
    });
  }

  if (summaries.length > 0) {
    await knex('summaries').insert(summaries);
  }
  // Generate QA reviews
  const qaReviews = [];
  const reviewableMessages = messages.filter(m => {
    const sender = users.find(u => u.email === m.sender_email);
    return sender && sender.role === 'operator';
  }).slice(0, 15);

  for (const message of reviewableMessages) {
    const score = Math.floor(Math.random() * 4) + 7; // 7-10 score
    
    qaReviews.push({
      id: uuidv4(),
      message_id: message.id,
      task_id: message.task_id,
      score,
      feedback: score >= 9 ? 'Excellent response quality.' : 'Good response with minor improvements needed.',
      suggestions: JSON.stringify(['Consider more detailed explanation']),
      rules_applied: JSON.stringify(['Professional tone maintained', 'Technical accuracy verified']),
      status: score >= 9 ? 'approved' : 'pending',
      created_at: new Date(message.created_at.getTime() + 2 * 60 * 60 * 1000),
      updated_at: new Date(message.created_at.getTime() + 2 * 60 * 60 * 1000)
    });
  }

  if (qaReviews.length > 0) {
    await knex('qa_reviews').insert(qaReviews);
  }

  console.log('🎉 Successfully populated demo data:');
  console.log(`👥 Users: ${users.length}`);
  console.log(`📋 Tasks: ${tasks.length}`);
  console.log(`💬 Messages: ${messages.length}`);
  console.log(`📄 Summaries: ${summaries.length}`);
  console.log(`✅ QA Reviews: ${qaReviews.length}`);
}