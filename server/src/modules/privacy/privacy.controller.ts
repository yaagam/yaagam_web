import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthRole } from '../auth/services/interfaces/token.service.interface';
import { AcceptBookingConsentDto } from './dtos/accept-booking-consent.dto';
import { type BookingConsentStatus, PrivacyService } from './privacy.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: AuthRole;
  };
}

@Controller('privacy/consents')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('booking')
  getBookingConsent(
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingConsentStatus> {
    return this.privacyService.getBookingConsentStatus(this.userId(req));
  }

  @Post('booking')
  acceptBookingConsent(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AcceptBookingConsentDto,
  ): Promise<BookingConsentStatus> {
    return this.privacyService.acceptBookingConsent(this.userId(req), dto);
  }

  private userId(req: AuthenticatedRequest): string {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return req.user.userId;
  }
}
