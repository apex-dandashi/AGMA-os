'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useToast } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from './supabase';

type Lead = Tables<'leads'>;

/** Unwrap a supabase response or throw — queries never fail silently. */
async function must<T>(
  p: PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

/* ------------------------------------------------------------- queries */

export const keys = {
  leads: ['leads'] as QueryKey,
  clients: ['clients'] as QueryKey,
  documents: ['documents'] as QueryKey,
  accounts: ['payment_accounts'] as QueryKey,
  clauses: ['clauses'] as QueryKey,
  catalog: ['catalog'] as QueryKey,
  websiteClients: ['website_clients'] as QueryKey,
  clientDetail: (id: string) => ['client', id] as QueryKey,
};

export const useLeads = () =>
  useQuery({
    queryKey: keys.leads,
    queryFn: () =>
      must(getSupabase().from('leads').select('*').order('created_at', { ascending: false })),
  });

export const useClients = () =>
  useQuery({
    queryKey: keys.clients,
    queryFn: () => must(getSupabase().from('clients').select('*').order('company')),
  });

export const useDocuments = () =>
  useQuery({
    queryKey: keys.documents,
    queryFn: () =>
      must(getSupabase().from('documents').select('*').order('created_at', { ascending: false })),
  });

export const usePaymentAccounts = () =>
  useQuery({
    queryKey: keys.accounts,
    queryFn: () =>
      must(
        getSupabase()
          .from('payment_accounts')
          .select('id, iban, bank_name, beneficiary_name, is_default')
          .eq('active', true)
      ),
  });

export const useClauses = () =>
  useQuery({
    queryKey: keys.clauses,
    queryFn: () =>
      must(getSupabase().from('clause_library').select('*').eq('approved', true).order('sort')),
  });

export const useCatalog = () =>
  useQuery({
    queryKey: keys.catalog,
    queryFn: async () => {
      const supabase = getSupabase();
      const [categories, services] = await Promise.all([
        must(supabase.from('service_categories').select('*').order('sort')),
        must(supabase.from('services_catalog').select('*').eq('active', true).order('sort')),
      ]);
      return { categories, services };
    },
  });

export const useWebsiteClients = () =>
  useQuery({
    queryKey: keys.websiteClients,
    queryFn: () => must(getSupabase().from('website_clients').select('*')),
  });

export const useClientDetail = (clientId: string | null) =>
  useQuery({
    queryKey: keys.clientDetail(clientId ?? 'none'),
    enabled: !!clientId,
    queryFn: async () => {
      const supabase = getSupabase();
      const [contacts, interactions, scopes] = await Promise.all([
        must(supabase.from('contacts').select('*').eq('client_id', clientId!).order('created_at')),
        must(
          supabase
            .from('interactions')
            .select('*')
            .eq('client_id', clientId!)
            .order('occurred_at', { ascending: false })
            .limit(30)
        ),
        must(
          supabase
            .from('scopes')
            .select('*')
            .eq('client_id', clientId!)
            .order('created_at', { ascending: false })
        ),
      ]);
      return { contacts, interactions, scopes };
    },
  });

/* ----------------------------------------------------------- mutations */

/** Standard mutation: invalidates keys, toasts on error (and optional success). */
export function useAppMutation<TArgs>(
  fn: (args: TArgs) => Promise<unknown>,
  opts: { invalidate: QueryKey[]; successMessage?: string }
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      opts.invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      if (opts.successMessage) toast.success(opts.successMessage);
    },
    onError: (e: Error) => toast.error(e.message || 'حدث خطأ غير متوقع'),
  });
}

/** Optimistic stage move: board updates instantly, rolls back on failure. */
export function useMoveLeadStage() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Enums<'lead_stage'> }) => {
      const { error } = await getSupabase().from('leads').update({ stage }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: keys.leads });
      const prev = qc.getQueryData<Lead[]>(keys.leads);
      qc.setQueryData<Lead[]>(keys.leads, (old) =>
        (old ?? []).map((l) => (l.id === id ? { ...l, stage } : l))
      );
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.leads, ctx.prev);
      toast.error('تعذر نقل العميل المحتمل — أُعيدت البطاقة');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.leads }),
  });
}
