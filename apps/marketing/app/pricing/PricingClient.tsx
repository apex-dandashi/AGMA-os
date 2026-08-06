'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Zap, 
  Cpu, 
  Sparkles, 
  Target, 
  BarChart3, 
  Search, 
  FileText, 
  Share2, 
  Users, 
  Smartphone, 
  Palette, 
  Layers, 
  Video, 
  Globe, 
  CheckCircle2,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import Magnetic from '@/components/ui/Magnetic';
import Tilt from '@/components/ui/Tilt';
import ScrollFocus from '@/components/ui/ScrollFocus';

export default function PricingPage() {
  const priceCategories = [
    {
      title: 'الذكاء الاصطناعي والأتمتة',
      icon: Bot,
      items: [
        { name: 'وكلاء AI مخصصون', price: 'يبدأ من 15,000 ر.س' },
        { name: 'أتمتة سير العمل', price: 'يبدأ من 4,500 ر.س لكل Workflow' },
        { name: 'روبوتات محادثة ذكية', price: 'يبدأ من 7,500 ر.س' },
        { name: 'تحسين الظهور بمحركات AI', price: 'يبدأ من 3,000 ر.س شهرياً' },
        { name: 'التحليل التنبؤي', price: 'عرض مخصص' },
      ]
    },
    {
      title: 'التسويق الأدائي',
      icon: Target,
      items: [
        { name: 'إعلانات السوشال المدفوعة', price: 'يبدأ من 2,500 ر.س شهرياً' },
        { name: 'إعلانات جوجل', price: 'يبدأ من 2,500 ر.س شهرياً' },
        { name: 'الإعلانات البرمجية', price: 'عرض مخصص' },
        { name: 'تحسين معدل التحويل', price: 'يبدأ من 3,800 ر.س' },
      ]
    },
    {
      title: 'السيو والمحتوى',
      icon: Search,
      items: [
        { name: 'تدقيق SEO شامل', price: 'من 2,200 إلى 4,800 ر.س' },
        { name: 'سيو عربي متخصص', price: 'يبدأ من 3,000 ر.س شهرياً' },
        { name: 'إنتاج المحتوى بالـ AI', price: 'يبدأ من 2,200 ر.س شهرياً' },
        { name: 'كتابة إعلانية', price: 'من 125 ر.س للقطعة' },
      ]
    },
    {
      title: 'السوشال ميديا',
      icon: Share2,
      items: [
        { name: 'إدارة السوشال ميديا', price: 'يبدأ من 2,800 ر.س شهرياً' },
        { name: 'استراتيجية السوشال', price: 'يبدأ من 5,000 ر.س مرة واحدة' },
        { name: 'إدارة المجتمع', price: 'يبدأ من 2,200 ر.س شهرياً' },
        { name: 'التسويق عبر المؤثرين', price: 'عرض مخصص' },
      ]
    },
    {
      title: 'الهوية والإبداع',
      icon: Palette,
      items: [
        { name: 'تصميم الشعار والهوية', price: 'من 3,000 إلى 12,500 ر.س' },
        { name: 'دليل الهوية البصرية', price: 'يبدأ من 4,400 ر.س' },
        { name: 'الموشن جرافيك', price: 'عرض مخصص' },
        { name: 'التغليف والمطبوعات', price: 'عرض مخصص' },
      ]
    },
    {
      title: 'الويب والرقمي',
      icon: Globe,
      items: [
        { name: 'تصميم وتطوير المواقع', price: 'يبدأ من 7,500 ر.س' },
        { name: 'المتاجر الإلكترونية', price: 'يبدأ من 9,000 ر.س' },
        { name: 'صفحات الهبوط', price: 'من 2,500 إلى 7,500 ر.س' },
        { name: 'تصميم واجهات التطبيقات', price: 'عرض مخصص' },
      ]
    }
  ];

  const requestSteps = [
    { title: 'اختر الخدمة', desc: 'حدد الخدمات التي تتقاطع مع أهدافك.' },
    { title: 'أرسل هدفك', desc: 'أخبرنا ماذا تريد أن تحقق فعلياً.' },
    { title: 'نراجع الاحتياج', desc: 'فريقنا يحلل الوضع الحالي والفرص.' },
    { title: 'نحدد النطاق', desc: 'نرسم لك خارطة عمل واضحة وبسيطة.' },
    { title: 'نرسل عرضاً واضحاً', desc: 'عرض مالي وفني مفصل وشامل.' },
    { title: 'نبدأ التنفيذ', desc: 'ننطلق بمجرد الاعتماد وتوقيع العقد.' }
  ];

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
               Pricing & Values
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              تسعير <span className="text-pulse-orange">واضح.</span> <br />
              ونطاق عمل مخصص.
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              نؤمن أن كل مشروع يحتاج نطاقاً يناسب هدفه، حجمه، وقنواته. لذلك نعرض أسعاراً إرشادية واضحة، ونبني العرض النهائي حسب احتياجك الفعلي.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
              <Magnetic className="w-full sm:w-auto">
                <Link href="/contact" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                  اطلب عرض سعر
                </Link>
              </Magnetic>
              <Magnetic className="w-full sm:w-auto">
                <Link href="/process" className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                   احجز مكالمة استراتيجية
                </Link>
              </Magnetic>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Philosophy */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div className="space-y-6 text-right">
                  <h2 className="text-3xl lg:text-5xl font-bold text-snow">فلسفة التسعير لدينا</h2>
                  <p className="text-gray-medium text-lg font-medium leading-relaxed">
                    السعر في AGMA ليس رقماً عشوائياً، بل هو انعكاس للموارد والخبرات والتقنيات التي تُسخر لتحقيق هدفك. نحن نبتعد عن &quot;الباقات الجاهزة&quot; التي قد تدفع فيها مقابل ما لا تحتاجه، ونركز على تخصيص النطاق (Scope) ليكون استثمارك في مكانه الصحيح.
                  </p>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'حجم العمل', icon: Layers },
                    { title: 'عدد القنوات', icon: Smartphone },
                    { title: 'عمق الاستراتيجية', icon: Target },
                    { title: 'حجم الإنتاج', icon: Video },
                    { title: 'مدة التعاون', icon: Clock },
                    { title: 'الأتمتة والتكامل', icon: Zap },
                    { title: 'التقارير والقياس', icon: BarChart3 },
                  ].map((factor, i) => (
                    <div key={i} className="p-6 bg-pure-ink border border-gray-dark flex items-center gap-4 group hover:border-pulse-orange/30 transition-all">
                       <factor.icon className="text-pulse-orange" size={20} />
                       <span className="text-snow font-bold text-sm">{factor.title}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Indicative Prices Grid */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">أسعار إرشادية حسب الفئة</h2>
            <p className="text-gray-medium mt-4 font-medium">لتكوين تصور أولي عن حجم الاستثمار المطلوب.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {priceCategories.map((cat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative h-full"
              >
                <ScrollFocus>
                  <Tilt className="h-full">
                    <div className="geometric-card bg-gray-dark/5 p-8 flex flex-col border border-gray-dark/50 h-full w-full">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-12 h-12 bg-pulse-orange/10 flex items-center justify-center text-pulse-orange">
                            <cat.icon size={24} />
                         </div>
                         <h3 className="text-xl font-bold text-snow">{cat.title}</h3>
                      </div>
                      
                      <div className="space-y-6 flex-grow">
                         {cat.items.map((item, ii) => (
                           <div key={ii} className="flex flex-col gap-1 border-b border-gray-dark/30 pb-4 last:border-0 last:pb-0">
                              <span className="text-gray-medium text-sm font-medium">{item.name}</span>
                              <span className="text-snow font-bold">{item.price}</span>
                           </div>
                         ))}
                      </div>
                    </div>
                  </Tilt>
                </ScrollFocus>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Disclaimer */}
      <section className="py-12 px-6">
         <div className="container mx-auto">
            <div className="max-w-4xl mx-auto bg-pulse-orange/5 border border-pulse-orange/20 p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
               <div className="w-12 h-12 bg-pulse-orange/10 rounded-full flex items-center justify-center text-pulse-orange flex-shrink-0">
                  <AlertCircle size={24} />
               </div>
               <div>
                  <h4 className="text-snow font-bold text-lg mb-1">تنبيه مهم</h4>
                  <p className="text-gray-medium text-sm font-medium leading-relaxed">
                    الأسعار المذكورة أعلاه هي أسعار إرشادية تبدأ من القيم الموضحة، وقد تختلف بالزيادة أو النقصان بناءً على حجم المشروع، عدد المخرجات الفنية، سرعة التنفيذ المطلوبة، ودرجة التخصيص التقني في كل عملية.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* How to get a quote? */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">كيف تحصل على عرض سعر؟</h2>
            <p className="text-gray-medium mt-4 font-medium">خطوات بسيطة تفصلك عن خطة عمل مخصصة لنموك.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
             {requestSteps.map((step, i) => (
               <ScrollFocus key={i}>
                 <Tilt className="h-full">
                   <div className="p-8 border border-gray-dark bg-pure-ink group hover:border-pulse-orange/30 transition-all flex flex-col items-center text-center h-full">
                      <span className="text-pulse-orange font-mono font-bold text-xs mb-4 block">0{i+1}</span>
                      <h4 className="text-snow font-bold mb-2 group-hover:text-pulse-orange transition-colors">{step.title}</h4>
                      <p className="text-gray-medium text-xs leading-relaxed">{step.desc}</p>
                   </div>
                 </Tilt>
               </ScrollFocus>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5 shadow-2xl shadow-pulse-orange/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-snow leading-tight">
                لا تعرف <br />
                <span className="text-pulse-orange">من أين تبدأ؟</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نحدد النطاق معك. أرسل لنا احتياجك، وسنقترح أفضل مسار بناءً على أهدافك وميزانيتك المتاحة لتحقيق أقصى أثر.
              </p>
              <div className="flex justify-center w-full">
                <Magnetic className="w-full sm:w-auto">
                  <Link href="/contact" className="btn-primary text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 uppercase tracking-wide w-full sm:w-auto inline-block text-center">
                    اطلب عرض سعر مخصص
                  </Link>
                </Magnetic>
              </div>
              <div className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest px-4">
                <Link href="/services" className="hover:text-snow">خدماتنا</Link>
                <Link href="/process" className="hover:text-snow">آلية العمل</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Suggested Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "خدمات وكالة AGMA وتكاليفها الإرشادية",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "أسعار إرشادية لخدمات الأتمتة، الذكاء الاصطناعي، التسويق الأدائي، السيو، السوشال ميديا، والويب.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "AGMA Pricing Catalog",
              "itemListElement": priceCategories.map(cat => ({
                "@type": "OfferCatalog",
                "name": cat.title,
                "itemListElement": cat.items.map(item => ({
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": item.name
                  },
                  "price": item.price,
                  "priceCurrency": "SAR"
                }))
              }))
            }
          }),
        }}
      />
    </main>
  );
}

// Additional icons
function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
