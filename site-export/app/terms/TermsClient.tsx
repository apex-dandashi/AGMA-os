'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  FileText, 
  Scale, 
  HelpCircle, 
  Clock, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Scaling, 
  Info,
  Zap, 
  Lock, 
  Globe, 
  Users,
  Mail, 
  Phone, 
  Search,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function TermsClient() {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sections = [
    {
      id: 'acceptance',
      title: '1. قبول الشروط',
      icon: CheckCircle2,
      content: [
        'باستخدامك لموقع AGMA أو إرسال أي نموذج أو طلب عبره، فإنك توافق على الالتزام بهذه الشروط والأحكام، بالإضافة إلى سياسة الخصوصية الخاصة بنا.',
        'إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الموقع أو إرسال أي بيانات من خلاله.',
        'لا تُعد هذه الشروط وحدها عقدًا لتنفيذ الخدمات، وإنما تنظم استخدام الموقع والتواصل الأولي. أما تقديم الخدمات فعليًا فيخضع لعرض سعر أو عقد أو اتفاق مكتوب مستقل بين AGMA والعميل.'
      ]
    },
    {
      id: 'about',
      title: '2. من نحن',
      icon: Scaling,
      content: [
        'AGMA — Agency Marketing Generation AI، والمعروفة عربيًا باسم وكالة جيل الذكاء الاصطناعي، هي وكالة سعودية مقرها الرياض، تعمل تحت الاسم القانوني: مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية، سجل تجاري رقم 1009127528.',
        'تقدم AGMA خدمات التسويق المدفوع بالذكاء الاصطناعي، الأتمتة، الأداء التسويقي، الإعلانات، السيو، المحتوى، السوشال ميديا، الهوية، الويب، المنتجات الرقمية، الاستراتيجية، والاستشارات.'
      ]
    },
    {
      id: 'definitions',
      title: '3. التعريفات',
      icon: FileText,
      content: [
        'لأغراض هذه الشروط والأحكام، يكون للكلمات التالية المعاني الموضحة أدناه:',
        '“AGMA” أو “نحن” أو “الوكالة”: تعني AGMA — Agency Marketing Generation AI، أو مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية.',
        '“الموقع”: يعني موقع AGMA الإلكتروني على النطاق agma.com.sa وجميع صفحاته التابعة.',
        '“المستخدم” أو “أنت”: يعني أي شخص يزور الموقع أو يستخدمه أو يرسل طلبًا من خلاله.',
        '“العميل”: يعني أي شخص أو جهة تطلب خدمة أو توافق على عرض سعر أو تدخل في علاقة تعاقدية مع AGMA.',
        '“الخدمات”: تعني خدمات التسويق، الذكاء الاصطناعي، الأتمتة، الإعلانات، السيو، المحتوى، السوشال ميديا، الهوية، الويب، الاستشارات، وأي خدمات أخرى تقدمها AGMA.'
      ]
    },
    {
      id: 'usage',
      title: '4. استخدام الموقع',
      icon: Lock,
      content: [
        'يجوز لك استخدام الموقع لأغراض نظامية ومهنية فقط، مثل التعرف على خدمات AGMA، طلب عرض سعر، حجز مكالمة، أو التواصل معنا.',
        'يحظر عليك استخدام الموقع في أي من الحالات التالية:',
        '• استخدام الموقع بطريقة تخالف الأنظمة المعمول بها في المملكة العربية السعودية.',
        '• محاولة تعطيل الموقع أو اختراقه أو التأثير على بنيته التقنية.',
        '• إرسال بيانات غير صحيحة أو مضللة أو منتحلة.',
        '• نسخ أو إعادة استخدام محتوى الموقع دون إذن كتابي.',
        '• استخدام الموقع لإرسال رسائل مزعجة أو ضارة.'
      ]
    },
    {
      id: 'information',
      title: '5. معلومات الموقع والخدمات',
      icon: Info,
      content: [
        'نسعى إلى عرض معلومات خدماتنا بدقة ووضوح. ومع ذلك، فإن المعلومات المنشورة على الموقع هي لأغراض تعريفية وتسويقية عامة، ولا تُعد عرضًا ملزمًا أو ضمانًا بتنفيذ خدمة محددة بنفس التفاصيل المذكورة في الموقع.',
        'تخضع كل خدمة يتم تنفيذها فعليًا لنطاق عمل مستقل يوضح التفاصيل الفنية والمالية والزمنية بوضوح.'
      ]
    },
    {
      id: 'pricing',
      title: '6. العروض والأسعار',
      icon: Zap,
      content: [
        'قد يحتوي الموقع على أسعار إرشادية لبعض الخدمات. هذه الأسعار تهدف إلى إعطاء تصور عام عن تكلفة الخدمات، ولا تُعد أسعارًا نهائية أو ملزمة.',
        'قد تختلف الأسعار حسب حجم المشروع، التنفيذ، التخصيص، والأدوات المطلوبة. لا يصبح أي سعر أو عرض ملزمًا إلا بعد إرساله رسميًا من AGMA واعتماده من العميل.'
      ]
    },
    {
      id: 'communication',
      title: '7. طلبات عروض الأسعار والتواصل',
      icon: Mail,
      content: [
        'عند إرسال طلب عرض سعر أو تعبئة نموذج تواصل، فإنك تقر بأن المعلومات التي تقدمها صحيحة وكاملة قدر الإمكان.',
        'تحتفظ AGMA بحق قبول أو رفض أي طلب، أو طلب معلومات إضافية قبل تقديم عرض السعر.'
      ]
    },
    {
      id: 'booking',
      title: '8. الحجز والمكالمات الاستراتيجية',
      icon: Clock,
      content: [
        'قد يتيح الموقع إمكانية طلب أو حجز مكالمة استراتيجية عبر أدوات مثل Calendly أو Google Calendar.',
        'لا يعني إرسال الطلب أو اختيار وقت مبدئي تأكيد الاجتماع إلا بعد تأكيده من فريق AGMA أو من الأداة المعتمدة.'
      ]
    },
    {
      id: 'workflow',
      title: '9. نطاق العمل واعتماد المشاريع',
      icon: ShieldCheck,
      content: [
        'لا يبدأ تنفيذ أي مشروع إلا بعد اعتماد نطاق العمل والرسوم وآلية الدفع، وسداد الدفعة المطلوبة إن وجدت.',
        'أي طلبات إضافية خارج النطاق المعتمد تُعد أعمالًا إضافية، وقد تتطلب عرض سعر منفصلًا.'
      ]
    },
    {
      id: 'obligations',
      title: '10. التزامات العميل',
      icon: Users,
      content: [
        'يلتزم العميل بتزويد AGMA بالمعلومات والمواد المطلوبة في الوقت المناسب، والحصول على الحقوق اللازمة لأي مواد يزود بها الوكالة.',
        'أي تأخير من العميل في إرسال المواد أو الموافقات أو الدفعات قد يؤدي إلى تمديد الجدول الزمني دون مسؤولية على AGMA.'
      ]
    },
    {
      id: 'responsibility',
      title: '11. مسؤوليات AGMA',
      icon: Scale,
      content: [
        'تلتزم AGMA ببذل عناية مهنية معقولة في تقديم الخدمات المتفق عليها وفق نطاق العمل المعتمد والحفاظ على سرية معلومات العميل.',
        'لا تتحمل AGMA مسؤولية التأخير أو ضعف النتائج الناتج عن تأخر العميل أو عوامل خارجة عن سيطرة الوكالة.'
      ]
    },
    {
      id: 'advertising',
      title: '12. الخدمات الإعلانية والحملات المدفوعة',
      icon: Zap,
      content: [
        'تلتزم AGMA بإدارة الحملات وفق أفضل الممارسات المهنية، ولكن نتائج الإعلانات قد تتأثر بعوامل عديدة مثل جودة المنتج، المنافسة، وسياسات المنصات.',
        'لا تضمن AGMA عددًا محددًا من المبيعات أو الأرباح بشكل مطلق.'
      ]
    },
    {
      id: 'ai-automation',
      title: '13. خدمات الذكاء الاصطناعي والأتمتة',
      icon: Zap,
      content: [
        'تقوم AGMA ببناء حلول ذكية لتحسين الإنتاجية، ولكن دقتها تعمد على جودة البيانات المتوفرة.',
        'يقر العميل بأن مخرجات الذكاء الاصطناعي قد تحتاج مراجعة بشرية ولا ينبغي الاعتماد عليها كلياً في القرارات عالية المخاطر.'
      ]
    },
    {
      id: 'ip',
      title: '14. الملكية الفكرية',
      icon: ShieldCheck,
      content: [
        'جميع محتويات الموقع مملوكة لـ AGMA ومحمية بموجب حقوق الملكية الفكرية.',
        'تنتقل ملكية مخرجات المشاريع النهائية إلى العميل بعد سداد كامل المستحقات، وبالحدود الموضحة في الاتفاق المكتوب.'
      ]
    },
    {
      id: 'liability',
      title: '15. حدود المسؤولية',
      icon: AlertCircle,
      content: [
        'لا تتحمل AGMA أي مسؤولية عن الخسائر غير المباشرة أو فقدان الأرباح الناتج عن استخدام المخرجات بطرق غير مناسبة.',
        'في جميع الأحوال، لا تتجاوز مسؤولية AGMA، إن ثبتت، قيمة المبالغ المدفوعة فعليًا مقابل الخدمة محل النزاع.'
      ]
    },
    {
      id: 'law',
      title: '16. القانون المعمول به وتسوية النزاعات',
      icon: Globe,
      content: [
        'تخضع هذه الشروط والأنظمة المعمول بها في المملكة العربية السعودية.',
        'يتم تسوية أي نزاع وديًا أولاً، وفي حال تعذر ذلك يتم اللجوء للقضاء المختص في المملكة.'
      ]
    }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-pure-ink font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-24 px-6">
        <div className="grid-pattern" />
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5 text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">
              Terms & Conditions
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              الشروط والأحكام
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              تنظم هذه الشروط والأحكام استخدامك لموقع AGMA والتفاعل مع خدماتنا الرقمية وطلبات التواصل وعروض الأسعار. يرجى قراءتها بعناية قبل استخدام الموقع.
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-medium text-sm font-bold">
              <History size={16} className="text-pulse-orange" />
              <span>آخر تحديث: {currentDate}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12">
            {sections.map((section) => (
              <article key={section.id} id={section.id} className="group border-r-2 border-transparent hover:border-pulse-orange/30 pr-6 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-gray-dark/20 rounded-sm flex items-center justify-center text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow transition-colors">
                     <section.icon size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-snow">{section.title}</h2>
                </div>
                <div className="space-y-4">
                  {section.content.map((p, idx) => (
                    <p key={idx} className="text-gray-medium text-lg leading-relaxed font-medium">
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            ))}

            {/* Detailed Contact Section */}
            <div className="pt-16 border-t border-gray-dark space-y-12">
               <div className="geometric-card bg-gray-dark/5 p-8 border-gray-dark">
                  <h3 className="text-2xl font-bold text-snow mb-8">معلومات التواصل القانونية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 text-sm text-gray-medium">
                       <p className="text-snow font-bold">AGMA — Agency Marketing Generation AI</p>
                       <p>مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية</p>
                       <p>الرياض، المملكة العربية السعودية</p>
                       <p>السجل التجاري: 1009127528</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-snow font-medium">
                        <Mail size={16} className="text-pulse-orange" /> info@agma.com.sa
                      </div>
                      <div className="flex items-center gap-3 text-snow font-medium">
                        <Phone size={16} className="text-pulse-orange" /> +966 58 119 5387
                      </div>
                      <div className="flex items-center gap-3 text-snow font-medium">
                        <Search size={16} className="text-pulse-orange" /> agma.com.sa
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 border-t border-gray-dark">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <h2 className="text-4xl lg:text-6xl font-bold text-snow leading-tight">
              لديك سؤال قبل <br />
              <span className="text-pulse-orange">بدء التعاون؟</span>
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl font-medium max-w-2xl mx-auto">
              فريقنا جاهز لتوضيح أي نقطة متعلقة بالخدمات، العروض، أو طريقة العمل قبل اعتماد المشروع.
            </p>
            <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
              تواصل معنا الآن
            </Link>
            
            <div className="pt-12 flex justify-center gap-10 text-xs text-gray-medium font-bold uppercase tracking-widest border-t border-gray-dark">
              <Link href="/privacy-policy" className="hover:text-snow">سياسة الخصوصية</Link>
              <Link href="/contact" className="hover:text-snow">اتصل بنا</Link>
              <Link href="/services" className="hover:text-snow">الخدمات</Link>
              <Link href="/pricing" className="hover:text-snow">التسعير</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Legal Footer Note */}
      <div className="bg-pure-ink py-8 px-6 border-t border-gray-dark">
        <div className="container mx-auto text-center">
          <p className="text-[10px] text-gray-dark font-medium uppercase tracking-widest leading-relaxed">
            هذه الشروط لأغراض التوضيح وتنظيم استخدام الموقع والخدمات، ولا تُعد بديلًا عن الاستشارة القانونية المتخصصة.
          </p>
        </div>
      </div>

      {/* Suggested Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "الشروط والأحكام | AGMA",
            "url": "https://agma.com.sa/terms",
            "datePublished": "2024-05-14",
            "dateModified": "2024-05-14",
            "description": "شروط وأحكام استخدام موقع AGMA وطلب خدمات التسويق والأتمتة والذكاء الاصطناعي.",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "الرياض",
                "addressCountry": "SA"
              }
            }
          }),
        }}
      />
    </main>
  );
}
