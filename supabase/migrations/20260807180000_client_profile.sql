-- Gaps round (owner walkthrough): full client profile, NDA clause set,
-- and the RLS needed for a real settings page.

-- ---------------------------------------------------------------------------
-- 1. Client profile — the fields the owner reached for and didn't find
-- ---------------------------------------------------------------------------
alter table public.clients
  add column website text,
  add column city text,
  add column cr_number text,
  add column vat_number text;

comment on column public.clients.cr_number is 'السجل التجاري — يظهر لاحقاً في العقود والفواتير';
comment on column public.clients.vat_number is 'الرقم الضريبي — إلزامي لفوترة ZATCA للمنشآت';

-- ---------------------------------------------------------------------------
-- 2. NDA clause set (docs/03 legal engine) — عقد عدم الإفصاح جاهز بنوده
-- ---------------------------------------------------------------------------
insert into public.clause_library (key, category, title_ar, body_ar, sort, approved) values
  ('nda_definition', 'nda', 'تعريف المعلومات السرية',
   'يُقصد بالمعلومات السرية كل معلومة أو بيانات أو مستندات أو خطط تجارية أو تسويقية أو تقنية أو مالية، مكتوبة كانت أو شفهية أو إلكترونية، يفصح عنها أحد الطرفين للطرف الآخر بشكل مباشر أو غير مباشر، سواء وُصفت بأنها سرية أم كان يُفهم من طبيعتها ذلك.', 1, true),
  ('nda_obligations', 'nda', 'التزامات الطرف المتلقي',
   'يلتزم الطرف المتلقي بالمحافظة على سرية المعلومات وعدم الإفصاح عنها لأي طرف ثالث دون موافقة كتابية مسبقة، وبعدم استخدامها لغير الغرض المتفق عليه، وبقصر الاطلاع عليها على منسوبيه الذين تقتضي أعمالهم ذلك وبالقدر اللازم فقط.', 2, true),
  ('nda_exclusions', 'nda', 'الاستثناءات',
   'لا تشمل السرية المعلومات التي: (أ) كانت متاحة للعموم قبل الإفصاح أو أصبحت كذلك دون إخلال بهذه الاتفاقية، (ب) كانت بحوزة الطرف المتلقي مشروعاً قبل الإفصاح، (ج) استُلمت من طرف ثالث دون قيد سرية، (د) طُلب الإفصاح عنها بموجب نظام أو أمر قضائي، على أن يُخطر الطرف المفصح فوراً متى كان ذلك نظامياً.', 3, true),
  ('nda_term', 'nda', 'مدة الالتزام',
   'يسري هذا الالتزام طوال مدة التعامل بين الطرفين ولمدة ثلاث (3) سنوات من تاريخ انتهائه أو إنهائه لأي سبب، وتبقى الأسرار التجارية محمية ما بقيت كذلك نظاماً.', 4, true),
  ('nda_return', 'nda', 'إعادة المعلومات وإتلافها',
   'عند انتهاء التعامل أو بطلب كتابي من الطرف المفصح، يلتزم الطرف المتلقي بإعادة جميع المعلومات السرية ونسخها أو إتلافها وتأكيد ذلك كتابةً خلال عشرة (10) أيام عمل، مع مراعاة ما تفرضه الأنظمة من احتفاظ إلزامي.', 5, true),
  ('nda_remedies', 'nda', 'التعويض والجزاءات',
   'يقر الطرفان بأن الإخلال بهذه الاتفاقية قد يلحق ضرراً يتعذر جبره بالتعويض المالي وحده، ويحق للطرف المتضرر طلب التنفيذ العيني أو الأمر بالكف عن الإخلال، إضافةً إلى التعويض عن الأضرار الفعلية الثابتة.', 6, true),
  ('nda_law', 'nda', 'النظام الواجب التطبيق وتسوية النزاعات',
   'تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية، وتُسوَّى أي خلافات ودياً خلال ثلاثين (30) يوماً، وإلا فيُحال النزاع إلى الجهة القضائية المختصة في مدينة الرياض.', 7, true)
on conflict (key) do nothing;

-- Contracts get their own gapless counter (CT-00001…) — an NDA must never
-- consume a quote number.
insert into public.document_counters (prefix, next_number) values ('CT', 1)
on conflict (prefix) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Settings-page RLS: admins manage payment accounts and templates
-- ---------------------------------------------------------------------------
grant insert, update, delete on public.payment_accounts to authenticated;
create policy "payment_accounts: admin manages" on public.payment_accounts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Admins must also see inactive accounts in settings.
create policy "payment_accounts: admin reads all" on public.payment_accounts
  for select to authenticated using (public.is_admin());

grant insert, update, delete on public.notification_templates to authenticated;
create policy "templates: admin manages" on public.notification_templates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
