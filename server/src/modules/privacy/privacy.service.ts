import { BadRequestException, Injectable } from '@nestjs/common';
import PrismaService from '../../prisma/prisma.service';
import {
  BOOKING_CONSENT_NOTICE_VERSION,
  BOOKING_CONSENT_PURPOSE,
} from './privacy.constants';
import type { AcceptBookingConsentDto } from './dtos/accept-booking-consent.dto';

export type BookingConsentStatus = {
  accepted: boolean;
  noticeVersion: string;
  acceptedAt: Date | null;
};

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async getBookingConsentStatus(userId: string): Promise<BookingConsentStatus> {
    const consent = await this.prisma.privacyConsent.findUnique({
      where: {
        userId_purpose_noticeVersion: {
          userId,
          purpose: BOOKING_CONSENT_PURPOSE,
          noticeVersion: BOOKING_CONSENT_NOTICE_VERSION,
        },
      },
      select: { acceptedAt: true, withdrawnAt: true },
    });

    return {
      accepted: Boolean(consent && !consent.withdrawnAt),
      noticeVersion: BOOKING_CONSENT_NOTICE_VERSION,
      acceptedAt: consent && !consent.withdrawnAt ? consent.acceptedAt : null,
    };
  }

  async acceptBookingConsent(
    userId: string,
    dto: AcceptBookingConsentDto,
  ): Promise<BookingConsentStatus> {
    if (dto.noticeVersion !== BOOKING_CONSENT_NOTICE_VERSION) {
      throw new BadRequestException(
        'The privacy notice has changed. Review the current notice and try again.',
      );
    }

    const consent = await this.prisma.privacyConsent.upsert({
      where: {
        userId_purpose_noticeVersion: {
          userId,
          purpose: BOOKING_CONSENT_PURPOSE,
          noticeVersion: BOOKING_CONSENT_NOTICE_VERSION,
        },
      },
      create: {
        userId,
        purpose: BOOKING_CONSENT_PURPOSE,
        noticeVersion: BOOKING_CONSENT_NOTICE_VERSION,
        language: dto.language,
        source: 'POOJA_BOOKING',
      },
      update: {
        language: dto.language,
        source: 'POOJA_BOOKING',
        acceptedAt: new Date(),
        withdrawnAt: null,
      },
      select: { acceptedAt: true },
    });

    return {
      accepted: true,
      noticeVersion: BOOKING_CONSENT_NOTICE_VERSION,
      acceptedAt: consent.acceptedAt,
    };
  }
}
