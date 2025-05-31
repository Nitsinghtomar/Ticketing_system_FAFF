// server/src/database/seedData.ts
import { db } from './connection';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await db('qa_reviews').del();
    await db('summaries').del();
    await db('messages').del();
    await db('tasks').del();
    await db('users').del();

    // Insert sample users
    const users = [
      {
        id: uuidv4(),
        name: 'John Smith',
        email: 'john@company.com',
        role: 'operator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Mike Wilson',
        email: 'mike@company.com',
        role: 'qa_reviewer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Emily Chen',
        email: 'emily@company.com',
        role: 'operator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'David Rodriguez',
        email: 'david@company.com',
        role: 'operator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await db('users').insert(users);

    // Insert sample tasks
    const tasks = [
      {
        id: '1',
        title: 'Fix login issue for enterprise customers',
        description: 'Multiple enterprise customers reporting login failures after the recent update',
        requester_name: 'Alice Cooper',
        requester_email: 'alice@enterprise.com',
        assigned_to: 'John Smith',
        status: 'ongoing',
        priority: 'high',
        tags: JSON.stringify(['bug', 'authentication', 'enterprise']),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Database performance optimization',
        description: 'Query response times have increased significantly in the past week',
        requester_name: 'Bob Martinez',
        requester_email: 'bob@company.com',
        assigned_to: 'Sarah Johnson',
        status: 'reviewed',
        priority: 'medium',
        tags: JSON.stringify(['performance', 'database', 'optimization']),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Add new payment gateway integration',
        description: 'Integrate Stripe payment gateway for European customers',
        requester_name: 'Carol Davis',
        requester_email: 'carol@company.com',
        assigned_to: null,
        status: 'logged',
        priority: 'medium',
        tags: JSON.stringify(['feature', 'payment', 'integration']),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Security vulnerability in file upload',
        description: 'Potential security issue discovered in file upload functionality',
        requester_name: 'Dave Thompson',
        requester_email: 'dave@security.com',
        assigned_to: 'Mike Wilson',
        status: 'blocked',
        priority: 'urgent',
        tags: JSON.stringify(['security', 'vulnerability', 'upload']),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Mobile app notification system',
        description: 'Implement push notifications for mobile application',
        requester_name: 'Emma Wilson',
        requester_email: 'emma@company.com',
        assigned_to: 'Emily Chen',
        status: 'ongoing',
        priority: 'medium',
        tags: JSON.stringify(['mobile', 'notifications', 'feature']),
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await db('tasks').insert(tasks);

    // Insert sample messages
    const messages = [
      {
        id: uuidv4(),
        task_id: '1',
        sender_name: 'Alice Cooper',
        sender_email: 'alice@enterprise.com',
        content: 'Hi team, we\'re experiencing login issues affecting about 50+ enterprise users. The error message shows "Authentication failed" but credentials are correct. Our support contact is +1-555-0123.',
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        task_id: '1',
        sender_name: 'John Smith',
        sender_email: 'john@company.com',
        content: 'Thanks for reporting this Alice. I\'m investigating the authentication service logs. Can you provide the specific time range when users first noticed the issue?',
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        task_id: '1',
        sender_name: 'Alice Cooper',
        sender_email: 'alice@enterprise.com',
        content: 'The issues started around 2 PM EST yesterday. Here\'s our support contact: +1-555-0123. Also, here\'s the error log: https://logs.enterprise.com/auth-errors',
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        task_id: '1',
        sender_name: 'John Smith',
        sender_email: 'john@company.com',
        content: 'Found the issue! The recent OAuth token expiry update affected enterprise SSO integration. Deploying a fix now. @QAreview - Please review this solution before we mark it complete.',
        message_type: 'text',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        task_id: '2',
        sender_name: 'Bob Martinez',
        sender_email: 'bob@company.com',
        content: 'Database performance has degraded significantly. Query response times increased from 100ms to 2000ms. Need immediate optimization of indexes.',
        message_type: 'text',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        task_id: '2',
        sender_name: 'Sarah Johnson',
        sender_email: 'sarah@company.com',
        content: 'I\'ve identified the slow queries. Working on index optimization. Here\'s the performance analysis: https://db.company.com/performance-report',
        message_type: 'text',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        task_id: '3',
        sender_name: 'Carol Davis',
        sender_email: 'carol@company.com',
        content: 'We need to integrate Stripe for European customers. Documentation: https://stripe.com/docs/eu-payments. Contact me at carol@company.com for requirements.',
        message_type: 'text',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await db('messages').insert(messages);

    // Insert sample summaries
    const summaries = [
      {
        id: uuidv4(),
        task_id: '1',
        content: 'Enterprise login issue affecting 50+ users resolved through OAuth token expiry fix. Support contact provided (+1-555-0123) and error logs shared. Solution deployed and awaiting QA review.',
        entities: JSON.stringify({
          phoneNumbers: ['+1-555-0123'],
          emails: ['alice@enterprise.com', 'john@company.com'],
          urls: ['https://logs.enterprise.com/auth-errors'],
          keyPeople: ['Alice Cooper', 'John Smith'],
          technologies: ['OAuth', 'SSO'],
          actionItems: ['QA review pending']
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await db('summaries').insert(summaries);

    // Insert sample QA reviews
    const qaReviews = [
      {
        id: uuidv4(),
        message_id: messages[3].id, // John's solution message
        task_id: '1',
        score: 9,
        feedback: 'Excellent technical solution with clear explanation and proper QA trigger.',
        suggestions: JSON.stringify(['Consider adding timeline for deployment']),
        rules_applied: JSON.stringify(['Professional tone', 'Technical accuracy', 'Completeness']),
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await db('qa_reviews').insert(qaReviews);

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded data:`);
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📋 Tasks: ${tasks.length}`);
    console.log(`   💬 Messages: ${messages.length}`);
    console.log(`   📄 Summaries: ${summaries.length}`);
    console.log(`   ✅ QA Reviews: ${qaReviews.length}`);

    return true;
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}