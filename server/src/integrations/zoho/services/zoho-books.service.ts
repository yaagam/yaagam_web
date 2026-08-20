import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { timingSafeEqual } from 'node:crypto';
import type {
  CreateZohoCustomerInput,
  CreateZohoCustomerResult,
  CreateZohoItemInput,
  CreateZohoItemResult,
  CreateZohoSalesOrderInput,
  CreateZohoSalesOrderResult,
  CreateZohoInvoiceResult,
  RecordZohoCustomerPaymentInput,
  RecordZohoCustomerPaymentResult,
  UpdateZohoCustomerInput,
  CreateZohoVendorInput,
  CreateZohoVendorResult,
  CreateZohoVendorBillInput,
  CreateZohoVendorBillResult,
  CreateZohoRazorpayChargesExpenseInput,
  CreateZohoRazorpayChargesExpenseResult,
  IZohoBooksService,
  UpdateZohoItemInput,
  UpdateZohoVendorInput,
} from './zoho-books.service.interface';

interface ZohoTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}

interface ZohoContactResponse {
  code?: number;
  message?: string;
  contact?: { contact_id?: string };
}

interface ZohoItemResponse {
  code?: number;
  message?: string;
  item?: { item_id?: string };
  items?: Array<{ item_id?: string; sku?: string }>;
}

interface ZohoSalesOrderResponse {
  code?: number;
  message?: string;
  salesorder?: { salesorder_id?: string };
}

interface ZohoInvoiceResponse {
  code?: number;
  message?: string;
  invoice?: { invoice_id?: string };
}

interface ZohoCustomerPaymentResponse {
  code?: number;
  message?: string;
  payment?: { payment_id?: string };
}

interface ZohoBillResponse {
  code?: number;
  message?: string;
  bill?: { bill_id?: string };
  bills?: Array<{
    bill_id?: string;
    bill_number?: string;
    reference_number?: string;
  }>;
}

interface ZohoExpenseResponse {
  code?: number;
  message?: string;
  expense?: { expense_id?: string };
  expenses?: Array<{ expense_id?: string; reference_number?: string }>;
}

interface ZohoChartOfAccountsResponse {
  code?: number;
  message?: string;
  chartofaccounts?: Array<{ account_id?: string; account_name?: string }>;
}

interface CachedAccessToken {
  value: string;
  expiresAt: number;
}

interface ZohoItemLogContext {
  poojaId?: string;
  offeringId?: string;
  vendorId?: string;
}

@Injectable()
export class ZohoBooksService implements IZohoBooksService {
  private _accessToken?: CachedAccessToken;
  private _runtimeRefreshToken?: string;

  constructor(
    private readonly _configService: ConfigService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(ZohoBooksService.name);
  }

