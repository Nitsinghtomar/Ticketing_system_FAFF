import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('role').defaultTo('operator'); // operator, admin, qa_reviewer
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['email']);
    table.index(['role', 'is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}