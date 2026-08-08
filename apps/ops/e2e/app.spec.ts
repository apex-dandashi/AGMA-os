import { expect, test } from '@playwright/test';
import { totp } from './totp';

/**
 * Golden path: login → forced MFA enrollment (real TOTP) → pipeline →
 * create lead → documents. Runs against the local Supabase stack.
 */

const LOCAL_API = 'http://127.0.0.1:54321';
// Local demo service key (supabase start default — not a secret).
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const EMAIL = 'e2e@agma.local';
const PASSWORD = 'e2e-agma-2026!';

test.beforeAll(async ({ request }) => {
  // Create (or reuse) the e2e team user and promote to strategist.
  const create = await request.post(`${LOCAL_API}/auth/v1/admin/users`, {
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
    },
    data: { email: EMAIL, password: PASSWORD, email_confirm: true },
  });
  expect([200, 201, 422]).toContain(create.status()); // 422 = already exists

  const promote = await request.patch(
    `${LOCAL_API}/rest/v1/profiles?email=eq.${encodeURIComponent(EMAIL)}`,
    {
      headers: {
        apikey: SERVICE_KEY,
        authorization: `Bearer ${SERVICE_KEY}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      data: { role: 'strategist', full_name: 'E2E Runner' },
    }
  );
  expect(promote.ok()).toBeTruthy();

  // Idempotency: remove leads from previous runs.
  await request.delete(
    `${LOCAL_API}/rest/v1/leads?name=eq.${encodeURIComponent('عميل الاختبار الشامل')}`,
    { headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` } }
  );

  // Idempotency: wipe MFA factors from previous runs so enrollment is forced.
  const adminHeaders = { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` };
  const prof = await request.get(
    `${LOCAL_API}/rest/v1/profiles?email=eq.${encodeURIComponent(EMAIL)}&select=id`,
    { headers: adminHeaders }
  );
  const [{ id: userId }] = await prof.json();
  const factors = await request.get(`${LOCAL_API}/auth/v1/admin/users/${userId}/factors`, {
    headers: adminHeaders,
  });
  if (factors.ok()) {
    for (const f of await factors.json()) {
      await request.delete(`${LOCAL_API}/auth/v1/admin/users/${userId}/factors/${f.id}`, {
        headers: adminHeaders,
      });
    }
  }
});

test('login, enroll MFA, work the pipeline, open documents', async ({ page }) => {
  await page.goto('/');

  // -- login
  await page.getByLabel('البريد الإلكتروني').fill(EMAIL);
  await page.getByLabel('كلمة المرور').fill(PASSWORD);
  await page.getByRole('button', { name: 'دخول' }).click();

  // -- forced MFA enrollment (team role, no factor yet)
  await expect(page.getByText('تفعيل التحقق بخطوتين')).toBeVisible({ timeout: 15_000 });
  const secret = (await page.locator('p[dir="ltr"]').innerText()).trim();
  expect(secret.length).toBeGreaterThan(15);
  await page.getByPlaceholder('000000').fill(totp(secret));
  await page.getByRole('button', { name: 'تفعيل' }).click();

  // -- pipeline loads at aal2
  await expect(page.getByRole('heading', { name: 'مسار المبيعات' })).toBeVisible({
    timeout: 15_000,
  });

  // -- create a lead through the validated modal (empty board also shows the
  // empty-state CTA with the same label → pick the header button explicitly)
  await page.getByRole('button', { name: '+ عميل محتمل' }).first().click();
  await page.getByLabel('الاسم').fill('عميل الاختبار الشامل');
  await page.getByLabel('الشركة').fill('شركة E2E');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await expect(page.getByText('أُضيف العميل المحتمل')).toBeVisible();
  await expect(page.getByText('عميل الاختبار الشامل').first()).toBeVisible();

  // -- board search narrows
  await page.getByPlaceholder('بحث بالاسم أو الشركة…').fill('E2E');
  await expect(page.getByText('عميل الاختبار الشامل').first()).toBeVisible();

  // -- documents page renders (goto: immune to dev-server cold-compile races)
  await page.goto('/documents/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'المستندات' })).toBeVisible({ timeout: 30_000 });

  // -- finance page renders
  await page.goto('/finance/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'المالية' })).toBeVisible({ timeout: 30_000 });

  // -- team page renders the roster
  await page.goto('/team/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(EMAIL)).toBeVisible({ timeout: 30_000 });
});
