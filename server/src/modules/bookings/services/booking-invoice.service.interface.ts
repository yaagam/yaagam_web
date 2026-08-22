export interface BookingInvoicePdf {
  filename: string;
  content: Buffer;
}

export interface IBookingInvoiceService {
  createInvoicePdf(
    userId: string,
    bookingNumber: string,
  ): Promise<BookingInvoicePdf>;
}
