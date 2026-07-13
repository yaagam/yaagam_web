import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ContactMethod } from '@prisma/client';
import { SupportService } from './support.service';

const ticket = {
  id: 'ticket-id',
  ticketNumber: 'SUP-000001',
  userId: null,
  name: 'Devotee',
  phoneNumber: '9876543210',
  contactMethod: ContactMethod.WHATSAPP,
  problem: 'Need help with my booking',
  status: 'OPEN',
  createdAt: new Date('2026-07-04T00:00:00.000Z'),
  updatedAt: new Date('2026-07-04T00:00:00.000Z'),
  resolvedAt: null,
  resolvedBy: null,
};

describe('SupportService', () => {
  function createService() {
    const supportTicketRepository = {
      create: jest.fn().mockResolvedValue(ticket),
      findRecentUnresolvedByPhoneNumber: jest.fn().mockResolvedValue(null),
    };

    return {
      service: new SupportService(supportTicketRepository as never),
      supportTicketRepository,
    };
  }

  it('returns the predefined support FAQs', () => {
    const { service } = createService();

    expect(service.getFaqs()).toEqual([
      {
        id: 'booking',
        question: 'How do I book a pooja?',
        answer: '...',
      },
      {
        id: 'payment',
        question: 'What payment methods are available?',
        answer: '...',
      },
      {
        id: 'weekly',
        question: 'How do weekly poojas work?',
        answer: '...',
      },
      {
        id: 'refund',
        question: 'What is the refund policy?',
        answer: '...',
      },
      {
        id: 'contact',
        question: 'How can I contact support?',
        answer: '...',
      },
    ]);
  });

  it('creates a support ticket and returns the public acknowledgement', async () => {
    const { service, supportTicketRepository } = createService();
    const dto = {
      name: 'Devotee',
      phoneNumber: '9876543210',
      contactMethod: ContactMethod.WHATSAPP,
      problem: 'Need help with my booking',
    };

    await expect(service.createTicket(dto, 'user-id')).resolves.toEqual({
      success: true,
      ticketNumber: 'SUP-000001',
      message: 'Our support team will contact you within 24 hours.',
    });
    expect(
      supportTicketRepository.findRecentUnresolvedByPhoneNumber,
    ).toHaveBeenCalledWith('9876543210', expect.any(Date));
    expect(supportTicketRepository.create).toHaveBeenCalledWith(dto, 'user-id');
  });

  it('rejects support ticket creation without a logged-in user', async () => {
    const { service, supportTicketRepository } = createService();
    const dto = {
      name: 'Devotee',
      phoneNumber: '9876543210',
      contactMethod: ContactMethod.WHATSAPP,
      problem: 'Need help with my booking',
    };

    await expect(service.createTicket(dto, '')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(
      supportTicketRepository.findRecentUnresolvedByPhoneNumber,
    ).not.toHaveBeenCalled();
    expect(supportTicketRepository.create).not.toHaveBeenCalled();
  });
  it('returns available when no recent unresolved ticket exists', async () => {
    const { service, supportTicketRepository } = createService();

    await expect(
      service.checkTicketAvailability('9876543210'),
    ).resolves.toEqual({
      canCreate: true,
      message: null,
    });
    expect(
      supportTicketRepository.findRecentUnresolvedByPhoneNumber,
    ).toHaveBeenCalledWith('9876543210', expect.any(Date));
  });

  it('returns unavailable when a recent unresolved ticket exists', async () => {
    const { service, supportTicketRepository } = createService();
    supportTicketRepository.findRecentUnresolvedByPhoneNumber.mockResolvedValue(
      ticket,
    );

    await expect(
      service.checkTicketAvailability('9876543210'),
    ).resolves.toEqual({
      canCreate: false,
      message:
        'Pranam. A seva request is already open for this number. Our team will contact you within 24 hours, and you may share any additional concern with them then.',
    });
  });
  it('rejects a new ticket when a recent unresolved ticket already exists', async () => {
    const { service, supportTicketRepository } = createService();
    supportTicketRepository.findRecentUnresolvedByPhoneNumber.mockResolvedValue(
      ticket,
    );
    const dto = {
      name: 'Devotee',
      phoneNumber: '9876543210',
      contactMethod: ContactMethod.WHATSAPP,
      problem: 'Need help with my booking',
    };

    await expect(service.createTicket(dto, 'user-id')).rejects.toThrow(
      ConflictException,
    );
    await expect(service.createTicket(dto, 'user-id')).rejects.toThrow(
      'Pranam. A seva request is already open for this number. Our team will contact you within 24 hours, and you may share any additional concern with them then.',
    );
    expect(supportTicketRepository.create).not.toHaveBeenCalled();
  });
});
