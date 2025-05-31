import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('summaries', (table) => {
    table.string('id').primary();
    table.string('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.text('content').notNullable();
    table.json('entities'); // Extracted entities (contacts, links, etc.)
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['task_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('summaries');
}