  async completeOAuthCallback(
    code: string,
    state: string,
  ): Promise<{ connected: true }> {
    if (!this._matchesOAuthState(state)) {
      throw new UnauthorizedException('Invalid Zoho OAuth state');
    }
    const apiBaseUrl =
      this._configService.getOrThrow<string>('ZOHO_API_BASE_URL');
    const parameters = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this._configService.getOrThrow<string>('ZOHO_CLIENT_ID'),
      client_secret:
        this._configService.getOrThrow<string>('ZOHO_CLIENT_SECRET'),
      redirect_uri: this._configService.getOrThrow<string>('ZOHO_REDIRECT_URI'),
      code,
    });
    const response = await fetch(
      `${this._getAccountsBaseUrl(apiBaseUrl)}/oauth/v2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: parameters,
        signal: AbortSignal.timeout(15_000),
      },
    );
    const body = (await response.json().catch(() => ({}))) as ZohoTokenResponse;
    if (!response.ok || !body.access_token || !body.refresh_token) {
      throw new Error(
        this._getErrorMessage(
          response.status,
          body.error || 'Zoho OAuth token exchange failed',
        ),
      );
    }
    const expiresIn = Math.max(60, body.expires_in ?? 3600);
    this._runtimeRefreshToken = body.refresh_token;
    this._accessToken = {
      value: body.access_token,
      expiresAt: Date.now() + (expiresIn - 30) * 1000,
    };
    this._logger.info('Zoho Books OAuth connection completed');
    return { connected: true };
  }
  async createVendor(
    input: CreateZohoVendorInput,
  ): Promise<CreateZohoVendorResult> {
    const payload = this._removeEmptyValues({
      contact_name: input.name,
      company_name: input.name,
      contact_type: 'vendor',
      email: input.email,
      phone: input.phone,
      gst_no: input.gstNumber,
      billing_address: this._removeEmptyValues(input.address ?? {}),
    });

    this._logger.info(
      { templeId: input.templeId, zohoRequest: payload },
      'creating Zoho Books vendor',
    );

    const response = await this._request<ZohoContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch((error: unknown) => {
      this._logger.error(
        { templeId: input.templeId, err: error },
        'Zoho Books vendor creation failed',
      );
      throw error;
    });
    const vendorId = response.contact?.contact_id;

    this._logger.info(
      { templeId: input.templeId, zohoResponse: response, vendorId },
      'Zoho Books vendor response received',
    );

    if (!vendorId) {
      throw new Error(
        response.message || 'Zoho Books did not return a vendor ID',
      );
    }

    return { vendorId };
  }

  async createCustomer(
    input: CreateZohoCustomerInput,
  ): Promise<CreateZohoCustomerResult> {
    const payload = this._createCustomerPayload(input);
    this._logger.info(
      { userId: input.userId, zohoRequest: payload },
      'creating Zoho Books customer',
    );
    const response = await this._request<ZohoContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const customerId = response.contact?.contact_id;
    if (!customerId) {
      throw new Error(
        response.message || 'Zoho Books did not return a customer ID',
      );
    }
    this._logger.info(
      { userId: input.userId, customerId },
      'Zoho Books customer created',
    );
    return { customerId };
  }

  async updateCustomer(input: UpdateZohoCustomerInput): Promise<void> {
    const payload = this._createCustomerPayload(input);
    await this._request<ZohoContactResponse>(
      `/contacts/${encodeURIComponent(input.customerId)}`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    this._logger.info(
      { userId: input.userId, customerId: input.customerId },
      'Zoho Books customer updated',
    );
  }

  async createSalesOrder(
    input: CreateZohoSalesOrderInput,
  ): Promise<CreateZohoSalesOrderResult> {
    const payload = {
      customer_id: input.customerId,
      reference_number: input.referenceNumber,
      date: input.date,
      shipment_date: input.poojaDate,
      is_inclusive_tax: input.isInclusiveTax,
      line_items: input.lineItems.map((item, itemOrder) =>
        this._removeEmptyValues({
          item_order: itemOrder,
          item_id: item.itemId,
          name: item.name,
          rate: item.rate,
          quantity: item.quantity,
          tax_exemption_id: item.taxExemptionId,
        }),
      ),
    };
    this._logger.info(
      { bookingId: input.bookingId, zohoRequest: payload },
      'creating Zoho Books booking sales order',
    );
    const response = await this._request<ZohoSalesOrderResponse>(
      '/salesorders',
      { method: 'POST', body: JSON.stringify(payload) },
    );
    const salesOrderId = response.salesorder?.salesorder_id;
    if (!salesOrderId) {
      throw new Error(
        response.message || 'Zoho Books did not return a sales order ID',
      );
    }
    this._logger.info(
      { bookingId: input.bookingId, salesOrderId },
      'Zoho Books booking sales order created',
    );
    return { salesOrderId };
  }

  async createInvoiceFromSalesOrder(
    bookingId: string,
    salesOrderId: string,
  ): Promise<CreateZohoInvoiceResult> {
    const response = await this._request<ZohoInvoiceResponse>(
      `/invoices/fromsalesorder?salesorder_id=${encodeURIComponent(salesOrderId)}`,
      { method: 'POST' },
    );
    const invoiceId = response.invoice?.invoice_id;
    if (!invoiceId) {
      throw new Error(
        response.message || 'Zoho Books did not return invoice ID',
      );
    }
    this._logger.info(
      { bookingId, salesOrderId, invoiceId },
      'Zoho Books invoice created from booking sales order',
    );
    return { invoiceId };
  }

  async recordCustomerPayment(
    input: RecordZohoCustomerPaymentInput,
  ): Promise<RecordZohoCustomerPaymentResult> {
    const payload = {
      customer_id: input.customerId,
      payment_mode: 'Razorpay',
      amount: input.amount,
      date: input.date,
      reference_number: input.referenceNumber,
      invoices: [
        {
          invoice_id: input.invoiceId,
          amount_applied: input.amount,
        },
      ],
    };
    const response = await this._request<ZohoCustomerPaymentResponse>(
      '/customerpayments',
      { method: 'POST', body: JSON.stringify(payload) },
    );
    const paymentId = response.payment?.payment_id;
    if (!paymentId) {
      throw new Error(
        response.message || 'Zoho Books did not return payment ID',
      );
    }
    this._logger.info(
      { bookingId: input.bookingId, invoiceId: input.invoiceId, paymentId },
      'Zoho Books customer payment recorded',
    );
    return { paymentId };
  }

  async createRazorpayChargesExpense(
    input: CreateZohoRazorpayChargesExpenseInput,
  ): Promise<CreateZohoRazorpayChargesExpenseResult> {
    const existingExpenseId = await this._findExpenseByReference(
      input.referenceNumber,
    );
    if (existingExpenseId) return { expenseId: existingExpenseId };

    const chargesAccountId = this._configService
      .getOrThrow<string>('ZOHO_RAZORPAY_CHARGES_ACCOUNT_ID')
      .trim();
    if (!chargesAccountId) {
      throw new Error('ZOHO_RAZORPAY_CHARGES_ACCOUNT_ID must not be empty');
    }
    const configuredClearingAccountId = this._configService
      .get<string>('ZOHO_RAZORPAY_CLEARING_ACCOUNT_ID')
      ?.trim();
    const clearingAccountId =
      configuredClearingAccountId ??
      (await this._findAccountIdByName('Razorpay Clearing'));

    const payload = {
      account_id: chargesAccountId,
      paid_through_account_id: clearingAccountId,
      date: input.date,
      amount: input.amount,
      reference_number: input.referenceNumber,
      description: `Razorpay settlement charges (GST included: ?${input.taxAmount.toFixed(2)})`,
      is_inclusive_tax: true,
      is_billable: false,
    };
    const response = await this._request<ZohoExpenseResponse>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const expenseId = response.expense?.expense_id;
    if (!expenseId) {
      throw new Error(
        response.message || 'Zoho Books did not return expense ID',
      );
    }
    this._logger.info(
      { settlementId: input.settlementId, expenseId },
      'Zoho Books Razorpay charges expense created',
    );
    return { expenseId };
  }

  async createVendorBill(
    input: CreateZohoVendorBillInput,
  ): Promise<CreateZohoVendorBillResult> {
    const existingBillId = await this._findBillByReference(
      input.referenceNumber,
    );
    if (existingBillId) return { billId: existingBillId };

    const purchaseAccountId = this._configService.getOrThrow<string>(
      'ZOHO_PURCHASE_ACCOUNT_ID',
    );
    const payload = {
      vendor_id: input.vendorId,
      bill_number: input.referenceNumber,
      reference_number: input.referenceNumber,
      date: input.date,
      line_items: input.lineItems.map((item, itemOrder) =>
        this._removeEmptyValues({
          item_order: itemOrder,
          item_id: item.itemId,
          account_id: purchaseAccountId,
          name: item.name,
          rate: item.rate,
          quantity: item.quantity,
        }),
      ),
    };
    const response = await this._request<ZohoBillResponse>('/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const billId = response.bill?.bill_id;
    if (!billId) {
      throw new Error(response.message || 'Zoho Books did not return bill ID');
    }
    this._logger.info(
      { bookingId: input.bookingId, vendorId: input.vendorId, billId },
      'Zoho Books temple payable bill created',
    );
    return { billId };
  }

  async createItem(input: CreateZohoItemInput): Promise<CreateZohoItemResult> {
    const existingItemId = await this._findItemBySku(
      this._createItemSku(input),
    );
    if (existingItemId) {
      await this.updateItem({ ...input, itemId: existingItemId });
      return { itemId: existingItemId };
    }

    const payload = this._createItemPayload(input);
    const context = this._createItemLogContext(input);

    this._logger.info(
      {
        ...context,
        zohoRequest: payload,
      },
      'creating Zoho Books item',
    );

    const response = await this._request<ZohoItemResponse>('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch((error: unknown) => {
      this._logger.error(
        { ...context, err: error },
        'Zoho Books item creation failed',
      );
      throw error;
    });
    const itemId = response.item?.item_id;

    this._logger.info(
      { ...context, zohoResponse: response, itemId },
      'Zoho Books item response received',
    );

    if (!itemId) {
      throw new Error(
        response.message || 'Zoho Books did not return an item ID',
      );
    }

    return { itemId };
  }
  async updateVendor(input: UpdateZohoVendorInput): Promise<void> {
    const payload = this._removeEmptyValues({
      contact_name: input.name,
      company_name: input.name,
      contact_type: 'vendor',
      email: input.email,
      phone: input.phone,
      gst_no: input.gstNumber,
      billing_address: this._removeEmptyValues(input.address ?? {}),
    });
    this._logger.info(
      {
        templeId: input.templeId,
        vendorId: input.vendorId,
        zohoRequest: payload,
      },
      'updating Zoho Books vendor',
    );
    const response = await this._request<ZohoContactResponse>(
      `/contacts/${encodeURIComponent(input.vendorId)}`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    this._logger.info(
      {
        templeId: input.templeId,
        vendorId: input.vendorId,
        zohoResponse: response,
      },
      'Zoho Books vendor updated',
    );
  }

  async updateItem(input: UpdateZohoItemInput): Promise<void> {
    const payload = this._createItemPayload(input);
    const context = this._createItemLogContext(input);
    this._logger.info(
      {
        ...context,
        itemId: input.itemId,
        zohoRequest: payload,
      },
      'updating Zoho Books item',
    );
    const response = await this._request<ZohoItemResponse>(
      `/items/${encodeURIComponent(input.itemId)}`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    this._logger.info(
      { ...context, itemId: input.itemId, zohoResponse: response },
      'Zoho Books item updated',
    );
  }

  private async _request<T>(
    path: string,
    init: RequestInit,
    retryUnauthorized = true,
  ): Promise<T> {
    const accessToken = await this._getAccessToken();
    const organizationId = this._configService.getOrThrow<string>(
      'ZOHO_ORGANIZATION_ID',
    );
    const baseUrl = this._normalizeUrl(
      this._configService.getOrThrow<string>('ZOHO_API_BASE_URL'),
    );
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set('organization_id', organizationId);

    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        ...init.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 401 && retryUnauthorized) {
      this._accessToken = undefined;
      return this._request<T>(path, init, false);
    }

    const body = (await response.json().catch(() => ({}))) as T & {
      code?: number;
      message?: string;
    };
    if (!response.ok || (body.code !== undefined && body.code !== 0)) {
      throw new Error(this._getErrorMessage(response.status, body.message));
    }

    return body;
  }

  private async _findExpenseByReference(
    referenceNumber: string,
  ): Promise<string | undefined> {
    const response = await this._request<ZohoExpenseResponse>(
      `/expenses?reference_number=${encodeURIComponent(referenceNumber)}`,
      { method: 'GET' },
    );
    return response.expenses?.find(
      (expense) => expense.reference_number === referenceNumber,
    )?.expense_id;
  }

  private async _findAccountIdByName(name: string): Promise<string> {
    const response = await this._request<ZohoChartOfAccountsResponse>(
      `/chartofaccounts?account_name=${encodeURIComponent(name)}`,
      { method: 'GET' },
    );
    const accountId = response.chartofaccounts?.find(
      (account) => account.account_name === name,
    )?.account_id;
    if (!accountId) throw new Error(`Zoho Books account not found: ${name}`);
    return accountId;
  }

  private async _findBillByReference(
    referenceNumber: string,
  ): Promise<string | undefined> {
    const response = await this._request<ZohoBillResponse>(
      `/bills?reference_number=${encodeURIComponent(referenceNumber)}`,
      { method: 'GET' },
    );
    return response.bills?.find(
      (bill) =>
        bill.reference_number === referenceNumber ||
        bill.bill_number === referenceNumber,
    )?.bill_id;
  }
  private async _findItemBySku(sku: string): Promise<string | undefined> {
    const response = await this._request<ZohoItemResponse>(
      `/items?sku=${encodeURIComponent(sku)}`,
      { method: 'GET' },
    );
    return response.items?.find((item) => item.sku === sku)?.item_id;
  }

  private _createItemSku(input: CreateZohoItemInput): string {
    return input.poojaId
      ? `YAAGAM-POOJA-${input.poojaId}`
      : `YAAGAM-OFFERING-${input.offeringId}`;
  }

  private _createItemPayload(input: CreateZohoItemInput): object {
    const taxExemptionId = this._configService
      .getOrThrow<string>('ZOHO_NON_GST_TAX_EXEMPTION_ID')
      .trim();
    if (!taxExemptionId) {
      throw new Error('ZOHO_NON_GST_TAX_EXEMPTION_ID must not be empty');
    }

    return this._removeEmptyValues({
      name: input.name,
      sku: this._createItemSku(input),
      rate: input.sellingPrice,
      product_type: 'service',
      item_type: 'sales_and_purchases',
      is_taxable: false,
      tax_exemption_id: taxExemptionId,
      purchase_rate: input.purchasePrice,
      purchase_account_id: this._configService.getOrThrow<string>(
        'ZOHO_PURCHASE_ACCOUNT_ID',
      ),
      vendor_id: input.vendorId,
    });
  }

  private _createCustomerPayload(input: CreateZohoCustomerInput): object {
    return this._removeEmptyValues({
      contact_name: input.name,
      contact_type: 'customer',
      customer_sub_type: 'individual',
      phone: input.phone,
      mobile: input.phone,
      billing_address: input.billingAddress
        ? this._removeEmptyValues(input.billingAddress)
        : undefined,
      shipping_address: input.shippingAddress
        ? this._removeEmptyValues(input.shippingAddress)
        : undefined,
      contact_persons: [
        this._removeEmptyValues({
          first_name: input.name,
          phone: input.phone,
          mobile: input.phone,
          is_primary_contact: true,
        }),
      ],
    });
  }

  private _createItemLogContext(
    input: CreateZohoItemInput,
  ): ZohoItemLogContext {
    return this._removeEmptyValues({
      poojaId: input.poojaId,
      offeringId: input.offeringId,
      vendorId: input.vendorId,
    });
  }

  private async _getAccessToken(): Promise<string> {
    if (this._accessToken && this._accessToken.expiresAt > Date.now()) {
      return this._accessToken.value;
    }

    const clientId = this._configService.getOrThrow<string>('ZOHO_CLIENT_ID');
    const clientSecret =
      this._configService.getOrThrow<string>('ZOHO_CLIENT_SECRET');
    const refreshToken =
      this._configService.getOrThrow<string>('ZOHO_REFRESH_TOKEN');
    const apiBaseUrl =
      this._configService.getOrThrow<string>('ZOHO_API_BASE_URL');
    const parameters = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    const response = await fetch(
      `${this._getAccountsBaseUrl(apiBaseUrl)}/oauth/v2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: parameters,
        signal: AbortSignal.timeout(15_000),
      },
    );
    const body = (await response.json().catch(() => ({}))) as ZohoTokenResponse;

    if (!response.ok || !body.access_token) {
      throw new Error(
        this._getErrorMessage(
          response.status,
          body.error || 'Unable to refresh Zoho access token',
        ),
      );
    }

    const expiresIn = Math.max(60, body.expires_in ?? 3600);
    this._accessToken = {
      value: body.access_token,
      expiresAt: Date.now() + (expiresIn - 30) * 1000,
    };
    return body.access_token;
  }

  private _matchesOAuthState(value: string): boolean {
    const expected = this._configService
      .getOrThrow<string>('ZOHO_OAUTH_STATE')
      .trim();
    const actualBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }
  private _getAccountsBaseUrl(apiBaseUrl: string): string {
    const url = new URL(apiBaseUrl);
    url.hostname = url.hostname.replace('www.zohoapis.', 'accounts.zoho.');
    url.hostname = url.hostname.replace('zohoapis.', 'accounts.zoho.');
    return `${url.protocol}//${url.hostname}`;
  }

  private _getErrorMessage(status: number, providerMessage?: string): string {
    const messages: Record<number, string> = {
      401: 'Zoho authentication failed',
      403: 'Zoho Books access is forbidden',
      404: 'Zoho Books resource was not found',
      429: 'Zoho Books rate limit exceeded',
      500: 'Zoho Books is temporarily unavailable',
    };
    const message = messages[status] ?? `Zoho Books request failed (${status})`;
    return providerMessage ? `${message}: ${providerMessage}` : message;
  }

  private _normalizeUrl(value: string): string {
    return value.trim().replace(/\/+$/g, '');
  }

  private _removeEmptyValues<T extends object>(value: T): T {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(([, item]) => {
        if (item === undefined || item === null || item === '') return false;
        return !(typeof item === 'object' && Object.keys(item).length === 0);
      }),
    ) as T;
  }
}
