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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decarators/success-message.decarator';
import { JwtAuthGuard } from '../../../common/gurads/jwt-auth.guard';
import type { AuthRole } from '../../auth/services/interfaces/token.service.interface';
import {
  SUPPORT_FAQS_FETCHED,
  SUPPORT_TICKET_AVAILABILITY_CHECKED,
  SUPPORT_TICKET_CREATED,
} from '../constants/success-message.const';
import { SUPPORT_SERVICE } from '../constants/service-tokens.const';
import { CheckSupportTicketQueryDto } from '../dto/check-support-ticket-query.dto';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import type { SupportFaqEntity } from '../entities/support-faq.entity';
import type {
  CreateSupportTicketResult,
  ISupportService,
  SupportTicketAvailabilityResult,
} from '../services/support.service.interface';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: AuthRole;
  };
}

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(
    @Inject(SUPPORT_SERVICE)
    private readonly _supportService: ISupportService,
  ) {}

  @Get('faqs')
  @ApiOperation({ summary: 'Get support FAQs' })
  @ApiOkResponse({
    description: 'Predefined support FAQs',
    schema: {
      example: [
        {
          id: 'booking',
          question: 'How do I book a pooja?',
          answer: '...',
        },
      ],
    },
  })
  @ResponseMessage(SUPPORT_FAQS_FETCHED)
  getFaqs(): SupportFaqEntity[] {
    return this._supportService.getFaqs();
  }

  @Get('tickets/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check support ticket availability by phone number',
  })
  @ApiOkResponse({
    description: 'Support ticket availability',
    schema: {
      example: {
        canCreate: false,
        message:
          'You have already created a ticket. If you have any other query, tell our team when they contact you.',
      },
    },
  })
  @ResponseMessage(SUPPORT_TICKET_AVAILABILITY_CHECKED)
  checkTicketAvailability(
    @Req() req: AuthenticatedRequest,
    @Query() query: CheckSupportTicketQueryDto,
  ): Promise<SupportTicketAvailabilityResult> {
    this._ensureAuthenticated(req);

    return this._supportService.checkTicketAvailability(query.phoneNumber);
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a support ticket' })
  @ApiCreatedResponse({
    description: 'Support ticket created',
    schema: {
      example: {
        success: true,
        ticketNumber: 'SUP-000023',
        message: 'Our support team will contact you within 24 hours.',
      },
    },
  })
  @ResponseMessage(SUPPORT_TICKET_CREATED)
  createTicket(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSupportTicketDto,
  ): Promise<CreateSupportTicketResult> {
    this._ensureAuthenticated(req);

    return this._supportService.createTicket(dto, req.user.userId);
  }

  private _ensureAuthenticated(req: AuthenticatedRequest): asserts req is
    AuthenticatedRequest & { user: { userId: string; role: AuthRole } } {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Please login first.');
    }
  }
}