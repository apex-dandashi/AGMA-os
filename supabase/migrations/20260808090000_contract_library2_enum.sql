-- docs/14 §2 — مكتبة العقود ٢٫٠: اثنا عشر نوعاً جديداً يكملان دورة العلاقة
-- (خدمة مستقلة، اشتراك، شركاء وموردون، ملكية وترخيص، استلام وتجديد وإنهاء
-- وتسوية وتفويض). enum فقط — القاعدة الملزِمة: توسعة الـenum في migration
-- مستقلة عن أي استخدام لقيمها.

alter type public.document_type add value if not exists 'service';
alter type public.document_type add value if not exists 'retainer';
alter type public.document_type add value if not exists 'partnership';
alter type public.document_type add value if not exists 'contractor';
alter type public.document_type add value if not exists 'referral';
alter type public.document_type add value if not exists 'licensing';
alter type public.document_type add value if not exists 'ip_addendum';
alter type public.document_type add value if not exists 'acceptance';
alter type public.document_type add value if not exists 'renewal';
alter type public.document_type add value if not exists 'termination';
alter type public.document_type add value if not exists 'settlement';
alter type public.document_type add value if not exists 'authorization';
