import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from './client';
import type {
  CreateInvoicePayload,
  Invoice,
  InvoiceListResponse,
  ListInvoicesParams,
} from './types';

export function useInvoices(params: ListInvoicesParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data } = await api.get<InvoiceListResponse>('/invoices', {
        params,
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Invoice>(`/invoices/${id}`);
      return data;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload) => {
      const { data } = await api.post<Invoice>('/invoices', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
