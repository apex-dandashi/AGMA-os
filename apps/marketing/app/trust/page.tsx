import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Accessibility, Bot, FileWarning, Lock, ShieldCheck, Stamp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'مركز الثقة | AGMA',
  description:
    'كيف تحمي AGMA بياناتك وتضبط جودتها وتستخدم الذكاء الاصطناعي بمسؤولية — الخصوصية والأمن والجودة والشكاوى في مكان واحد.',
};

const SECTIONS = [
  {
    id: 'privacy', icon: Lock, title: 'الخصوصية وحماية البيانات',
    body: 'نلتزم بنظام حماية البيانات الشخصية السعودي ولوائحه: نجمع الحد الأدنى اللازم للغرض، ونحدد أساساً نظامياً لكل معالجة، ونحتفظ بسجل أنشطة معالجة محدث، ونستجيب لطلبات أصحاب البيانات خلال المهل النظامية (٣٠ يوماً)، ونتعامل مع أي حادث بيانات بمهلة الإشعار النظامية (٧٢ ساعة من العلم عند انطباقها).',
    link: { href: '/privacy-policy', label: 'سياسة الخصوصية الكاملة' },
  },
  {
    id: 'security', icon: ShieldCheck, title: 'أمن المعلومات',
    body: 'نظامنا الداخلي مبني على مبدأ أدنى صلاحية بأدوار مفصلة، ومصادقة متعددة العوامل إلزامية لكل الفريق، وتشفير في النقل والتخزين، وسجل تدقيق غير قابل للتعديل لكل تغيير حساس، ونسخ احتياطية يومية. نبني وفق متطلبات ISO/IEC 27001 ونستهدف الشهادة — ولا ندّعيها قبل نيلها من جهة معتمدة.',
  },
  {
    id: 'responsible-ai', icon: Bot, title: 'الاستخدام المسؤول للذكاء الاصطناعي',
    body: 'نحن وكالة AI-Native — ونلتزم بأن يبقى الحكم بشرياً: كل أداة ذكاء اصطناعي تُسجَّل وتُعتمد داخلياً قبل استخدامها، والمخرجات ذات الأثر الجوهري تُراجع بشرياً قبل اعتمادها، ولا تُدخل بيانات عملائنا السرية أو الشخصية في أي مزود غير معتمد، ولا تُستخدم بياناتهم لتدريب نماذج عامة إلا باتفاق صريح. القرارات النهائية — في عملنا وفي توظيفنا — تبقى قرارات بشرية.',
  },
  {
    id: 'quality', icon: Stamp, title: 'الجودة وصوت العميل',
    body: 'كل مخرج يمر بفحص داخلي قبل تسليمه، وكل شكوى حالة رسمية برقم مرجعي ومسؤول ومهلة رد (يوم عمل للرد الأول بحسب سياسة خدمتنا)، والشكاوى المتكررة تتحول لإجراءات تصحيحية موثقة بجذورها والتحقق من فعاليتها — لا تُغلق بالوعود.',
    link: { href: '/complaints', label: 'الشكاوى والملاحظات' },
  },
  {
    id: 'accessibility', icon: Accessibility, title: 'إمكانية الوصول',
    body: 'نصمم نماذجنا وصفحاتنا لتُقرأ وتُستخدم بلوحة المفاتيح وقارئات الشاشة: عناوين حقول حقيقية، رسائل خطأ نصية تحدد الحقل المطلوب تصحيحه، ولا نعتمد على اللون وحده. وفي التوظيف نسأل عن الترتيبات التيسيرية بصيغة محايدة لا تدخل في أي تقييم. وجدت عائقاً؟ أخبرنا وسنصححه.',
    link: { href: '/complaints', label: 'الإبلاغ عن عائق وصول' },
  },
  {
    id: 'report', icon: FileWarning, title: 'الإبلاغ عن مشكلة أمنية أو خصوصية',
    body: 'وجدت ثغرة أو مشكلة تمس بياناتك؟ بلّغنا عبر نموذج الشكاوى (تصنيف: الخصوصية أو الأمن السيبراني) — يُعالج بسرية من الفريق المختص وبمهل نظامية، أو راسلنا على care@agma.com.sa.',
    link: { href: '/complaints', label: 'إبلاغ الآن' },
  },
];

export default function TrustPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-void text-snow">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32">
        <h1 className="mb-2 text-3xl font-black">مركز الثقة</h1>
        <p className="mb-10 text-sm leading-relaxed text-gray-light">
          خلف AGMA منظومة مؤسسية حقيقية: مؤسسة عامر عبدالله بن عثمان الغامدي
          للخدمات التسويقية (سجل تجاري 1009127528) — وهذه التزاماتنا تجاه
          بياناتك وجودة عملنا.
        </p>
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-black">
                <s.icon className="h-5 w-5 text-pulse-orange" aria-hidden />
                {s.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-light">{s.body}</p>
              {s.link && (
                <Link href={s.link.href}
                  className="mt-3 inline-block text-sm font-bold text-pulse-orange underline-offset-4 hover:underline">
                  {s.link.label} ←
                </Link>
              )}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
