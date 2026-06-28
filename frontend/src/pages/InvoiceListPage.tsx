import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { debounce } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiErrorMessage } from '../api/client';
import { useInvoices } from '../api/invoices';
import { formatDate } from '../utils/formatDate';
import type {
  InvoiceStatus,
  ListInvoicesParams,
  Ordering,
  SortBy,
} from '../api/types';
import { StatusChip } from '../components/StatusChip';

const STATUS_OPTIONS: Array<InvoiceStatus | 'All'> = [
  'All',
  'Draft',
  'Pending',
  'Paid',
  'Overdue',
];

export function InvoiceListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0); // zero-based for MUI TablePagination
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>('invoiceDate');
  const [ordering, setOrdering] = useState<Ordering>('DESC');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Debounce the search box so we don't query on every keystroke (lodash).
  const applyKeyword = useMemo(
    () =>
      debounce((value: string) => {
        setKeyword(value.trim());
        setPage(0);
      }, 350),
    [],
  );
  useEffect(() => () => applyKeyword.cancel(), [applyKeyword]);

  const params: ListInvoicesParams = {
    page: page + 1,
    pageSize,
    sortBy,
    ordering,
    ...(statusFilter !== 'All' ? { status: statusFilter } : {}),
    ...(keyword ? { keyword } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const { data, isLoading, isError, error } = useInvoices(params);
  const sortDirection = ordering === 'ASC' ? 'asc' : 'desc';

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setOrdering((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setOrdering('ASC');
    }
    setPage(0);
  };

  const sortableHeader = (field: SortBy, label: string, align?: 'right') => (
    <TableCell
      align={align}
      sortDirection={sortBy === field ? sortDirection : false}
    >
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? sortDirection : 'asc'}
        onClick={() => toggleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Invoices
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search (invoice # or customer)"
          value={keywordInput}
          onChange={(e) => {
            setKeywordInput(e.target.value);
            applyKeyword(e.target.value);
          }}
          size="small"
          fullWidth
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as InvoiceStatus | 'All');
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(0);
          }}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="To"
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(0);
          }}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      {isError ? (
        <Alert severity="error">{apiErrorMessage(error)}</Alert>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  {sortableHeader('invoiceDate', 'Invoice Date')}
                  {sortableHeader('dueDate', 'Due Date')}
                  {sortableHeader('totalAmount', 'Total', 'right')}
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : data && data.data.length > 0 ? (
                  data.data.map((invoice) => (
                    <TableRow
                      key={invoice.invoiceId}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/invoices/${invoice.invoiceId}`)}
                    >
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customer.fullname}</TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell align="right">
                        {invoice.currencySymbol}
                        {invoice.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={invoice.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No invoices found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data?.paging.total ?? 0}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
      )}
    </Box>
  );
}
