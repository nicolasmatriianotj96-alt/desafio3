exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(120)', notNull: true },
    email: { type: 'varchar(160)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(80)', notNull: true },
    color: { type: 'varchar(20)', notNull: true, default: '#6366f1' },
    owner_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'cascade',
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('categories', 'categories_owner_name_unique', {
    unique: ['owner_id', 'name'],
  });

  pgm.createType('task_status', ['pending', 'in_progress', 'done']);
  pgm.createType('task_priority', ['low', 'medium', 'high']);

  pgm.createTable('tasks', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    title: { type: 'varchar(160)', notNull: true },
    description: { type: 'text' },
    status: { type: 'task_status', notNull: true, default: 'pending' },
    priority: { type: 'task_priority', notNull: true, default: 'medium' },
    due_date: { type: 'date' },
    category_id: {
      type: 'uuid',
      references: 'categories',
      onDelete: 'set null',
    },
    owner_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'cascade',
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('tasks', 'owner_id');
  pgm.createIndex('tasks', 'category_id');
  pgm.createIndex('tasks', 'status');

  pgm.createTable('task_collaborators', {
    task_id: {
      type: 'uuid',
      notNull: true,
      references: 'tasks',
      onDelete: 'cascade',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'cascade',
    },
    added_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('task_collaborators', 'task_collaborators_pk', {
    primaryKey: ['task_id', 'user_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('task_collaborators');
  pgm.dropTable('tasks');
  pgm.dropType('task_priority');
  pgm.dropType('task_status');
  pgm.dropTable('categories');
  pgm.dropTable('users');
};
