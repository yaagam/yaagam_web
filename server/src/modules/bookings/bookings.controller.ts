import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import type { AuthRole } from '../auth/services/interfaces/token.service.interface';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';
import { BookingsService } from './services/bookings.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: AuthRole;
  };
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly _bookingsService: BookingsService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Checkout session created')
  async createCheckoutSession(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this._bookingsService.createCheckoutSession(req.user.userId, dto);
  }
}
