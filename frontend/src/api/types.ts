export type InvoiceStatus = 'Draft' | 'Pending' | 'Paid' | 'Overdue';

export interface AuthUser {
  id: string;
  email: string;
  fullname: string;
  createdAt: string;
}

export interface CustomerView {
  id: string;
  fullname: string;
  email: string;
  mobileNumber: string | null;
  address: string | null;
}

export interface InvoiceItemView {
  id: string;
  name: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceReference: string | null;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  description: string | null;
  status: InvoiceStatus;
  invoiceSubTotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  customer: CustomerView;
  items: InvoiceItemView[];
  createdAt: string;
  createdBy: string;
}

export interface Paging {
  page: number;
  pageSize: number;
  total: number;
}

export interface InvoiceListResponse {
  data: Invoice[];
  paging: Paging;
}

export type SortBy = 'invoiceDate' | 'dueDate' | 'totalAmount';
export type Ordering = 'ASC' | 'DESC';

export interface ListInvoicesParams {
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
  ordering?: Ordering;
  status?: InvoiceStatus;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateInvoicePayload {
  customer: {
    fullname: string;
    email: string;
    mobileNumber?: string;
    address?: string;
  };
  invoiceNumber: string;
  invoiceReference?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  description?: string;
  item: { name: string; quantity: number; rate: number };
  tax?: number;
  discount?: number;
}
