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
import { VerifyRazorpayPaymentDto } from './dtos/verify-razorpay-payment.dto';
import { TransactionsService } from './transactions.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: AuthRole;
  };
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly _transactionsService: TransactionsService) {}

  @Post('razorpay/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Payment verified')
  async verifyRazorpayPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyRazorpayPaymentDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this._transactionsService.verifyRazorpayPayment(
      req.user.userId,
      dto,
    );
  }
}
