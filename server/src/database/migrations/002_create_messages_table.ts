import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messages', (table) => {
    table.string('id').primary();
    table.string('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.string('sender_name').notNullable();
    table.string('sender_email');
    table.text('content').notNullable();
    table.enum('message_type', ['text', 'image', 'file', 'system', 'qa_review']).defaultTo('text');
    table.string('parent_message_id').references('id').inTable('messages');
    table.json('attachments');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['task_id', 'created_at']);
    table.index(['parent_message_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('messages');
}