import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SendOtpDto } from './dtos/send-otp.dto';
import { AuthService } from './services/auth.service';
import type { SendOtpOutput } from './services/auth.service.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.ACCEPTED)
  sendOtp(@Body() dto: SendOtpDto): Promise<SendOtpOutput> {
    return this.authService.sendOtp(dto);
  }
}
