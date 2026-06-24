import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

// Liveness + readiness probe used by docker-compose and uptime checks.
// Reports overall status and database connectivity.
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    const report = await this.healthService.check();
    // Surface a failing DB as 503 so orchestrators see the API as unhealthy.
    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}
