import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('qa_reviews', (table) => {
    table.string('id').primary();
    table.string('message_id').notNullable().references('id').inTable('messages').onDelete('CASCADE');
    table.string('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('score').notNullable(); // 1-10 quality score
    table.text('feedback');
    table.json('suggestions');
    table.json('rules_applied'); // Which QA rules were checked
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['task_id', 'status']);
    table.index(['message_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('qa_reviews');
}