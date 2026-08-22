import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  StreamableFile,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthRole } from '../auth/services/interfaces/token.service.interface';
import {
  CHECKOUT_SESSION_CREATED,
  LAST_BOOKING_DEVOTEE_DETAILS_FETCHED,
  MY_POOJAS_FETCHED,
} from './constants/success-message.const';
import {
  BOOKING_INVOICE_SERVICE,
  BOOKING_SERVICE,
} from './constants/service-tokens.const';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';
import { GetMyPoojasQueryDto } from './dtos/get-my-poojas-query.dto';
import type {
  IBookingService,
  LastBookingDevoteeDetails,
  PaginatedMyPoojas,
} from './services/booking.service.interface';
import type { IBookingInvoiceService } from './services/booking-invoice.service.interface';

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
    @Inject(BOOKING_INVOICE_SERVICE)
    private readonly _bookingInvoiceService: IBookingInvoiceService,
  ) {}

  @Get('last-devotee-details')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(LAST_BOOKING_DEVOTEE_DETAILS_FETCHED)
  getLastBookingDevoteeDetails(
    @Req() req: AuthenticatedRequest,
  ): Promise<LastBookingDevoteeDetails | null> {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this._bookingsService.getLastBookingDevoteeDetails(req.user.userId);
  }
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

  @Get(':bookingNumber/invoice')
  @UseGuards(JwtAuthGuard)
  async downloadInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('bookingNumber') bookingNumber: string,
  ): Promise<StreamableFile> {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }
    const invoice = await this._bookingInvoiceService.createInvoicePdf(
      req.user.userId,
      bookingNumber,
    );
    return new StreamableFile(invoice.content, {
      type: 'application/pdf',
      disposition: `attachment; filename="${invoice.filename}"`,
      length: invoice.content.length,
    });
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
