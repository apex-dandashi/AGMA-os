'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  PhoneCall, 
  Search, 
  ClipboardList, 
  Map, 
  Rocket, 
  LineChart, 
  CheckCircle2, 
  ChevronLeft,
  MessageSquare,
  FileText,
  Clock,
  ShieldCheck,
  TrendingUp,
  Brain,
  Handshake,
  Target,
  Zap,
  Users,
  Share2,
  BarChart3,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import Magnetic from '@/components/ui/Magnetic';

export default function ProcessPage() {
  const steps = [
    {
      title: 'مكالمة استكشافية',
      desc: 'نجلس معك لنفهم تطلعاتك، الوضع الحالي لعلامتك، التحديات التي تواجهها، والفرص الكامنة للنمو.',
      icon: PhoneCall
    },
    {
      title: 'تحليل سريع للفرصة',
      desc: 'فريقنا المكون من خبراء السيو، الأداء، والمحتوى يراجع قنواتك الحالية، موقعك، والمنافسين لتحديد الفجوات.',
      icon: Search
    },
    {
      title: 'تحديد نطاق العمل',
      desc: 'بناءً على التحليل، نقترح الخدمات والمخرجات المناسبة بالضبط مع جدول زمني ومسؤوليات واضحة.',
      icon: ClipboardList
    },
    {
      title: 'بناء الخطة (Roadmap)',
      desc: 'نضع خارطة طريق استراتيجية تشمل الأولويات التنفيذية، اختيار القنوات، وتحديد الأدوات التقنية المطلوبة.',
      icon: Map
    },
    {
      title: 'الإطلاق والتنفيذ',
      desc: 'تنتقل الخطة إلى حيز العمل عبر فريق متكامل. نعتمد على العمليات الرشيقة (Agile) لضمان السرعة والجودة.',
      icon: Rocket
    },
    {
      title: 'القياس والتحسين المستمر',
      desc: 'لأن العالم الرقمي يتغير، نحن نقرأ الأرقام دورياً، نحسن الحملات، ونطور الخطط بناءً على النتائج الفعلية.',
      icon: LineChart
    }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-pure-ink">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="grid-pattern" />
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5 text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">
              Working Process
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-5xl mx-auto">
              كيف نبدأ <br />
              <span className="text-pulse-orange">العمل معك؟</span>
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              نعمل بمنهجية واضحة، شفافة، وقابلة للقياس — من فهم الهدف إلى بناء الخطة، الإطلاق، والتحسين المستمر.
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

      {/* Collaboration Philosophy */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow">
              فلسفتنا في التعاون
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              في AGMA، نحن لا نبيع &quot;باقات&quot; جاهزة ونبدأ التنفيذ العشوائي. فلسفتنا تقوم على أن الحل الصحيح يبدأ بالفهم العميق. نحن شركاء نجاح، ولسنا مجرد منفذين. نبدأ دائماً بالاستماع لقصة علامتك، تحديد التحدي الحقيقي، ثم نقترح نطاق عمل مخصص يُركز حصراً على ما يحقق لك النمو والنتائج الملموسة.
            </p>
          </div>
        </div>
      </section>

      {/* Stages Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">مراحل التعاون</h2>
            <p className="text-gray-medium mt-4 font-medium">خطوات مدروسة تنقلك من التساؤل إلى الأثر.</p>
          </div>

          <div className="max-w-5xl mx-auto relative">
             <div className="absolute top-0 bottom-0 right-8 lg:right-1/2 w-px bg-gray-dark/50 hidden md:block" />
             
             <div className="space-y-12">
               {steps.map((step, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: i % 2 === 0 ? 20 : -20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                 >
                   <div className="flex-1 w-full text-right">
                      <div className={`p-8 bg-gray-dark/5 border border-gray-dark hover:border-pulse-orange/30 transition-all group ${i % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'}`}>
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-pulse-orange/10 flex items-center justify-center text-pulse-orange font-mono font-bold">
                               0{i+1}
                            </div>
                            <h3 className="text-2xl font-bold text-snow group-hover:text-pulse-orange transition-colors">{step.title}</h3>
                         </div>
                         <p className="text-gray-medium leading-relaxed font-medium">{step.desc}</p>
                      </div>
                   </div>
                   
                   <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-pure-ink border-2 border-pulse-orange flex items-center justify-center text-pulse-orange shadow-[0_0_20px_rgba(255,102,0,0.2)]">
                      <step.icon size={28} />
                   </div>
                   
                   <div className="flex-1 hidden md:block" />
                 </motion.div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Expectations - Grid */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* What you expect from us */}
            <div className="space-y-12">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pulse-orange text-pure-ink flex items-center justify-center">
                     <TrendingUp size={24} />
                  </div>
                  <h2 className="text-4xl font-bold text-snow">ماذا تتوقع منّا؟</h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { title: 'وضوح في النطاق', desc: 'لا توجد تكاليف خفية أو مفاجآت في نطاق العمل.', icon: FileText },
                    { title: 'تقارير مفهومة', desc: 'أرقام حقيقية تُترجم إلى أثر تجاري، لا تعقيدات فنية.', icon: BarChart3 },
                    { title: 'تواصل منظم', desc: 'قنوات تواصل واضحة وتحديثات دورية لا تتركك في حيرة.', icon: MessageSquare },
                    { title: 'احترام الميزانية', desc: 'تحسين توزيع الميزانية لتحقيق أعلى عائد على الاستثمار.', icon: ShieldCheck },
                    { title: 'جودة دون مساومة', desc: 'التزام بأعلى المعايير العالمية في التصميم والتطوير.', icon: CheckCircle2 },
                    { title: 'قرارات مبنية على بيانات', desc: 'التوصيات التي نقدمها مدعومة بالتحليلات، لا بالتوقعات.', icon: Brain },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                       <h4 className="text-snow font-bold flex items-center gap-2">
                          <item.icon size={16} className="text-pulse-orange" />
                          {item.title}
                       </h4>
                       <p className="text-gray-medium text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* What we need from you */}
            <div className="space-y-12">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border border-pulse-orange text-pulse-orange flex items-center justify-center">
                     <Handshake size={24} />
                  </div>
                  <h2 className="text-4xl font-bold text-snow">ماذا نحتاج منك؟</h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { title: 'وضوح الهدف', desc: 'تحديد ما تريد تحقيقه فعلياً يساعدنا على توجيه الجهود.', icon: Target },
                    { title: 'سرعة الموافقات', desc: 'الجمهور لا ينتظر؛ سرعة التغذية الراجعة تسرع النتائج.', icon: Zap },
                    { title: 'مشاركة المعلومات', desc: 'كلما عرفنا أكثر عن تحدياتك، زادت فاعلية حلولنا.', icon: Share2 },
                    { title: 'تحديد أصحاب القرار', desc: 'وجود شخص مسؤول يسهل انسيابية العمل والاتفاق.', icon: Users },
                    { title: 'اعتماد الميزانيات', desc: 'توفير التمويل اللازم في وقته يضمن استمرارية الحملات.', icon: Coins },
                    { title: 'الالتزام بالمواعيد', desc: 'الاحترام المتبادل للمواعيد وجلسات المراجعة يضمن الإنجاز.', icon: Clock },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                       <h4 className="text-snow font-bold flex items-center gap-2">
                          <item.icon size={16} className="text-pulse-orange" />
                          {item.title}
                       </h4>
                       <p className="text-gray-medium text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 border-t border-gray-dark">
        <div className="container mx-auto">
          <div className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-snow leading-tight">
                ابدأ بعلاقة عمل واضحة <br />
                <span className="text-pulse-orange">من اليوم الأول.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                مكالمة واحدة تساعدنا على فهم احتياجك وتحديد أفضل مسار للنمو والتميز في سوقك.
              </p>
              <div className="flex justify-center w-full">
                <Magnetic className="w-full sm:w-auto">
                  <Link href="/contact" className="btn-primary text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 shadow-2xl shadow-pulse-orange/20 inline-block w-full sm:w-auto text-center">
                    احجز مكالمة استراتيجية
                  </Link>
                </Magnetic>
              </div>
              <div className="mt-12 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/agma-method" className="hover:text-snow">منهجية agma</Link>
                <Link href="/pricing" className="hover:text-snow">شفافية الأسعار</Link>
                <Link href="/contact" className="hover:text-snow">تواصل معنا</Link>
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
            "@type": "HowTo",
            "name": "كيف تبدأ العمل مع وكالة AGMA",
            "description": "شرح لنموذج التعاون ومراحل العمل في وكالة AGMA من المكالمة الاستكشافية حتى القياس والتحسين.",
            "step": steps.map((step, index) => ({
              "@type": "HowToStep",
              "position": index + 1,
              "name": step.title,
              "text": step.desc
            }))
          }),
        }}
      />
    </main>
  );
}
