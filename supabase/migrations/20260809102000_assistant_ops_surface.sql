-- سطح 'ops' (مساعد الفريق) أُضيف في مركز المساعدة لكن قيد surface بقي على
-- site/portal/whatsapp — فكانت سجلات الفريق تسقط بصمت (اكتُشف بغياب أي سجل
-- ops في الإنتاج). درس: كل إدراج من دالة Edge يسجل خطأه في console.
alter table public.assistant_logs drop constraint assistant_logs_surface_check;
alter table public.assistant_logs add constraint assistant_logs_surface_check
  check (surface in ('site', 'portal', 'ops', 'whatsapp'));
