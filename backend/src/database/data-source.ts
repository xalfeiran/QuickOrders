import { DataSource, DataSourceOptions } from 'typeorm';

// Single source of truth for the database connection. Both the NestJS app
// (see app.module.ts) and the TypeORM CLI (migrations) build their connection
// from these options, so there's only one place to change.
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'quickorder',
  password: process.env.DB_PASSWORD ?? 'quickorder',
  database: process.env.DB_NAME ?? 'quickorder',

  // Entities and migrations are discovered by file name convention. Globs
  // cover both the TypeScript sources (CLI via ts-node) and the compiled
  // JavaScript (production container).
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  // Never auto-create tables from entities — schema changes go through
  // migrations so they're explicit and reviewable.
  synchronize: false,

  // Apply pending migrations automatically on startup. Safe when there are
  // none yet (no-op); keeps the containerised DB schema in sync on deploy.
  migrationsRun: true,
};

// Default export used by the TypeORM CLI (npm run migration:*).
export default new DataSource(dataSourceOptions);
