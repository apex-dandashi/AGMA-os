'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Info, 
  Cookie, 
  BarChart3, 
  Share2, 
  History, 
  Search,
  Mail,
  Phone,
  Scaling,
  Users,
  ChevronLeft,
  Settings,
  Database,
  Target,
  Globe,
  Send
} from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPageClient() {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen relative overflow-hidden bg-pure-ink">
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
              Privacy Policy
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              سياسة الخصوصية
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              نلتزم في AGMA بحماية خصوصية زوار موقعنا وعملائنا، ونتعامل مع البيانات الشخصية بمسؤولية وشفافية، وفق أفضل الممارسات والمعايير ذات العلاقة بحماية البيانات.
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-medium text-sm font-bold">
              <History size={16} className="text-pulse-orange" />
              <span>آخر تحديث: {currentDate}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-16">
            
            {/* Introduction */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">1. مقدمة</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحفظ ومشاركة البيانات الشخصية عند زيارة موقع AGMA أو استخدام نماذج التواصل أو طلب الخدمات أو حجز مكالمة أو التفاعل مع قنواتنا الرقمية.
                </p>
                <p>
                  باستخدامك للموقع أو إرسال أي بيانات من خلاله، فإنك تقر بأنك قرأت هذه السياسة وفهمت كيفية تعاملنا مع بياناتك.
                </p>
              </div>
            </article>

            {/* Who We Are */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Scaling className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">2. من نحن</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  AGMA — Agency Marketing Generation AI، والمعروفة عربيًا باسم وكالة جيل الذكاء الاصطناعي، هي وكالة سعودية مقرها الرياض، تعمل تحت الاسم القانوني: <span className="text-snow">مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية</span>، سجل تجاري رقم <span className="text-snow">1009127528</span>.
                </p>
                <p>
                  تتخصص AGMA في التسويق المدفوع بالذكاء الاصطناعي، الأتمتة، الأداء التسويقي، المحتوى، السيو، الويب، الهوية، الاستشارات، والعلاقات العامة.
                </p>
              </div>
            </article>

            {/* Data We Collect */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">3. البيانات التي قد نجمعها</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>قد نجمع البيانات التالية:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "الاسم الكامل",
                    "اسم الشركة",
                    "رقم الجوال",
                    "البريد الإلكتروني",
                    "نوع الخدمة المطلوبة",
                    "الميزانية المتوقعة",
                    "محتوى الرسالة المرسلة عبر النماذج",
                    "بيانات حجز المكالمات أو المواعيد",
                    "بيانات الاستخدام (الصفحات، مدة الجلسة، المصدر)",
                    "بيانات تقنية (الجهاز، المتصفح، IP، اللغة)",
                    "بيانات الحملات والتحويلات الإعلانية"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 border border-gray-dark bg-gray-dark/5 p-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-pulse-orange shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {/* How We Collect Data */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">4. كيف نجمع البيانات</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>البيانات قد تُجمع عبر:</p>
                <ul className="space-y-3">
                  {[
                    "نموذج التواصل وطلب عرض السعر",
                    "حجز المكالمات أو الاجتماعات (Calendly, Google Calendar أو نماذجنا)",
                    "الاشتراك في النشرات أو التحديثات",
                    "أدوات التحليلات وملفات تعريف الارتباط Cookies",
                    "الحملات الإعلانية على المنصات المختلفة",
                    "التواصل المباشر عبر البريد الإلكتروني أو الهاتف أو واتساب",
                    "أنظمة إدارة العملاء مثل Odoo أو Notion أو Google Sheets"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <ChevronLeft size={18} className="text-pulse-orange mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {/* Why We Use Your Data */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">5. لماذا نستخدم بياناتك</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>نستخدم البيانات للأغراض التالية:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    "الرد على الاستفسارات والطلبات",
                    "تقديم عروض أسعار وخطط خدمات مناسبة",
                    "جدولة المكالمات والاجتماعات",
                    "إدارة العلاقة مع العملاء",
                    "إرسال التحديثات أو العروض التسويقية",
                    "تحسين تجربة الموقع وأداء الحملات",
                    "قياس التحويلات ومصادر الزيارات",
                    "الامتثال للمتطلبات القانونية والتنظيمية",
                    "حماية الموقع ومنع إساءة الاستخدام"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-pulse-orange font-mono font-bold">/</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {/* Legal Basis */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">6. الأساس النظامي لمعالجة البيانات</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  نعالج البيانات الشخصية عندما يكون ذلك ضروريًا لتقديم خدماتنا، أو بناءً على موافقتك، أو لتنفيذ طلب قدمته لنا، أو لاتخاذ خطوات قبل الدخول في علاقة تعاقدية، أو للامتثال لالتزام نظامي، أو لتحقيق مصلحة مشروعة لا تتعارض مع حقوقك النظامية.
                </p>
              </div>
            </article>

            {/* Cookies */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">7. ملفات تعريف الارتباط Cookies</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  يستخدم موقع AGMA ملفات تعريف الارتباط Cookies وتقنيات مشابهة لتحسين تجربة التصفح، حفظ بعض التفضيلات، فهم سلوك الزوار، قياس أداء الصفحات، وتحسين الحملات الإعلانية.
                </p>
                <p>
                  يمكنك التحكم في ملفات تعريف الارتباط أو تعطيلها من خلال إعدادات المتصفح. قد يؤدي تعطيل بعض الملفات إلى التأثير على بعض وظائف الموقع أو دقة القياس والتحسين.
                </p>
              </div>
            </article>

            {/* Analytics & Ads */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">8. أدوات التحليلات والإعلانات</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  قد نستخدم أدوات خارجية مثل Google Analytics وMeta Pixel وGoogle Ads Tracking أو أدوات مشابهة لقياس الزيارات، فهم مصادر الحركة، تتبع التحويلات، وتحسين الحملات الإعلانية وتجربة المستخدم.
                </p>
                <p>
                  قد تجمع هذه الأدوات بيانات تقنية وسلوكية وفق سياساتها الخاصة، وقد تُستخدم لإعادة الاستهداف الإعلاني أو قياس فعالية الإعلانات.
                </p>
              </div>
            </article>

            {/* CRM */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">9. أنظمة إدارة العملاء والتواصل</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  قد تتم إدارة بيانات العملاء والطلبات عبر أدوات داخلية أو خارجية مثل Odoo أو Notion أو Google Sheets أو البريد الإلكتروني أو واتساب، وذلك لأغراض المتابعة، تنظيم الطلبات، إعداد عروض الأسعار، إدارة العملاء المحتملين، وتحسين جودة الخدمة.
                </p>
              </div>
            </article>

            {/* Third Parties */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">10. مشاركة البيانات مع أطراف ثالثة</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>لا نبيع بياناتك الشخصية لأي طرف ثالث.</p>
                <p>قد نشارك بعض البيانات عند الحاجة وبالحد الأدنى اللازم مع: مزودي الاستضافة، أدوات التحليلات، أدوات الحجز، أنظمة CRM، أدوات البريد، مزودي الخدمات المهنية، أو الجهات الرسمية عند وجود طلب نظامي.</p>
                <p>نحرص على أن تكون مشاركة البيانات مرتبطة بالغرض الذي جُمعت من أجله، وبما لا يتعارض مع الأنظمة ذات العلاقة.</p>
              </div>
            </article>

            {/* Transfer Outside KSA */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">11. نقل البيانات خارج المملكة</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  قد تتم معالجة بعض البيانات أو تخزينها عبر مزودي خدمات تقنية أو سحابية خارج المملكة العربية السعودية، مثل أدوات التحليلات، الإعلانات، الحجز، البريد الإلكتروني، أو أنظمة إدارة العملاء.
                </p>
                <p>
                  عند حدوث ذلك، نحرص على اتخاذ التدابير المناسبة لحماية البيانات، والحد من مشاركة البيانات إلى ما يلزم فقط، والالتزام بالمتمتطلبات النظامية ذات العلاقة قدر الإمكان.
                </p>
              </div>
            </article>

            {/* Retention */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <History className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">12. مدة الاحتفاظ بالبيانات</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  نحتفظ بالبيانات الشخصية فقط للمدة اللازمة لتحقيق الأغراض التي جُمعت من أجلها، أو للمدة المطلوبة نظاميًا، أو للمدة اللازمة لحماية حقوقنا ومصالحنا المشروعة. بعد انتهاء الحاجة، نقوم بحذفها أو أرشفتها أو إخفاء هويتها متى كان ذلك مناسبًا وممكنًا.
                </p>
              </div>
            </article>

            {/* Security */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">13. حماية البيانات</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  نتخذ تدابير فنية وتنظيمية معقولة لحماية البيانات الشخصية من الوصول غير المصرح به، أو الفقدان، أو التعديل، أو الإفصاح غير المشروع. تشمل هذه التدابير تقييد الوصول، استخدام مزودي خدمات موثوقين، وتطبيق ممارسات أمنية مناسبة.
                </p>
                <p>
                  مع ذلك، لا توجد وسيلة نقل أو تخزين إلكتروني آمنة بنسبة 100%، لذلك نعمل باستمرار على تقليل المخاطر وتحسين إجراءات الحماية.
                </p>
              </div>
            </article>

            {/* Rights */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">14. حقوقك</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>وفق الأنظمة ذات العلاقة، قد يكون لك الحق في: معرفة ما إذا كنا نعالج بياناتك، الوصول إليها، طلب تصحيحها، طلب حذفها، سحب الموافقة، الاعتراض على المعالجة، أو طلب تقييدها.</p>
                <p>لممارسة أي من هذه الحقوق، يمكنك التواصل معنا عبر البريد الإلكتروني: <span className="text-pulse-orange font-bold">info@agma.com.sa</span> أو عبر صفحة <Link href="/contact" className="text-snow underline">التواصل</Link>.</p>
              </div>
            </article>

            {/* Direct Marketing */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Send className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">15. التسويق المباشر</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  قد نستخدم بيانات التواصل لإرسال تحديثات أو عروض أو محتوى تسويقي متعلق بخدمات AGMA، وذلك عند وجود موافقة أو تواصل سابق أو أساس نظامي مناسب. يمكنك طلب إيقاف الرسائل التسويقية في أي وقت عبر البريد الإلكتروني أو رابط إلغاء الاشتراك المتاح.
                </p>
              </div>
            </article>

            {/* Children Privacy */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">16. خصوصية الأطفال</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  خدمات AGMA موجهة للشركات والجهات المهنية، ولا نستهدف جمع بيانات الأطفال أو القُصّر عمدًا. إذا تبين لنا جمع مثل هذه البيانات دون أساس نظامي، فسنتخذ الإجراءات المناسبة لحذفها.
                </p>
              </div>
            </article>

            {/* External Links */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">17. الروابط الخارجية</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  قد يحتوي موقعنا على روابط لمواقع خارجية. لسنا مسؤولين عن ممارسات الخصوصية الخاصة بها، وننصح بمراجعة سياسات الخصوصية الخاصة بتلك المواقع قبل مشاركة أي بيانات.
                </p>
              </div>
            </article>

            {/* Updates to Policy */}
            <article className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="text-pulse-orange" size={24} />
                <h2 className="text-2xl lg:text-3xl font-bold text-snow">18. تحديثات سياسة الخصوصية</h2>
              </div>
              <div className="space-y-4 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  قد نقوم بتحديث هذه السياسة من وقت لآخر لتعكس أي تغييرات في خدماتنا أو المتطلبات النظامية. سيتم نشر النسخة المحدثة هنا مع توضيح تاريخ التحديث.
                </p>
              </div>
            </article>

            {/* Contact Info Detail */}
            <article className="space-y-8 p-10 border border-gray-dark bg-gray-dark/5">
              <h2 className="text-2xl lg:text-3xl font-bold text-snow">19. التواصل بخصوص الخصوصية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 text-sm text-gray-medium">
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
            </article>

          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 border-t border-gray-dark">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <h2 className="text-4xl lg:text-6xl font-bold text-snow leading-tight">
              هل لديك سؤال بخصوص <br />
              <span className="text-pulse-orange">بياناتك؟</span>
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl font-medium max-w-2xl mx-auto">
              تواصل معنا وسنساعدك في فهم كيفية التعامل مع بياناتك أو تحديثها أو حذفها حسب ما يسمح به النظام.
            </p>
            <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
              تواصل معنا الآن
            </Link>
            
            <div className="pt-12 flex justify-center gap-10 text-xs text-gray-medium font-bold uppercase tracking-widest border-t border-gray-dark">
              <Link href="/contact" className="hover:text-snow">اتصل بنا</Link>
              <Link href="/services" className="hover:text-snow">الخدمات</Link>
              <Link href="/terms" className="hover:text-snow">الشروط والأحكام</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Legal Footer Note */}
      <div className="bg-pure-ink py-8 px-6 border-t border-gray-dark">
        <div className="container mx-auto text-center">
          <p className="text-[10px] text-gray-dark font-medium uppercase tracking-widest leading-relaxed">
            هذه السياسة لأغراض التوضيح والشفافية، ولا تُعد بديلًا عن الاستشارة القانونية المتخصصة.
          </p>
        </div>
      </div>

      {/* Suggested Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PrivacyPolicy",
            "name": "سياسة الخصوصية | AGMA",
            "url": "https://agma.com.sa/privacy-policy",
            "datePublished": "2024-05-14",
            "dateModified": "2024-05-14",
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
