import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { SUPPORT_TICKET_REPOSITORY } from '../constants/service-tokens.const';
import type { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import type { SupportFaqEntity } from '../entities/support-faq.entity';
import type { SupportTicketEntity } from '../entities/support-ticket.entity';
import { SupportFaqId } from '../enums/support-faq.enum';
import type { ISupportTicketRepository } from '../repositories/support-ticket.repository.interface';
import type {
  CreateSupportTicketResult,
  ISupportService,
  SupportTicketAvailabilityResult,
} from './support.service.interface';

const SUPPORT_TICKET_CREATED_MESSAGE =
  'Our support team will contact you within 24 hours.';
const SUPPORT_TICKET_DUPLICATE_MESSAGE =
  'You have already created a ticket. If you have any other query, tell our team when they contact you.';
const ACTIVE_TICKET_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SupportService implements ISupportService {
  private readonly _faqs: SupportFaqEntity[] = [
    {
      id: SupportFaqId.BOOKING,
      question: 'How do I book a pooja?',
      answer: '...',
    },
    {
      id: SupportFaqId.PAYMENT,
      question: 'What payment methods are available?',
      answer: '...',
    },
    {
      id: SupportFaqId.WEEKLY,
      question: 'How do weekly poojas work?',
      answer: '...',
    },
    {
      id: SupportFaqId.REFUND,
      question: 'What is the refund policy?',
      answer: '...',
    },
    {
      id: SupportFaqId.CONTACT,
      question: 'How can I contact support?',
      answer: '...',
    },
  ];

  constructor(
    @Inject(SUPPORT_TICKET_REPOSITORY)
    private readonly _supportTicketRepository: ISupportTicketRepository,
  ) {}

  getFaqs(): SupportFaqEntity[] {
    return this._faqs;
  }

  async checkTicketAvailability(
    phoneNumber: string,
  ): Promise<SupportTicketAvailabilityResult> {
    const existingTicket =
      await this._findRecentUnresolvedTicketByPhoneNumber(phoneNumber);

    if (existingTicket) {
      return {
        canCreate: false,
        message: SUPPORT_TICKET_DUPLICATE_MESSAGE,
      };
    }

    return {
      canCreate: true,
      message: null,
    };
  }

  async createTicket(
    dto: CreateSupportTicketDto,
    userId?: string | null,
  ): Promise<CreateSupportTicketResult> {
    await this._ensureNoRecentUnresolvedTicket(dto.phoneNumber);

    const ticket = await this._supportTicketRepository.create(dto, userId);

    return {
      success: true,
      ticketNumber: ticket.ticketNumber,
      message: SUPPORT_TICKET_CREATED_MESSAGE,
    };
  }

  private async _ensureNoRecentUnresolvedTicket(
    phoneNumber: string,
  ): Promise<void> {
    const availability = await this.checkTicketAvailability(phoneNumber);

    if (!availability.canCreate) {
      throw new ConflictException(availability.message);
    }
  }

  private _getRecentTicketCutoff(): Date {
    return new Date(Date.now() - ACTIVE_TICKET_WINDOW_MS);
  }

  private _findRecentUnresolvedTicketByPhoneNumber(
    phoneNumber: string,
  ): Promise<SupportTicketEntity | null> {
    return this._supportTicketRepository.findRecentUnresolvedByPhoneNumber(
      phoneNumber,
      this._getRecentTicketCutoff(),
    );
  }
}
