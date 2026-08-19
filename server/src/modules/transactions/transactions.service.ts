import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import PrismaService from '../../prisma/prisma.service';
import { RAZORPAY_CLIENT } from '../../integrations/razorpay/constants/razorpay-service-token.const';
import type { IRazorpayClient } from '../../integrations/razorpay/interfaces/razorpay-client.interface';
import { PAYMENT_RECONCILIATION_SERVICE } from './constants/payment.const';
import { VerifyRazorpayPaymentDto } from './dtos/verify-razorpay-payment.dto';
import type { IPaymentReconciliationService } from './services/payment-reconciliation.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(RAZORPAY_CLIENT)
    private readonly _razorpayClientService: IRazorpayClient,
    @Inject(PAYMENT_RECONCILIATION_SERVICE)
    private readonly _paymentReconciliationService: IPaymentReconciliationService,
  ) {}

  async verifyRazorpayPayment(
    userId: string,
    dto: VerifyRazorpayPaymentDto,
  ): Promise<{
    bookingId: string;
    transactionId: string;
    status: PaymentStatus;
    bookingStatus: BookingStatus;
  }> {
    const transaction = await this._prismaService.transaction.findFirst({
      where: {
        publicId: dto.transactionReference,
        booking: { publicId: dto.bookingReference },
      },
      include: { booking: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.booking.userId !== userId) {
      throw new ForbiddenException('Payment does not belong to this user');
    }

    const expectedOrderId =
      dto.razorpay_order_id ?? transaction.providerOrderId ?? undefined;
    const isSignatureValid = this._razorpayClientService.verifySignature({
      orderId: expectedOrderId,
      paymentId: dto.razorpay_payment_id,
      subscriptionId: dto.razorpay_subscription_id,
      signature: dto.razorpay_signature,
    });

    if (!isSignatureValid) {
      await this._markPaymentFailed(transaction.id, transaction.bookingId);
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    if (
      transaction.providerOrderId &&
      dto.razorpay_order_id &&
      transaction.providerOrderId !== dto.razorpay_order_id
    ) {
      await this._markPaymentFailed(transaction.id, transaction.bookingId);
      throw new BadRequestException(
        'Razorpay order does not match transaction',
      );
    }

    await this._prismaService.$transaction([
      this._prismaService.transaction.update({
        where: { id: transaction.id },
        data: {
          providerOrderId: dto.razorpay_order_id ?? transaction.providerOrderId,
          providerPaymentId: dto.razorpay_payment_id,
          status: PaymentStatus.PROCESSING,
        },
      }),
    ]);

    await this._paymentReconciliationService.reconcileTransaction(
      transaction.id,
    );
    const updated = await this._prismaService.transaction.findUniqueOrThrow({
      where: { id: transaction.id },
      include: { booking: true },
    });

    return {
      bookingId: transaction.bookingId,
      transactionId: transaction.id,
      status: updated.status,
      bookingStatus: updated.booking.status,
    };
  }

  private async _markPaymentFailed(
    transactionId: string,
    bookingId: string,
  ): Promise<void> {
    await this._prismaService.$transaction([
      this._prismaService.transaction.update({
        where: { id: transactionId },
        data: { status: PaymentStatus.FAILED },
      }),
      this._prismaService.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PAYMENT_FAILED },
      }),
    ]);
  }
}
