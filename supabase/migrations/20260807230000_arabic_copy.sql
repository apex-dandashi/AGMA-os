-- Language review: database-side messages in clear Saudi Arabic — the same
-- voice the UI now speaks. Literal translations (طقس، Flag & Hold،
-- «نقطة توقف») replaced with plain language; guidance added to errors.

-- 1. Checklist gate messages
create or replace function public.tasks_checklist_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_key text; v_last public.checklist_runs%rowtype;
begin
  if new.status = 'done' and old.status <> 'done' and new.template_id is not null then
    select checklist_key into v_key from public.task_templates where id = new.template_id;
    if v_key is not null then
      select * into v_last from public.checklist_runs
        where task_id = new.id
        order by created_at desc limit 1;
      if v_last.id is null or v_last.status = 'in_progress' then
        raise exception 'لا يمكن إنجاز هذه المهمة قبل اجتياز قائمة الفحص «%» — افتحها من زر «فحص الإطلاق» على المهمة', v_key;
      end if;
      if v_last.status = 'flagged' then
        raise exception 'الإطلاق موقوف باعتراض مسجّل على هذه المهمة — عالجوا سببه ثم أعيدوا الفحص من أوله';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- 2. Custom-scope reason message
create or replace function public.scope_custom_reason_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'draft' and new.package_id is null
     and coalesce(trim(new.why_no_package_fit), '') = '' then
    raise exception 'قبل إرسال نطاق مخصص اكتب لماذا لم تناسب العميل أي باقة — هذه الأسباب هي التي تصنع باقاتنا القادمة';
  end if;
  return new;
end;
$$;

-- 3. Package activation messages (drop the English tail)
create or replace function public.package_activation_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_bad text;
begin
  if new.active then
    select p.name_ar into v_bad
    from public.playbooks p
    where p.id = any(new.playbook_ids) and p.documentation_grade = 'C'
    limit 1;
    if v_bad is not null then
      raise exception 'لا يمكن تفعيل الباقة: دليل عمل «%» توثيقه بدرجة C — لا نبيع ما لم نوثّقه بعد', v_bad;
    end if;
    if new.base_price is null then
      raise exception 'لا يمكن تفعيل الباقة قبل اعتماد سعرها من الإعدادات (قرار شركاء)';
    end if;
  end if;
  return new;
end;
$$;

-- 4. Notification templates in the same voice
update public.notification_templates
   set body = 'اعتراض يوقف الإطلاق على «{{name}}» — السبب: {{reason}}'
 where key = 'flag_hold';
update public.notification_templates
   set body = 'جولة توزيع الدخل جاهزة: دخل الفترة SAR {{income}} — حوّل المبالغ بين الحسابات ثم أكّد من صفحة المالية'
 where key = 'allocation_ready';
