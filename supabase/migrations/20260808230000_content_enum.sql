-- المرحلة ٨ — محرك المحتوى: توسعة enum الاعتمادات (migration مستقلة إلزاماً)
alter type public.approval_item_type add value if not exists 'content';
