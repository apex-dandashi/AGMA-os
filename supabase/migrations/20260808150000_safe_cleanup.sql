-- جولة التنظيف (طلب المالك): «كيف نمسح عميلاً دخل بالغلط؟ كيف نمسح المسودات؟»
-- + تثبيت قرار الشركاء: الشهادة المستهدفة أولاً ISO/IEC 27001 ثم ISO 9001.
--
-- فلسفة الحذف: ما دخل بالخطأ ولم يرتبط بأثر مالي أو قانوني أو امتثالي
-- يُحذف بيد أي مدير تشغيلي مع تنظيف بقاياه (مسودات ونطاقات وروابط) —
-- وما ارتبط بأثر يُرفض حذفه برسالة عربية تشرح البديل (الأرشفة أو الوضع الحر).

-- ---------------------------------------------------------------------------
-- 1. قرار الشهادة
-- ---------------------------------------------------------------------------
alter table public.ims_frameworks add column certification_priority int;

update public.ims_frameworks set certification_priority = 1,
  applicability_note = coalesce(applicability_note || ' · ', '')
    || 'قرار شركاء 2026-08-08: الشهادة المستهدفة الأولى'
 where key = 'ISO27001';
update public.ims_frameworks set certification_priority = 2,
  applicability_note = coalesce(applicability_note, '')
 where key = 'ISO9001';

-- ---------------------------------------------------------------------------
-- 2. حذف العميل غير المرتبط
-- ---------------------------------------------------------------------------
create or replace function public.delete_client_if_unlinked(p_client uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_strategist_plus() then
    raise exception 'حذف العملاء للإدارة التشغيلية';
  end if;

  -- الروابط الجوهرية: يُرفض الحذف وتُشرح البدائل
  select count(*) into n from public.documents
   where client_id = p_client and status <> 'draft';
  if n > 0 then
    raise exception 'العميل مرتبط بـ% مستند معتمد أو مرقّم — الأرشفة من «تعديل البيانات» بدل الحذف (أو الوضع الحر للشريك بعد حذف مستنداته)', n;
  end if;

  select count(*) into n from public.projects where client_id = p_client;
  if n > 0 then
    raise exception 'العميل مرتبط بـ% مشروع — أرشف العميل أو احذف مشاريعه أولاً', n;
  end if;

  select count(*) into n from public.recurring_invoices where client_id = p_client;
  if n > 0 then
    raise exception 'للعميل اشتراك شهري — أوقفه واحذفه من المالية أولاً';
  end if;

  select count(*) into n from public.wallets where client_id = p_client;
  if n > 0 then
    raise exception 'للعميل محفظة مالية — لا يُحذف عميل له أثر مالي، استخدم الأرشفة';
  end if;

  select count(*) into n from public.profiles where client_id = p_client;
  if n > 0 then
    raise exception 'للعميل حساب دخول (بوابة) — عطّل الحساب أولاً من الفريق';
  end if;

  select count(*) into n from public.messages where client_id = p_client;
  if n > 0 then
    raise exception 'للعميل سجل مراسلات — استخدم الأرشفة للحفاظ على السجل';
  end if;

  if exists (select 1 from public.data_subject_requests where client_id = p_client)
     or exists (select 1 from public.nonconformities where client_id = p_client)
     or exists (select 1 from public.approvals where client_id = p_client) then
    raise exception 'للعميل سجلات امتثال (طلبات بيانات أو عدم مطابقة أو اعتمادات) — لا تُحذف، استخدم الأرشفة';
  end if;

  -- تنظيف البقايا العرضية ثم الحذف (جهات الاتصال والتفاعلات تتبع تلقائياً)
  delete from public.documents where client_id = p_client and status = 'draft';
  delete from public.scopes where client_id = p_client;
  update public.leads set client_id = null where client_id = p_client;
  update public.notifications set client_id = null where client_id = p_client;
  update public.issues set client_id = null where client_id = p_client;
  delete from public.clients where id = p_client;
end;
$$;

grant execute on function public.delete_client_if_unlinked(uuid) to authenticated;
