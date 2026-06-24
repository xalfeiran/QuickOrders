import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface HealthReport {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Runs a trivial query to confirm the database connection is alive.
  async check(): Promise<HealthReport> {
    const db = (await this.pingDatabase()) ? 'up' : 'down';
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      timestamp: new Date().toISOString(),
    };
  }

  private async pingDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
