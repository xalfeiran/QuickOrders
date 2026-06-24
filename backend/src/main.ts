import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import passport from 'passport';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes live under /api so the frontend has a clean prefix to target.
  app.setGlobalPrefix('api');

  // Reject any request body that doesn't match its DTO.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Allow the browser frontend (different origin) to call the API. credentials
  // must be true so the session cookie is sent on admin requests.
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:8080').split(','),
    credentials: true,
  });

  // --- Sessions for the admin dashboard (stored in Postgres) ---
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({
        conObject: {
          host: process.env.DB_HOST ?? 'localhost',
          port: Number(process.env.DB_PORT ?? 5432),
          user: process.env.DB_USER ?? 'quickorder',
          password: process.env.DB_PASSWORD ?? 'quickorder',
          database: process.env.DB_NAME ?? 'quickorder',
        },
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET ?? 'dev-insecure-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`QuickOrder API listening on http://localhost:${port}/api`);
}

bootstrap();
