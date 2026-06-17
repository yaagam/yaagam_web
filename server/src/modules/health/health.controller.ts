import { Controller, Get } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decarators/success-message.decarator';

@Controller('health')
export class HealthController {
  @Get()
  @ResponseMessage('Health Check is fine')
  getHealth() {
    return { status: 'OK' };
  }
}
