import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CreateInvoicePage } from './CreateInvoicePage';

const mutateAsync = vi.fn();

vi.mock('../api/invoices', () => ({
  useCreateInvoice: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('../components/SnackbarProvider', () => ({
  useSnackbar: () => ({ notify: vi.fn() }),
}));

describe('CreateInvoicePage', () => {
  it('blocks submission and shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateInvoicePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /create invoice/i }));

    const requiredErrors = await screen.findAllByText(/required/i);
    expect(requiredErrors.length).toBeGreaterThan(0);
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
