import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import type { AuthRole } from '../auth/services/interfaces/token.service.interface';
import {
  IDEMPOTENCY_HEADER,
  PAYMENT_SESSION_SERVICE,
  PAYMENT_SERVICE,
  PAYMENT_WEBHOOK_SERVICE,
} from './constants/payment.const';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';
import { SubscriptionActionDto } from './dtos/subscription-action.dto';
import { VerifyRazorpayPaymentDto } from './dtos/verify-razorpay-payment.dto';
import type { IPaymentService } from './interfaces/payment-service.interface';
import type { IPaymentSessionService } from './interfaces/payment-session-service.interface';
import type { IPaymentWebhookService } from './interfaces/payment-webhook-service.interface';
import { TransactionsService } from './transactions.service';
interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: AuthRole };
}

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(PAYMENT_SERVICE) private readonly _payments: IPaymentService,
  ) {}
  @Post()
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ResponseMessage('Payment created')
  create(
    @Req() req: AuthenticatedRequest,
    @Headers(IDEMPOTENCY_HEADER) key: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this._payments.createPayment(
      this._user(req),
      key,
      dto,
      this._correlationId(req),
    );
  }
  @Get(':reference') get(
    @Req() req: AuthenticatedRequest,
    @Param('reference') reference: string,
  ) {
    return this._payments.getPayment(this._user(req), reference);
  }
  @Delete(':reference') @HttpCode(HttpStatus.NO_CONTENT) async cancel(
    @Req() req: AuthenticatedRequest,
    @Param('reference') reference: string,
  ) {
    await this._payments.cancelPayment(this._user(req), reference);
  }
  @Post(':reference/reconcile') reconcile(
    @Req() req: AuthenticatedRequest,
    @Param('reference') reference: string,
  ) {
    return this._payments.reconcilePayment(this._user(req), reference);
  }
  @Post('subscriptions/weekly')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  createSubscription(
    @Req() req: AuthenticatedRequest,
    @Headers(IDEMPOTENCY_HEADER) key: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this._payments.createSubscription(
      this._user(req),
      key,
      dto,
      this._correlationId(req),
    );
  }
  @Patch('subscriptions/:reference')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeSubscription(
    @Req() req: AuthenticatedRequest,
    @Param('reference') reference: string,
    @Body() dto: SubscriptionActionDto,
  ) {
    await this._payments.changeSubscription(
      this._user(req),
      reference,
      dto.action,
    );
  }
  private _correlationId(req: AuthenticatedRequest): string | undefined {
    return typeof req.id === 'string' ? req.id : undefined;
  }

  private _user(req: AuthenticatedRequest): string {
    if (!req.user?.userId)
      throw new UnauthorizedException('Authenticated user not found');
    return req.user.userId;
  }
}

@ApiTags('payment-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments/sessions')
export class PaymentSessionsController {
  constructor(
    @Inject(PAYMENT_SESSION_SERVICE)
    private readonly _sessions: IPaymentSessionService,
  ) {}

  @Get(':publicToken')
  getSnapshot(
    @Req() req: AuthenticatedRequest,
    @Param('publicToken') publicToken: string,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }
    return this._sessions.getSnapshot(req.user.userId, publicToken);
  }
}

@ApiTags('payment-webhooks')
@Controller('webhooks/razorpay')
export class PaymentWebhookController {
  constructor(
    @Inject(PAYMENT_WEBHOOK_SERVICE)
    private readonly _webhooks: IPaymentWebhookService,
  ) {}
  @Post() @HttpCode(HttpStatus.ACCEPTED) receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Headers('x-razorpay-event-id') eventId: string,
  ) {
    return this._webhooks.receive(
      req.rawBody ?? Buffer.alloc(0),
      signature ?? '',
      eventId ?? '',
    );
  }
}

@Controller('payments')
export class LegacyPaymentsController {
  constructor(private readonly _transactions: TransactionsService) {}
  @Post('razorpay/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Payment verified')
  verify(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyRazorpayPaymentDto,
  ) {
    if (!req.user?.userId)
      throw new UnauthorizedException('Authenticated user not found');
    return this._transactions.verifyRazorpayPayment(req.user.userId, dto);
  }
}
