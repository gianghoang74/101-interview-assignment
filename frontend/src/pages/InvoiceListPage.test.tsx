import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { InvoiceListPage } from './InvoiceListPage';
import type { Invoice } from '../api/types';

const sample: Invoice = {
  invoiceId: 'id-1',
  invoiceNumber: 'INV-TEST-1',
  invoiceReference: null,
  invoiceDate: '2026-06-01',
  dueDate: '2026-06-10',
  currency: 'AUD',
  currencySymbol: 'AU$',
  description: null,
  status: 'Overdue',
  invoiceSubTotal: 1000,
  totalTax: 100,
  totalDiscount: 0,
  totalAmount: 1100,
  totalPaid: 0,
  balanceAmount: 1100,
  customer: {
    id: 'c1',
    fullname: 'Paul',
    email: 'paul@example.com',
    mobileNumber: null,
    address: null,
  },
  items: [{ id: 'it1', name: 'Widget', quantity: 2, rate: 500 }],
  createdAt: '2026-06-01T00:00:00.000Z',
  createdBy: 'u1',
};

const useInvoicesMock = vi.fn();

vi.mock('../api/invoices', () => ({
  useInvoices: (params: unknown) => useInvoicesMock(params),
}));

describe('InvoiceListPage', () => {
  it('renders invoice rows returned by the API', () => {
    useInvoicesMock.mockReturnValue({
      data: { data: [sample], paging: { page: 1, pageSize: 10, total: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <InvoiceListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('INV-TEST-1')).toBeInTheDocument();
    expect(screen.getByText('Paul')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('AU$1100.00')).toBeInTheDocument();
  });
});
