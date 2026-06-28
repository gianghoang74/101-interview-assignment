import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiErrorMessage } from '../api/client';
import { useInvoice } from '../api/invoices';
import { StatusChip } from '../components/StatusChip';
import { formatDate } from '../utils/formatDate';

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError, error } = useInvoice(id);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !invoice) {
    return <Alert severity="error">{apiErrorMessage(error) || 'Invoice not found'}</Alert>;
  }

  const money = (value: number) => `${invoice.currencySymbol}${value.toFixed(2)}`;

  return (
    <Box>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        ← Back
      </Button>
      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            <Box>
              <Typography variant="h5">{invoice.invoiceNumber}</Typography>
              {invoice.invoiceReference && (
                <Typography variant="body2" color="text.secondary">
                  Ref: {invoice.invoiceReference}
                </Typography>
              )}
            </Box>
            <StatusChip status={invoice.status} />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Customer
              </Typography>
              <Typography>{invoice.customer.fullname}</Typography>
              <Typography variant="body2">{invoice.customer.email}</Typography>
              {invoice.customer.mobileNumber && (
                <Typography variant="body2">{invoice.customer.mobileNumber}</Typography>
              )}
              {invoice.customer.address && (
                <Typography variant="body2">{invoice.customer.address}</Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Details
              </Typography>
              <Typography variant="body2">Invoice date: {formatDate(invoice.invoiceDate)}</Typography>
              <Typography variant="body2">Due date: {formatDate(invoice.dueDate)}</Typography>
              <Typography variant="body2">Currency: {invoice.currency}</Typography>
              {invoice.description && (
                <Typography variant="body2">{invoice.description}</Typography>
              )}
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{money(item.rate)}</TableCell>
                  <TableCell align="right">{money(item.quantity * item.rate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={0.5} sx={{ maxWidth: 320, ml: 'auto' }}>
            <SummaryRow label="Subtotal" value={money(invoice.invoiceSubTotal)} />
            <SummaryRow label="Tax" value={money(invoice.totalTax)} />
            <SummaryRow label="Discount" value={`- ${money(invoice.totalDiscount)}`} />
            <Divider />
            <SummaryRow label="Total" value={money(invoice.totalAmount)} bold />
            <SummaryRow label="Paid" value={money(invoice.totalPaid)} />
            <SummaryRow label="Balance due" value={money(invoice.balanceAmount)} bold />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
