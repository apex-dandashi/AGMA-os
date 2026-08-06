'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  History, 
  MapPin, 
  Settings, 
  Eye, 
  Target, 
  ShieldCheck, 
  Zap, 
  Handshake, 
  Box, 
  ChevronLeft,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Magnetic from '@/components/ui/Magnetic';
import Tilt from '@/components/ui/Tilt';

export default function AboutPage() {
  const values = [
    { 
      title: 'السرعة الذكية', 
      desc: 'نحن لا نتحرك بسرعة فحسب، بل نتحرك بالسرعة التي تمليها البيانات والذكاء الاصطناعي، مما يقلل وقت التنفيذ من شهور إلى أيام.', 
      icon: Zap 
    },
    { 
      title: 'الشفافية الكاملة', 
      desc: 'بينما يعقد الآخرون التقنية، نحن نبسطها. ستعرف دائماً أين تذهب ميزانيتك، وكيف يتم اتخاذ كل قرار تسويقي بناءً على البيانات.', 
      icon: Eye 
    },
    { 
      title: 'الشراكة الحقيقية', 
      desc: 'نحن لا نعمل "لديك"، بل نعمل "معك". نجاح علامتك هو المقياس الوحيد لأدائنا، ومصالحنا مرتبطة كلياً بنموك المستدام.', 
      icon: Handshake 
    },
    { 
      title: 'الإتقان والأمانة', 
      desc: 'نلتزم بأعلى معايير الجودة في الإنتاج الرقمي، مع الحفاظ على خصوصية بياناتك وأمان منظومتك التسويقية في كل خطوة.', 
      icon: ShieldCheck 
    },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-pure-ink">
      <Header />
      
      {/* Meta Title/Description set in layout if using Server Components, 
          but since this is 'use client' we can handle it via Head or metadata logic.
          For AI Studio Build, we'll keep it focused on the UI. */}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="grid-pattern" />
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5">
              <span className="text-pulse-orange text-xs font-bold tracking-widest uppercase">الرياض، قلب المملكة</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto px-4">
              من الرياض، وُلدت وكالة <br className="hidden sm:block" />
              <span className="text-pulse-orange">جيل الذكاء الاصطناعي</span>.
            </h1>
            <p className="text-gray-medium text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium px-6">
              تأسست AGMA لتقود تحولاً جديداً في التسويق؛ حيث لا يكون الذكاء الاصطناعي أداة جانبية، بل بنية تشغيلية كاملة تصنع السرعة، الدقة، والنمو القابل للقياس.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
              <Magnetic className="w-full sm:w-auto">
                <Link href="/contact" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                  احجز مكالمة استراتيجية
                </Link>
              </Magnetic>
              <Magnetic className="w-full sm:w-auto">
                <Link href="/agma-method" className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                  استكشف منهجيتنا
                </Link>
              </Magnetic>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="w-12 h-12 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange">
                <History size={24} />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-snow leading-tight">
                قصة AGMA: <br />
                استجابة للحظة <span className="text-pulse-orange">التحول الكبير</span>.
              </h2>
              <div className="space-y-6 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  وُلدت AGMA في لحظة تحول تسويقي تاريخي، حيث بدأت تقنيات الذكاء الاصطناعي تعيد تعريف رحلة العميل بالكامل؛ من لحظة البحث الأولى، مروراً بقرار الشراء، وصولاً إلى الولاء المستدام.
                </p>
                <p>
                  لاحظنا أن معظم الوكالات التقليدية تحاول &quot;ترقيع&quot; عملياتها القديمة بإضافة أدوات ذكاء اصطناعي كزينة أو أداة جانبية لزيادة الإنتاجية فقط. لكننا في AGMA، اخترنا الطريق الأصعب والأكثر فاعلية: بناء وكالة &quot;Native-AI&quot; من الصفر.
                </p>
                <p>
                  منهجيتنا ليست مجرد استخدام للتقنية، بل هي دمج كامل بين الإبداع البشري الفائق والسرعة الحوسبية العالية، لنخرج بنتائج لم تكن ممكنة من قبل.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-sm bg-gray-dark/30 border border-gray-dark overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-pure-ink to-transparent z-10" />
                <div className="grid-pattern opacity-[0.05]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-pulse-orange font-black text-[200px] opacity-10 font-mono">AI</div>
                </div>
                <div className="absolute bottom-12 left-12 right-12 z-20">
                  <p className="text-3xl font-bold text-snow mb-4 leading-tight">
                    بنينا AGMA لتكون &quot;Native-AI&quot; — حيث البيانات هي الوقود والأتمتة هي المحرك.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* From Riyadh to Gulf */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-pulse-orange/10 rounded-full flex items-center justify-center text-pulse-orange">
                <MapPin size={32} />
              </div>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-snow">
              من الرياض إلى الخليج
            </h2>
            <p className="text-gray-medium text-xl leading-relaxed font-medium">
              نحن سعوديو المنشأ، نمتلك فهماً عميقاً ونابعاً من الجذور للحراك الثقافي والاقتصادي في المملكة. ندرك سرعة التحول التي تفرضها رؤية 2030، ونعرف لغة السوق السعودي والخليجي ليس كنصوص مترجمة، بل كواقع نعيشه يومياً.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
              <Tilt className="h-full">
                <div className="geometric-card p-8 bg-gray-dark/5 h-full">
                  <div className="text-3xl font-black text-pulse-orange mb-2 font-heading">01</div>
                  <h4 className="text-snow font-bold mb-2">اللغة المحلية</h4>
                  <p className="text-xs text-gray-medium font-medium leading-relaxed">نكتب ونتواصل بلهجة السوق وروحه، بعيداً عن القوالب المترجمة الجاهزة.</p>
                </div>
              </Tilt>
              <Tilt className="h-full">
                <div className="geometric-card p-8 bg-gray-dark/5 h-full">
                  <div className="text-3xl font-black text-pulse-orange mb-2 font-heading">02</div>
                  <h4 className="text-snow font-bold mb-2">سرعة الرؤية</h4>
                  <p className="text-xs text-gray-medium font-medium leading-relaxed">نتحرك بنفس إيقاع التحول الوطني، حيث الوقت هو المورد الأثمن لعملائنا.</p>
                </div>
              </Tilt>
              <Tilt className="h-full">
                <div className="geometric-card p-8 bg-gray-dark/5 h-full">
                  <div className="text-3xl font-black text-pulse-orange mb-2 font-heading">03</div>
                  <h4 className="text-snow font-bold mb-2">خبرة البيانات</h4>
                  <p className="text-xs text-gray-medium font-medium leading-relaxed">نمتلك مخازن بيانات ثرية حول سلوك المستهلك المحلي والفرص القطاعية.</p>
                </div>
              </Tilt>
            </div>
          </div>
        </div>
      </section>

      {/* Model Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/10 relative">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
                {[
                  { label: 'البحث والتحليل', icon: Eye },
                  { label: 'إنتاج المحتوى', icon: Zap },
                  { label: 'بناء الحملات', icon: Target },
                  { label: 'أتمتة العمليات', icon: Settings },
                  { label: 'القياس الفوري', icon: Box },
                  { label: 'التحسين المستمر', icon: ArrowLeft },
                ].map((item, i) => (
                  <Tilt key={i}>
                    <div className="geometric-card flex flex-col items-center justify-center p-8 gap-4 group h-full">
                      <item.icon className="text-pulse-orange w-8 h-8 group-hover:scale-110 transition-transform" />
                      <span className="text-snow font-bold text-sm text-center">{item.label}</span>
                    </div>
                  </Tilt>
                ))}
              </div>
             <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-4xl lg:text-5xl font-bold text-snow leading-tight">
                  نحن لا نستخدم الذكاء الاصطناعي... <br />
                  <span className="text-pulse-orange italic">نحن نعيش به.</span>
                </h2>
                <div className="space-y-6 text-gray-medium text-lg leading-relaxed font-medium">
                  <p>
                    في AGMA، الذكاء الاصطناعي هو العمود الفقري لكل عملية نقوم بها. نموذج تشغيلنا &quot;AI-native&quot; يعني أن كل رحلة عميل، وكل استراتيجية محتوى، وكل حملة إعلانية، تمر عبر منظومة أتمتة ذكية تضمن الدقة المطلقة.
                  </p>
                  <p>
                    هذا النموذج يسمح لفريقنا بالتركيز على ما يتقنه البشر فقط: الرؤية الاستراتيجية الحكيمة، الابتكار الإبداعي الخارق، وبناء العلاقات الإنسانية العميقة مع عملائنا.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div className="geometric-card p-12 bg-gray-dark/5 flex flex-col items-center text-center space-y-6">
              <Eye className="text-pulse-orange w-12 h-12" />
              <h2 className="text-4xl font-bold text-snow">رؤيتنا</h2>
              <p className="text-gray-medium text-xl leading-relaxed font-medium max-w-sm">
                أن نقود التحول التسويقي في المنطقة عبر الذكاء الاصطناعي، ونضع معايير جديدة للأداء الرقمي الفائق.
              </p>
            </div>
            <div className="geometric-card p-12 bg-gray-dark/5 flex flex-col items-center text-center space-y-6">
              <Target className="text-pulse-orange w-12 h-12" />
              <h2 className="text-4xl font-bold text-snow">رسالتنا</h2>
              <p className="text-gray-medium text-xl leading-relaxed font-medium max-w-sm">
                نحوّل كل علامة تجارية طموحة إلى آلة نمو ذكية، مبنية بالذكاء الاصطناعي ومتجذرة في قلب السوق المحلي.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 bg-pure-ink">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow mb-6">قيمنا الراسخة</h2>
            <p className="text-gray-medium max-w-2xl mx-auto font-medium">
              المبادئ التي تحكم كل سطر كود، وكل تصميم إبداعي، وكل مكالمة استراتيجية نجريها معك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {values.map((value, i) => (
              <div key={i} className="geometric-card p-10 bg-gray-dark/5 space-y-6 group">
                <div className="w-14 h-14 bg-pulse-orange/5 rounded-sm flex items-center justify-center text-pulse-orange transition-colors group-hover:bg-pulse-orange group-hover:text-snow">
                  <value.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-snow">{value.title}</h3>
                <p className="text-gray-medium text-sm leading-relaxed font-medium">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="py-24 px-6 relative border-y border-gray-dark bg-deep-navy/10">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-pulse-orange rounded-sm flex items-center justify-center rotate-45">
                   <Box className="text-snow w-16 h-16 -rotate-45" />
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-snow">لماذا نوجد؟</h2>
                <p className="text-gray-medium text-lg leading-relaxed font-medium">
                  وُجدت AGMA لتسد الفجوة الهائلة في السوق؛ الفجوة بين التقنية المعقدة والأهداف التجارية المباشرة. نحن نوجد للعلامات التي ملّت من التعامل مع عشرات المزودين، وتبحث عن شريك واحد متكامل يجمع بين استراتيجية AI، الإبداع الفني، تسويق الأداء، وتطوير المنتجات الرقمية تحت سقف واحد.
                </p>
                <Link href="/services" className="text-pulse-orange font-bold flex items-center gap-2 group hover:underline">
                  استعرض منظومة خدماتنا المتكاملة <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10 px-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 text-snow leading-tight">
                هل تبحث عن وكالة تفكر كشريك... <br />
                <span className="text-pulse-orange">وتتحرك بسرعة الذكاء الاصطناعي؟</span>
              </h2>
              <p className="text-gray-medium text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نبدأ من فهم علامتك، ثم نبني منظومة نمو تناسب طموحك وجنون تطلعاتك.
              </p>
              <div className="flex justify-center w-full">
                <Magnetic className="w-full sm:w-auto">
                  <Link href="/contact" className="btn-primary text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 w-full sm:w-auto inline-block text-center shadow-2xl shadow-pulse-orange/20">
                    احجز مكالمة استراتيجية الآن
                  </Link>
                </Magnetic>
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
            "@type": "AboutPage",
            "mainEntity": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي",
              "description": "وكالة سعودية Native-AI مقرها الرياض تخدم السوق الخليجي بحلول تسويقية مدعومة بالذكاء الاصطناعي.",
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
