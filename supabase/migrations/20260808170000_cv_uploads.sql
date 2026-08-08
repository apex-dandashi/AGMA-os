-- رفع السيرة الذاتية (طلب المالك — كان مؤجلاً في docs/16، يُبنى الآن بضوابطه):
--   دلو خاص 'applications' بحد ٥MB وأنواع مسموحة (PDF/DOC/DOCX) حصراً؛
--   الرفع من دالة الحافة بخدمة service_role فقط (لا رفع مباشر من الجمهور)،
--   والقراءة لشؤون الفريق والشريك عبر روابط موقعة مؤقتة.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('applications', 'applications', false, 5 * 1024 * 1024,
        array['application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "applications: hr reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'applications'
         and (public.is_admin() or public.app_role() = 'hr'));

alter table public.career_applications
  add column cv_path text,
  add column cv_filename text;

comment on column public.career_applications.cv_path is
  'مسار السيرة الذاتية في دلو applications الخاص — تُفتح برابط موقّع مؤقت لشؤون الفريق';
