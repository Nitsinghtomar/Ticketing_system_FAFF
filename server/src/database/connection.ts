// server/src/database/connection.ts
import knex from 'knex';
import path from 'path';

// Database configuration
const config = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(process.cwd(), 'database.sqlite')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    extension: 'ts'
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
    extension: 'ts'
  }
};

// Create the database instance
export const db = knex(config);

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  try {
    // Check if tables exist, if not create them
    const tableExists = await db.schema.hasTable('tasks');
    
    if (!tableExists) {
      console.log('🗄️ Creating database tables...');
      
      // Create tasks table
      await db.schema.createTable('tasks', (table) => {
        table.string('id').primary();
        table.string('title').notNullable();
        table.text('description');
        table.string('requester_name').notNullable();
        table.string('requester_email');
        table.string('assigned_to');
        table.enum('status', ['logged', 'ongoing', 'reviewed', 'done', 'blocked']).defaultTo('logged');
        table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
        table.json('tags');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.timestamp('due_date');
        
        table.index(['status', 'priority']);
        table.index(['created_at']);
        table.index(['assigned_to']);
      });

      // Create messages table
      await db.schema.createTable('messages', (table) => {
        table.string('id').primary();
        table.string('task_id').notNullable();
        table.string('sender_name').notNullable();
        table.string('sender_email');
        table.text('content').notNullable();
        table.enum('message_type', ['text', 'image', 'file', 'system', 'qa_review']).defaultTo('text');
        table.string('parent_message_id');
        table.json('attachments');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        table.index(['task_id', 'created_at']);
        table.index(['parent_message_id']);
      });

      // Create summaries table
      await db.schema.createTable('summaries', (table) => {
        table.string('id').primary();
        table.string('task_id').notNullable();
        table.text('content').notNullable();
        table.json('entities');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        table.unique(['task_id']);
      });

      // Create qa_reviews table
      await db.schema.createTable('qa_reviews', (table) => {
        table.string('id').primary();
        table.string('message_id').notNullable();
        table.string('task_id').notNullable();
        table.integer('score').notNullable();
        table.text('feedback');
        table.json('suggestions');
        table.json('rules_applied');
        table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        table.index(['task_id', 'status']);
        table.index(['message_id']);
      });

      // Create users table
      await db.schema.createTable('users', (table) => {
        table.string('id').primary();
        table.string('name').notNullable();
        table.string('email').notNullable().unique();
        table.string('role').defaultTo('operator');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        table.index(['email']);
        table.index(['role', 'is_active']);
      });

      console.log('✅ Database tables created successfully');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

export default db;