'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  SkeletonList,
  Switch,
} from '@agma/ui';
import type { Tables } from '@agma/db';
import { Globe } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClients, useWebsiteClients } from '../lib/queries';

type Client = Tables<'clients'>;
type WebsiteClient = Tables<'website_clients'>;

/**
 * Website live-sync manager (docs/05 §B1). consent_public is the legal kill
 * switch — withdrawing it force-unpublishes and requires confirmation.
 */
export default function WebsiteManager() {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: rows, isLoading: loadingRows } = useWebsiteClients();
  const [withdrawing, setWithdrawing] = useState<WebsiteClient | null>(null);

  const enable = useAppMutation(
    async (client: Client) => {
      const { error } = await getSupabase().from('website_clients').insert({
        client_id: client.id,
        display_name_ar: client.company,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.websiteClients] }
  );

  const update = useAppMutation(
    async ({ row, patch }: { row: WebsiteClient; patch: Partial<WebsiteClient> }) => {
      const { error } = await getSupabase()
        .from('website_clients')
        .update(patch)
        .eq('id', row.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.websiteClients] }
  );

  if (loadingClients || loadingRows) return <SkeletonList rows={4} />;

  return (
    <div>
      <h1 className="mb-1 text-xl font-black">مزامنة الموقع</h1>
      <p className="mb-4 max-w-2xl text-sm text-gray-medium">
        لا يُنشر شعار عميل بدون بند تعاقدي + تفعيل «موافقة النشر». يظهر على agma.com.sa
        فقط من فُعّل لديه الخياران معاً — سحب الموافقة يلغي النشر فوراً.
      </p>
      {(clients ?? []).length === 0 ? (
        <EmptyState icon={<Globe className="h-8 w-8" aria-hidden />} title="لا يوجد عملاء بعد"
          hint="أنشئ عميلاً من صفحة العملاء أولاً، ثم فعّل ظهوره هنا." />
      ) : (
        <div className="space-y-2">
          {(clients ?? []).map((client) => {
            const row = (rows ?? []).find((r) => r.client_id === client.id);
            if (!row) {
              return (
                <Card key={client.id} className="flex items-center gap-3 p-3 text-sm">
                  <span className="font-bold">{client.company}</span>
                  <Button variant="outline" size="xs" className="ms-auto"
                    loading={enable.isPending}
                    onClick={() => enable.mutate(client)}>
                    إعداد الظهور
                  </Button>
                </Card>
              );
            }
            return (
              <Card key={client.id} className="space-y-3 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold">{client.company}</span>
                  <Switch
                    checked={row.consent_public}
                    label="موافقة النشر (تعاقدية)"
                    onChange={(v) => {
                      if (!v && row.published) {
                        setWithdrawing(row);
                      } else {
                        update.mutate({ row, patch: { consent_public: v } });
                      }
                    }}
                  />
                  <Switch
                    checked={row.published}
                    disabled={!row.consent_public}
                    label="منشور على الموقع"
                    onChange={(v) => update.mutate({ row, patch: { published: v } })}
                  />
                  {row.published && row.consent_public && (
                    <Badge variant="accent">ظاهر الآن</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    defaultValue={row.display_name_ar}
                    aria-label="الاسم المعروض"
                    placeholder="الاسم المعروض (عربي)"
                    className="w-56"
                    onBlur={(e) =>
                      e.target.value !== row.display_name_ar &&
                      update.mutate({ row, patch: { display_name_ar: e.target.value } })
                    }
                  />
                  <div className="min-w-64 flex-1">
                    <Input
                      defaultValue={row.logo_url ?? ''}
                      aria-label="رابط الشعار"
                      placeholder="رابط الشعار (URL)"
                      dir="ltr"
                      onBlur={(e) =>
                        (e.target.value || null) !== row.logo_url &&
                        update.mutate({ row, patch: { logo_url: e.target.value || null } })
                      }
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!withdrawing}
        onClose={() => setWithdrawing(null)}
        danger
        title="سحب موافقة النشر"
        message="سحب الموافقة التعاقدية سيلغي نشر العميل من agma.com.sa فوراً. هذا هو مفتاح الإيقاف القانوني. متابعة؟"
        confirmLabel="سحب الموافقة وإلغاء النشر"
        onConfirm={async () => {
          if (withdrawing) {
            await update.mutateAsync({
              row: withdrawing,
              patch: { consent_public: false, published: false },
            });
          }
        }}
      />
    </div>
  );
}
