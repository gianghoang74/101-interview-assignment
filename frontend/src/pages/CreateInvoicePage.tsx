import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { apiErrorMessage } from '../api/client';
import { useCreateInvoice } from '../api/invoices';
import type { CreateInvoicePayload } from '../api/types';
import { useSnackbar } from '../components/SnackbarProvider';

// Keep in sync with the backend's supported set (backend/src/invoices/currencies.ts).
const CURRENCIES = ['AUD', 'USD', 'GBP', 'EUR', 'NZD', 'SGD'];

const numericString = (
  message: string,
  opts?: { integer?: boolean; positive?: boolean; min0?: boolean },
) =>
  z.string().refine((value) => {
    if (value === '') return false;
    const n = Number(value);
    if (Number.isNaN(n)) return false;
    if (opts?.integer && !Number.isInteger(n)) return false;
    if (opts?.positive && n <= 0) return false;
    if (opts?.min0 && n < 0) return false;
    return true;
  }, message);

const schema = z
  .object({
    customer: z.object({
      fullname: z.string().min(1, 'Required'),
      email: z.string().email('Valid email required'),
      mobileNumber: z.string().optional(),
      address: z.string().optional(),
    }),
    invoiceNumber: z.string().min(1, 'Required'),
    invoiceReference: z.string().optional(),
    invoiceDate: z.string().min(1, 'Required'),
    dueDate: z.string().min(1, 'Required'),
    currency: z.string().min(1, 'Required'),
    description: z.string().optional(),
    item: z.object({
      name: z.string().min(1, 'Required'),
      quantity: numericString('Positive whole number', {
        integer: true,
        positive: true,
      }),
      rate: numericString('Must be greater than 0', { positive: true }),
    }),
    tax: numericString('Must be 0 or more', { min0: true }),
    discount: numericString('Must be 0 or more', { min0: true }),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.invoiceDate), {
    message: 'Due date must be on or after invoice date',
    path: ['dueDate'],
  });

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  customer: { fullname: '', email: '', mobileNumber: '', address: '' },
  invoiceNumber: '',
  invoiceReference: '',
  invoiceDate: '',
  dueDate: '',
  currency: 'AUD',
  description: '',
  item: { name: '', quantity: '1', rate: '' },
  tax: '10',
  discount: '0',
};

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const createInvoice = useCreateInvoice();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateInvoicePayload = {
      customer: {
        fullname: values.customer.fullname,
        email: values.customer.email,
        mobileNumber: values.customer.mobileNumber || undefined,
        address: values.customer.address || undefined,
      },
      invoiceNumber: values.invoiceNumber,
      invoiceReference: values.invoiceReference || undefined,
      invoiceDate: values.invoiceDate,
      dueDate: values.dueDate,
      currency: values.currency,
      description: values.description || undefined,
      item: {
        name: values.item.name,
        quantity: Number(values.item.quantity),
        rate: Number(values.item.rate),
      },
      tax: Number(values.tax),
      discount: Number(values.discount),
    };

    try {
      await createInvoice.mutateAsync(payload);
      notify('Invoice created', 'success');
      navigate('/');
    } catch (e) {
      const message = apiErrorMessage(e);
      if (message.toLowerCase().includes('invoice number')) {
        setError('invoiceNumber', { message });
      }
      notify(message, 'error');
    }
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        New invoice
      </Typography>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Customer
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Customer name"
                  fullWidth
                  {...register('customer.fullname')}
                  error={Boolean(errors.customer?.fullname)}
                  helperText={errors.customer?.fullname?.message}
                />
                <TextField
                  label="Customer email"
                  fullWidth
                  {...register('customer.email')}
                  error={Boolean(errors.customer?.email)}
                  helperText={errors.customer?.email?.message}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Mobile (optional)" fullWidth {...register('customer.mobileNumber')} />
                <TextField label="Address (optional)" fullWidth {...register('customer.address')} />
              </Stack>
            </Stack>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Invoice
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Invoice number"
                  fullWidth
                  {...register('invoiceNumber')}
                  error={Boolean(errors.invoiceNumber)}
                  helperText={errors.invoiceNumber?.message}
                />
                <TextField label="Reference (optional)" fullWidth {...register('invoiceReference')} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Invoice date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('invoiceDate')}
                  error={Boolean(errors.invoiceDate)}
                  helperText={errors.invoiceDate?.message}
                />
                <TextField
                  label="Due date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('dueDate')}
                  error={Boolean(errors.dueDate)}
                  helperText={errors.dueDate?.message}
                />
                <Controller
                  control={control}
                  name="currency"
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      label="Currency"
                      sx={{ minWidth: 120 }}
                      {...field}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    >
                      {CURRENCIES.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Stack>
              <TextField
                label="Description (optional)"
                fullWidth
                multiline
                minRows={2}
                {...register('description')}
              />
            </Stack>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Line item
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Item name"
                fullWidth
                {...register('item.name')}
                error={Boolean(errors.item?.name)}
                helperText={errors.item?.name?.message}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  {...register('item.quantity')}
                  error={Boolean(errors.item?.quantity)}
                  helperText={errors.item?.quantity?.message}
                />
                <TextField
                  label="Rate"
                  type="number"
                  fullWidth
                  {...register('item.rate')}
                  error={Boolean(errors.item?.rate)}
                  helperText={errors.item?.rate?.message}
                />
                <TextField
                  label="Tax %"
                  type="number"
                  fullWidth
                  {...register('tax')}
                  error={Boolean(errors.tax)}
                  helperText={errors.tax?.message}
                />
                <TextField
                  label="Discount"
                  type="number"
                  fullWidth
                  {...register('discount')}
                  error={Boolean(errors.discount)}
                  helperText={errors.discount?.message}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Totals are calculated by the server on save.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? 'Saving…' : 'Create invoice'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
