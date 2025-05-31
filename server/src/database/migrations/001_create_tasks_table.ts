// server/src/database/migrations/001_create_tasks_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tasks', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.string('requester_name').notNullable();
    table.string('requester_email');
    table.string('assigned_to');
    table.enum('status', ['logged', 'ongoing', 'reviewed', 'done', 'blocked']).defaultTo('logged');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.json('tags');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('due_date');
    
    table.index(['status', 'priority']);
    table.index(['created_at']);
    table.index(['assigned_to']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tasks');
}