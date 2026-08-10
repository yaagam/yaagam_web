import { Module } from '@nestjs/common';
import { RAZORPAY_CLIENT } from './constants/razorpay-service-token.const';
import { RazorpayClientService } from './services/razorpay-client.service';

@Module({
  providers: [
    RazorpayClientService,
    { provide: RAZORPAY_CLIENT, useExisting: RazorpayClientService },
  ],
  exports: [RAZORPAY_CLIENT],
})
export class RazorpayModule {}
