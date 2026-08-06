'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card } from '@agma/ui';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

type Client = Tables<'clients'>;
type WebsiteClient = Tables<'website_clients'>;

/**
 * Website live-sync manager (docs/05 §B1). consent_public is the legal kill
 * switch — publishing is impossible without it, and the site's anon policy
 * enforces the same rule server-side.
 */
export default function WebsiteManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [rows, setRows] = useState<WebsiteClient[]>([]);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const [c, w] = await Promise.all([
      supabase.from('clients').select('*').order('company'),
      supabase.from('website_clients').select('*'),
    ]);
    setClients(c.data ?? []);
    setRows(w.data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function enable(client: Client) {
    await getSupabase().from('website_clients').insert({
      client_id: client.id,
      display_name_ar: client.company,
    });
    load();
  }

  async function update(row: WebsiteClient, patch: Partial<WebsiteClient>) {
    await getSupabase().from('website_clients').update(patch).eq('id', row.id);
    load();
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-black">مزامنة الموقع</h1>
      <p className="mb-4 text-sm text-gray-medium">
        لا يُنشر شعار عميل بدون بند تعاقدي + تفعيل «موافقة النشر». يظهر على agma.com.sa
        فقط من فُعّل لديه الخياران معاً.
      </p>
      <div className="space-y-2">
        {clients.map((client) => {
          const row = rows.find((r) => r.client_id === client.id);
          if (!row) {
            return (
              <Card key={client.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="font-bold">{client.company}</span>
                <Button variant="outline" className="ms-auto px-3 py-1 text-xs" onClick={() => enable(client)}>
                  إعداد الظهور
                </Button>
              </Card>
            );
          }
          return (
            <Card key={client.id} className="space-y-2 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold">{client.company}</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-light">
                  <input
                    type="checkbox"
                    checked={row.consent_public}
                    onChange={(e) =>
                      update(row, {
                        consent_public: e.target.checked,
                        // Consent withdrawal always unpublishes — kill switch.
                        ...(e.target.checked ? {} : { published: false }),
                      })
                    }
                  />
                  موافقة النشر (تعاقدية)
                </label>
                <label className={`flex items-center gap-1.5 text-xs ${row.consent_public ? 'text-gray-light' : 'text-gray-medium opacity-50'}`}>
                  <input
                    type="checkbox"
                    disabled={!row.consent_public}
                    checked={row.published}
                    onChange={(e) => update(row, { published: e.target.checked })}
                  />
                  منشور على الموقع
                </label>
                {row.published && row.consent_public && (
                  <span className="rounded-full bg-pulse-orange/20 px-2 py-0.5 text-xs text-pulse-orange">
                    ظاهر الآن
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  defaultValue={row.display_name_ar}
                  onBlur={(e) => e.target.value !== row.display_name_ar &&
                    update(row, { display_name_ar: e.target.value })}
                  placeholder="الاسم المعروض (عربي)"
                  className="rounded-sm border border-gray-dark bg-transparent px-2 py-1 text-xs"
                />
                <input
                  defaultValue={row.logo_url ?? ''}
                  onBlur={(e) => (e.target.value || null) !== row.logo_url &&
                    update(row, { logo_url: e.target.value || null })}
                  placeholder="رابط الشعار (URL)"
                  dir="ltr"
                  className="flex-1 rounded-sm border border-gray-dark bg-transparent px-2 py-1 text-xs"
                />
              </div>
            </Card>
          );
        })}
        {clients.length === 0 && <p className="text-sm text-gray-medium">لا يوجد عملاء بعد</p>}
      </div>
    </div>
  );
}
