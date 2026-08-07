-- دراسة مكتبة العقود (docs/13): أنواع P0 الجديدة. Enum extension must be its
-- own migration (values unusable in the same transaction).
alter type public.document_type add value if not exists 'change_order';
alter type public.document_type add value if not exists 'dpa';
alter type public.document_type add value if not exists 'media_auth';
alter type public.document_type add value if not exists 'influencer';
