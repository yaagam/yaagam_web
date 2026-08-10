export interface ZohoVendorAddress {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface CreateZohoVendorInput {
  templeId: string;
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: ZohoVendorAddress;
}

export interface CreateZohoVendorResult {
  vendorId: string;
}

export interface ZohoCustomerAddress {
  attention?: string;
  address?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

export interface CreateZohoCustomerInput {
  userId: string;
  name: string;
  phone: string;
  billingAddress?: ZohoCustomerAddress;
}

export interface CreateZohoCustomerResult {
  customerId: string;
}

export interface ZohoSalesOrderLineItem {
  itemId?: string;
  name: string;
  description?: string;
  rate: number;
  quantity: number;
}

export interface CreateZohoSalesOrderInput {
  bookingId: string;
  customerId: string;
  referenceNumber: string;
  date: string;
  poojaDate: string;
  lineItems: ZohoSalesOrderLineItem[];
  notes: string;
}

export interface CreateZohoSalesOrderResult {
  salesOrderId: string;
}

export interface CreateZohoInvoiceResult {
  invoiceId: string;
}

export interface RecordZohoCustomerPaymentInput {
  bookingId: string;
  customerId: string;
  invoiceId: string;
  amount: number;
  date: string;
  referenceNumber: string;
}

export interface RecordZohoCustomerPaymentResult {
  paymentId: string;
}

interface ZohoItemDetails {
  name: string;
  description?: string;
  sellingPrice: number;
  purchasePrice: number;
}

type PoojaZohoItemReference = {
  poojaId: string;
  offeringId?: never;
  vendorId: string;
};

type OfferingZohoItemReference = {
  offeringId: string;
  poojaId?: never;
  vendorId?: never;
};

export type CreateZohoItemInput = ZohoItemDetails &
  (PoojaZohoItemReference | OfferingZohoItemReference);

export interface CreateZohoItemResult {
  itemId: string;
}

export interface UpdateZohoVendorInput extends CreateZohoVendorInput {
  vendorId: string;
}

export type UpdateZohoItemInput = CreateZohoItemInput & {
  itemId: string;
};
export interface CompleteZohoOAuthResult {
  connected: true;
}

export interface IZohoBooksService {
  createCustomer(
    input: CreateZohoCustomerInput,
  ): Promise<CreateZohoCustomerResult>;
  createSalesOrder(
    input: CreateZohoSalesOrderInput,
  ): Promise<CreateZohoSalesOrderResult>;
  createInvoiceFromSalesOrder(
    bookingId: string,
    salesOrderId: string,
  ): Promise<CreateZohoInvoiceResult>;
  recordCustomerPayment(
    input: RecordZohoCustomerPaymentInput,
  ): Promise<RecordZohoCustomerPaymentResult>;
  createVendor(input: CreateZohoVendorInput): Promise<CreateZohoVendorResult>;
  updateVendor(input: UpdateZohoVendorInput): Promise<void>;
  createItem(input: CreateZohoItemInput): Promise<CreateZohoItemResult>;
  updateItem(input: UpdateZohoItemInput): Promise<void>;
  completeOAuthCallback(
    code: string,
    state: string,
  ): Promise<CompleteZohoOAuthResult>;
}
