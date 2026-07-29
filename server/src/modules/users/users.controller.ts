import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import type { AuthRole } from '../auth/services/interfaces/token.service.interface';
import {
  CHANGE_WHATSAPP_OTP_SENT,
  USERS_FETCHED,
  WHATSAPP_NUMBER_CHANGED,
} from './constants/success-message.const';
import { USER_SERVICE } from './constants/service-tokens.const';
import { SendChangeWhatsappOtpDto } from './dtos/send-change-whatsapp-otp.dto';
import { VerifyChangeWhatsappOtpDto } from './dtos/verify-change-whatsapp-otp.dto';
import type {
  ChangedWhatsappNumber,
  ChangeWhatsappOtpSession,
  IUserService,
} from './users.service.interface';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: AuthRole;
  };
}

@Controller('users')
export class UsersController {
  constructor(
    @Inject(USER_SERVICE)
    private readonly _usersService: IUserService,
  ) {}

  private _getClientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  @Get()
  @ResponseMessage(USERS_FETCHED)
  getUsers(): Promise<unknown[]> {
    return this._usersService.getUsers();
  }

  @Post('whatsapp-number/change-otp')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(CHANGE_WHATSAPP_OTP_SENT)
  sendChangeWhatsappOtp(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendChangeWhatsappOtpDto,
  ): Promise<ChangeWhatsappOtpSession> {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this._usersService.sendChangeWhatsappOtp(
      req.user.userId,
      dto,
      this._getClientIp(req),
    );
  }

  @Post('whatsapp-number/change-verify')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(WHATSAPP_NUMBER_CHANGED)
  verifyChangeWhatsappOtp(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyChangeWhatsappOtpDto,
  ): Promise<ChangedWhatsappNumber> {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this._usersService.verifyChangeWhatsappOtp(
      req.user.userId,
      dto,
      this._getClientIp(req),
    );
  }
}
