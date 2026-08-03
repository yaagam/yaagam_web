import { Module } from '@nestjs/common';
import { TRUSTED_PROXY_VALIDATOR } from './constants/security-token.const';
import { TrustedProxyMiddleware } from './trusted-proxy.middleware';
import { TrustedProxyValidator } from './trusted-proxy.validator';

@Module({
  providers: [
    {
      provide: TRUSTED_PROXY_VALIDATOR,
      useClass: TrustedProxyValidator,
    },
    TrustedProxyMiddleware,
  ],
  exports: [TRUSTED_PROXY_VALIDATOR, TrustedProxyMiddleware],
})
export class SecurityModule {}
