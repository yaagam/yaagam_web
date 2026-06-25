import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import type { AuthRole } from '../auth/services/interfaces/token.service.interface';
import {
  CHECKOUT_SESSION_CREATED,
  MY_POOJAS_FETCHED,
} from './constants/success-message.const';
import { BOOKING_SERVICE } from './constants/service-tokens.const';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';
import { GetMyPoojasQueryDto } from './dtos/get-my-poojas-query.dto';
import type {
  IBookingService,
  PaginatedMyPoojas,
} from './services/booking.service.interface';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: AuthRole;
  };
}

@Controller('bookings')
export class BookingsController {
  constructor(
    @Inject(BOOKING_SERVICE)
    private readonly _bookingsService: IBookingService,
  ) {}

  @Get('my-poojas')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(MY_POOJAS_FETCHED)
  getMyPoojas(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetMyPoojasQueryDto,
  ): Promise<PaginatedMyPoojas> {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this._bookingsService.getMyPoojas(req.user.userId, query);
  }

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(CHECKOUT_SESSION_CREATED)
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
