import { Chip } from '@mui/material';
import type { InvoiceStatus } from '../api/types';

const COLOR: Record<
  InvoiceStatus,
  'default' | 'info' | 'success' | 'error'
> = {
  Draft: 'default',
  Pending: 'info',
  Paid: 'success',
  Overdue: 'error',
};

export function StatusChip({ status }: { status: InvoiceStatus }) {
  return (
    <Chip
      label={status}
      color={COLOR[status]}
      size="small"
      variant={status === 'Draft' ? 'outlined' : 'filled'}
    />
  );
}
