-- المرحلة ٧ — بوابة العميل: التوقيع الإلكتروني بسجل أدلة + قراءة العميل
-- لدفعاته + إشعاره بمستنداته. سياسات العزل الأساسية (مستنداته المرسلة،
-- اعتماداته وقراره، مشاريعه، حسابات الدفع الآمنة) مبنية منذ المرحلة الأولى.

-- ---------------------------------------------------------------------------
-- 1. التوقيع الإلكتروني (docs/13-14: توقيع بسجل أدلة — الحقول التي تثبت)
-- ---------------------------------------------------------------------------
create table public.document_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id),
  signer uuid not null references public.profiles (id),
  signer_name text not null,
  signature_data text not null
    check (public.valid_signature_image(signature_data)),
  doc_hash text not null,          -- md5 لحمولة المستند لحظة التوقيع
  doc_version int not null,
  signed_at timestamptz not null default now()
);

comment on table public.document_signatures is
  'سجل أدلة التوقيع الإلكتروني (نظام التعاملات الإلكترونية): من وقّع، متى، على أي نسخة، وبصمة المحتوى — لا يُعدَّل ولا يُحذف';

alter table public.document_signatures enable row level security;
grant select on public.document_signatures to authenticated;
-- لا insert/update/delete مباشر لأحد — التوقيع حصراً عبر الدالة المقيدة
create policy "signatures: team reads" on public.document_signatures
  for select to authenticated using (public.is_team());
create policy "signatures: client reads own docs" on public.document_signatures
  for select to authenticated
  using (exists (select 1 from public.documents d
                 where d.id = document_id
                   and d.client_id = public.current_client_id()));
create trigger document_signatures_audit
  after insert or update or delete on public.document_signatures
  for each row execute function public.audit_trigger();

create or replace function public.client_sign_document(
  p_document uuid, p_name text, p_signature text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_doc public.documents%rowtype;
begin
  select * into v_doc from public.documents where id = p_document;
  if v_doc.id is null or v_doc.client_id is distinct from public.current_client_id() then
    raise exception 'المستند غير موجود أو ليس من مستنداتكم';
  end if;
  if v_doc.status <> 'sent' then
    raise exception 'التوقيع متاح للمستندات المرسلة بانتظار توقيعكم فقط';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'اكتب اسم الموقّع كما يعتمد رسمياً';
  end if;
  if not public.valid_signature_image(p_signature) then
    raise exception 'التوقيع يجب أن يكون رسماً صالحاً';
  end if;

  insert into public.document_signatures
    (document_id, signer, signer_name, signature_data, doc_hash, doc_version)
  values (p_document, auth.uid(), trim(p_name), p_signature,
          md5(v_doc.payload::text), v_doc.version);

  update public.documents set status = 'signed' where id = p_document;
end;
$$;

grant execute on function public.client_sign_document(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. العميل يقرأ دفعاته (إيصالات فواتيره فقط)
-- ---------------------------------------------------------------------------
create policy "payments: client reads own invoices" on public.payments
  for select to authenticated
  using (exists (select 1 from public.documents d
                 where d.id = invoice_id
                   and d.client_id = public.current_client_id()));

-- ---------------------------------------------------------------------------
-- 3. إشعار العميل عند إرسال مستند له + عند قرار توقيعه (يصل حسابه بالبوابة)
-- ---------------------------------------------------------------------------
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('client_doc_sent', 'inapp', 'ar', null,
   'وصلكم مستند جديد من AGMA: {{title}} — راجعوه ووقّعوه من بوابتكم.', true),
  ('client_doc_signed_team', 'inapp', 'ar', null,
   'وقّع العميل {{client}} المستند {{title}} إلكترونياً — سجل الأدلة محفوظ.', true)
on conflict do nothing;

create or replace function public.on_document_sent_notify_client()
returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; v_title text;
begin
  if old.status = 'draft' and new.status = 'sent' then
    v_title := coalesce(new.number, new.type::text);
    for r in select id from public.profiles
      where role = 'client' and client_id = new.client_id and active
    loop
      perform public.enqueue_notification('client_doc', 'inapp', 'client_doc_sent',
        jsonb_build_object('title', v_title), r.id, null, new.client_id, now(),
        'cdoc:' || new.id || ':' || r.id);
    end loop;
  end if;
  if old.status = 'sent' and new.status = 'signed' then
    perform public.notify_team('client_doc', 'client_doc_signed_team',
      jsonb_build_object('title', coalesce(new.number, new.type::text),
        'client', (select company from public.clients where id = new.client_id)),
      new.client_id, 'cdoc-signed:' || new.id);
  end if;
  return new;
end;
$$;

create trigger documents_notify_client
  after update on public.documents
  for each row execute function public.on_document_sent_notify_client();
