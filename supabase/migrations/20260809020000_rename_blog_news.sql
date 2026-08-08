-- طلب المالك: اسم القسم العام «آخر الأخبار» بدل «المدونة».
-- الروابط لا تتغير (/blog — سلامة السيو)، فقط الأسماء الظاهرة والبيانات.

update public.notification_templates
   set body = 'مقال اليوم جاهز للمراجعة: «{{title}}» — راجعه وانشره من المحتوى ← آخر الأخبار (الموقع).'
 where key = 'article_ready';

-- المقال الافتتاحي: مواءمة العنوان والنص مع الاسم الجديد
update public.articles
   set title = 'لماذا أطلقنا قسم آخر الأخبار في AGMA — وماذا ستجد فيه كل يوم',
       excerpt = replace(coalesce(excerpt, ''), 'مدونة يومية', 'نشرة يومية'),
       body_md = replace(replace(coalesce(body_md, ''),
                   '## لماذا هذه المدونة؟', '## لماذا هذا القسم؟'),
                   'اجعل زيارة هذه المدونة', 'اجعل زيارة هذا القسم'),
       seo_title = 'آخر الأخبار من AGMA — التسويق والذكاء الاصطناعي بالعربية',
       seo_description = replace(coalesce(seo_description, ''), 'مدونة يومية', 'نشرة يومية')
 where slug = 'welcome-to-agma-blog';
