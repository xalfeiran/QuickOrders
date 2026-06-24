import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

// Standalone seed runner (`npm run seed`). Booting the application context
// applies any pending migrations and triggers SeedService — which is idempotent
// and only creates what's missing (default business + menu + superadmin) —
// without starting the HTTP server. Then it exits.
async function run() {
  const logger = new Logger('SeedCLI');
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.close();
  logger.log('Seed finished.');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
