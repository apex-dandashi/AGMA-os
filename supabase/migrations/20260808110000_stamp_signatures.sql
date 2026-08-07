-- الختم والتواقيع (طلب المالك، جولة مكتبة العقود ٢٫١):
--
--   org_settings.stamp_data / signature_data   ختم المنشأة وتوقيعها الرسمي
--                                              (data URI صغيرة — تُضمَّن في
--                                              لقطة العقد فتبقى مجمّدة معه)
--   profiles.signature_data                    توقيع شخصي لكل عضو فريق —
--                                              يُحدَّث حصراً عبر دالة مقيدة
--                                              حتى لا نفتح تعديل profiles ذاتياً
--                                              (cost_rate والدور محمية كما هي)

alter table public.org_settings
  add column stamp_data text,
  add column signature_data text;

comment on column public.org_settings.stamp_data is
  'ختم المنشأة كصورة data URI (يظهر في خانة توقيع الطرف الأول بالعقود الجديدة)';

alter table public.profiles add column signature_data text;

comment on column public.profiles.signature_data is
  'توقيع العضو الشخصي — يُحدَّث عبر set_my_signature فقط، لا تعديل مباشر لغير الشريك';

-- تحقق موحد: صورة data URI ولا تتجاوز ~500KB (بعد base64)
create or replace function public.valid_signature_image(p_data text)
returns boolean language sql immutable as $$
  select p_data is null
      or (p_data like 'data:image/%' and length(p_data) <= 700000);
$$;

alter table public.org_settings
  add constraint org_stamp_is_image check (public.valid_signature_image(stamp_data)),
  add constraint org_signature_is_image check (public.valid_signature_image(signature_data));
alter table public.profiles
  add constraint profile_signature_is_image check (public.valid_signature_image(signature_data));

-- توقيعي أنا فقط — بلا فتح سياسة تعديل ذاتي على بقية أعمدة profiles
create or replace function public.set_my_signature(p_data text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_team() then
    raise exception 'التوقيع الشخصي لأعضاء الفريق';
  end if;
  if not public.valid_signature_image(p_data) then
    raise exception 'التوقيع يجب أن يكون صورة وبحجم لا يتجاوز ٥٠٠ كيلوبايت';
  end if;
  update public.profiles set signature_data = p_data where id = auth.uid();
end;
$$;

grant execute on function public.set_my_signature(text) to authenticated;
