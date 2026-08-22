import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import PrismaService from '../../../prisma/prisma.service';
import { ZOHO_BOOKS_SERVICE } from '../../../integrations/zoho/constants/zoho-service-token.const';
import type {
  IZohoBooksService,
  ZohoInvoiceDetails,
} from '../../../integrations/zoho/services/zoho-books.service.interface';
import type {
  BookingInvoicePdf,
  IBookingInvoiceService,
} from './booking-invoice.service.interface';

type Snapshot = Record<string, unknown>;

@Injectable()
export class BookingInvoiceService implements IBookingInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ZOHO_BOOKS_SERVICE) private readonly zoho: IZohoBooksService,
  ) {}

  async createInvoicePdf(
    userId: string,
    bookingNumber: string,
  ): Promise<BookingInvoicePdf> {
    const booking = await this.prisma.booking.findFirst({
      where: { userId, bookingNumber, status: 'COMPLETED' },
      include: {
        devotees: { orderBy: { position: 'asc' } },
        offerings: true,
        occurrences: {
          where: { zohoInvoiceId: { not: null } },
          orderBy: { sequence: 'desc' },
          take: 1,
        },
      },
    });
    const invoiceId = booking?.occurrences[0]?.zohoInvoiceId;
    if (!booking || !invoiceId)
      throw new NotFoundException('Invoice is not available yet');
    const invoice = await this.zoho.getInvoice(invoiceId);
    const pooja = booking.poojaSnapshot as Snapshot;
    const translations = Array.isArray(pooja.translations)
      ? (pooja.translations as Snapshot[])
      : [];
    const poojaName = String(
      translations.find((item) => item.language === 'EN')?.name ??
        translations[0]?.name ??
        'Pooja',
    );
    const offeringAmount = booking.offerings.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    const dakshina = Number(booking.dakshinaAmount);
    const tax = invoice.tax_total;
    const poojaAmount = Math.max(
      0,
      invoice.total - tax - offeringAmount - dakshina,
    );
    const rows = [
      {
        name: poojaName,
        sub: `${booking.devotees.length} devotee${booking.devotees.length === 1 ? '' : 's'}`,
        qty: booking.devotees.length,
        amount: poojaAmount,
      },
      ...booking.offerings.map((item) => ({
        name: item.nameSnapshot,
        sub: '',
        qty: item.quantity,
        amount: Number(item.total),
      })),
      ...(dakshina > 0
        ? [{ name: 'Dakshina', sub: '', qty: 1, amount: dakshina }]
        : []),
    ];
    return {
      filename: `Yaagam-Invoice-${invoice.invoice_number}.pdf`,
      content: await this.renderPdf(
        invoice,
        booking.bookingNumber,
        booking.bookingWhatsappNumber,
        rows,
      ),
    };
  }

  private renderPdf(
    invoice: ZohoInvoiceDetails,
    bookingNumber: string,
    phone: string,
    rows: Array<{ name: string; sub: string; qty: number; amount: number }>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 38,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      const logo = join(process.cwd(), 'src', 'assets', 'logo_png.png');
      if (existsSync(logo)) doc.image(logo, 38, 32, { width: 105 });
      doc
        .fontSize(22)
        .fillColor('#0d296e')
        .text('TAX INVOICE', 610, 38, { width: 194, align: 'right' });
      doc
        .fontSize(9)
        .fillColor('#4b5563')
        .text(`Invoice No: ${invoice.invoice_number}`, 330, 70, {
          align: 'right',
        })
        .text(`Invoice Date: ${invoice.date}`, { align: 'right' })
        .text(`Booking ID: ${bookingNumber}`, { align: 'right' });
      doc.moveTo(38, 112).lineTo(804, 112).strokeColor('#e67e22').stroke();
      doc
        .fontSize(11)
        .fillColor('#0d296e')
        .text('Billed To', 38, 126)
        .fontSize(9)
        .fillColor('#374151')
        .text(invoice.customer_name || 'Yaagam Customer')
        .text(phone)
        .text(invoice.gst_no ? `GSTIN: ${invoice.gst_no}` : '');
      const top = 190;
      const widths = [260, 50, 95, 114];
      const xs = [38, 298, 348, 443];
      doc.rect(38, top, 766, 26).fill('#0d296e');
      [
        'Description',
        'Qty',
        'Rate',
        'Taxable',
        'CGST',
        'SGST',
        'IGST',
        'Total',
      ].forEach((label, i) =>
        doc
          .fillColor('white')
          .fontSize(9)
          .text(label, xs[i] + 6, top + 8, {
            width: widths[i] - 12,
            align: i ? 'right' : 'left',
          }),
      );
      let y = top + 26;
      for (const row of rows) {
        const h = row.sub ? 38 : 28;
        doc.rect(38, y, 766, h).strokeColor('#d1d5db').stroke();
        doc
          .fillColor('#111827')
          .fontSize(9)
          .text(row.name, 44, y + 7, { width: 245 });
        if (row.sub)
          doc
            .fontSize(7)
            .fillColor('#6b7280')
            .text(row.sub, 44, y + 21, { width: 245 });
        const rate = row.qty ? row.amount / row.qty : row.amount;
        const taxes = [
          ...(invoice.taxes ?? []),
          ...invoice.line_items.flatMap((item) => item.taxes ?? []),
        ];
        const taxValue = (name: string) =>
          taxes
            .filter((item) =>
              (item.tax_name ?? '').toUpperCase().includes(name),
            )
            .reduce((sum, item) => sum + Number(item.tax_amount ?? 0), 0);
        const cgst = row === rows[0] ? taxValue('CGST') : 0;
        const sgst = row === rows[0] ? taxValue('SGST') : 0;
        const igst = row === rows[0] ? taxValue('IGST') : 0;
        doc
          .fillColor('#111827')
          .fontSize(9)
          .text(String(row.qty), xs[1] + 6, y + 9, {
            width: widths[1] - 12,
            align: 'right',
          })
          .text(`INR ${rate.toFixed(2)}`, xs[2] + 6, y + 9, {
            width: widths[2] - 12,
            align: 'right',
          })
          .text(`INR ${row.amount.toFixed(2)}`, xs[3] + 6, y + 9, {
            width: widths[3] - 12,
            align: 'right',
          });
        y += h;
      }
      y += 16;
      const taxMap = new Map<string, number>();
      for (const item of [
        ...(invoice.taxes ?? []),
        ...invoice.line_items.flatMap((item) => item.taxes ?? []),
      ]) {
        const name = (item.tax_name || 'GST').toUpperCase();
        taxMap.set(
          name,
          (taxMap.get(name) || 0) + Number(item.tax_amount || 0),
        );
      }
      const summary: Array<[string, number]> = [
        ['Subtotal', invoice.sub_total],
        ...[...taxMap].map(
          ([name, value]) => [name, value] as [string, number],
        ),
        ...(taxMap.size === 0 && invoice.tax_total > 0
          ? [['GST', invoice.tax_total] as [string, number]]
          : []),
        ['Total', invoice.total],
      ];
      for (const [label, value] of summary) {
        doc
          .fontSize(label === 'Total' ? 11 : 9)
          .fillColor(label === 'Total' ? '#0d296e' : '#374151')
          .text(label, 560, y, { width: 100, align: 'right' })
          .text(`INR ${Number(value).toFixed(2)}`, 440, y, {
            width: 134,
            align: 'right',
          });
        y += 20;
      }
      doc.moveTo(38, 520).lineTo(804, 520).strokeColor('#d1d5db').stroke();
      doc
        .fontSize(8)
        .fillColor('#6b7280')
        .text(
          'This is a computer-generated invoice. Authorised signature will be added here.',
          38,
          744,
          { width: 300 },
        )
        .text('For YAAGAM DEV-TECH PVT. LTD', 350, 534, { align: 'right' });
      doc.end();
    });
  }
}
