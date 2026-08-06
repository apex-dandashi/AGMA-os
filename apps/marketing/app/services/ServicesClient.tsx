'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Target, 
  Search, 
  MessageSquare, 
  Palette, 
  Code, 
  Lightbulb, 
  Globe, 
  Check, 
  X,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import Magnetic from '@/components/ui/Magnetic';
import Tilt from '@/components/ui/Tilt';
import ScrollFocus from '@/components/ui/ScrollFocus';

const servicesData = [
// ... (rest of data stays same)
  {
    id: 'ai-automation',
    title: 'الذكاء الاصطناعي والأتمتة',
    desc: 'وكلاء AI، أتمتة سير العمل، روبوتات محادثة، تحسين ظهورك بمحركات AI، وتحليلات تنبؤية.',
    icon: Cpu,
    subServices: [
      'وكلاء ذكاء اصطناعي مخصصون',
      'أتمتة سير العمل',
      'روبوتات محادثة ذكية',
      'تحسين الظهور بمحركات AI',
      'التحليل التنبؤي'
    ],
    link: '/services/ai-automation'
  },
  {
    id: 'performance-marketing',
    title: 'التسويق الأدائي والإعلانات',
    desc: 'حملات مدفوعة تقيس كل نقرة، وتعمل على رفع عائد كل ريال.',
    icon: Target,
    subServices: [
      'إعلانات السوشال المدفوعة',
      'إعلانات جوجل',
      'الإعلانات البرمجية',
      'تحسين معدل التحويل'
    ],
    link: '/services/performance-marketing'
  },
  {
    id: 'seo-content',
    title: 'السيو والمحتوى',
    desc: 'سيو عربي متخصص ومحتوى مدعوم بالذكاء الاصطناعي، مصمم للظهور والتحويل.',
    icon: Search,
    subServices: [
      'تدقيق سيو شامل',
      'سيو عربي متخصص',
      'إنتاج المحتوى بالـ AI',
      'كتابة المحتوى الإبداعي'
    ],
    link: '/services/seo-content'
  },
  {
    id: 'social-media',
    title: 'السوشال ميديا والمجتمعات',
    desc: 'حضور يومي بصوت علامتك، مع استراتيجية، محتوى، تفاعل، وقياس.',
    icon: MessageSquare,
    subServices: [
      'إدارة حسابات السوشال ميديا',
      'التسويق عبر المؤثرين',
      'استراتيجية السوشال',
      'إدارة المجتمعات الرقمية'
    ],
    link: '/services/social-media'
  },
  {
    id: 'branding-creative',
    title: 'الهوية والتصميم الإبداعي',
    desc: 'هويات وأنظمة بصرية تجعل العلامة واضحة، ثابتة، وقابلة للتوسع.',
    icon: Palette,
    subServices: [
      'استراتيجية العلامة',
      'تصميم الشعار والهوية',
      'دليل الهوية البصرية',
      'الموشن جرافيك',
      'تصميم التغليف والمطبوعات'
    ],
    link: '/services/branding-creative'
  },
  {
    id: 'web-digital',
    title: 'الويب والمنتجات الرقمية',
    desc: 'مواقع، متاجر، صفحات هبوط، وتجارب رقمية مصممة للبيع لا للعرض فقط.',
    icon: Code,
    subServices: [
      'تصميم وتطوير المواقع',
      'المتاجر الإلكترونية',
      'تصميم تجربة المستخدم',
      'صفحات الهبوط واختبار A/B'
    ],
    link: '/services/web-digital'
  },
  {
    id: 'strategy-consulting',
    title: 'الاستراتيجية والاستشارات',
    desc: 'خطط تسويقية، تحول رقمي، AI، أبحاث سوق، وتحليل منافسين.',
    icon: Lightbulb,
    subServices: [
      'الاستراتيجية التسويقية الشاملة',
      'استشارات التحول الرقمي والـ AI',
      'أبحاث السوق وتحليل المنافسين'
    ],
    link: '/services/strategy-consulting'
  },
  {
    id: 'pr-media',
    title: 'العلاقات العامة والإعلام',
    desc: 'إيصال صوت العلامة، إدارة السمعة، الحضور الإعلامي، وتسويق الفعاليات.',
    icon: Globe,
    subServices: [
      'العلاقات العامة وإدارة الإعلام',
      'الشراء الإعلامي',
      'تسويق الفعاليات والتفعيلات'
    ],
    link: '/services/pr-media'
  }
];

export default function ServicesClient() {
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
            <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5">
              <span className="text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">المنظومة الكاملة</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              32 خدمة. 8 فئات. <br />
              هدف واحد: <span className="text-pulse-orange">نموك</span>.
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              كل ما تحتاجه علامتك للنمو في عصر الذكاء الاصطناعي — من التحليل والأتمتة إلى المحتوى، الإعلانات، المواقع، الهوية، والاستراتيجية.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-6">
              <Magnetic className="w-full sm:w-auto">
                <Link href="/contact" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                  اطلب عرض سعر
                </Link>
              </Magnetic>
              <Magnetic className="w-full sm:w-auto">
                <a href="#services-grid" className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                  استكشف الفئات
                </a>
              </Magnetic>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow">
              نحن لا نقدم خدمات متفرقة... نحن نبني نظاماً.
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              في AGMA، نؤمن بأن الخدمة الواحدة لا تكفي لخلق نمو حقيقي. لذلك نقدم منظومة متكاملة تربط الاستراتيجية بالإنتاج، والإعلانات بالبيانات، والمحتوى بالتحويل الفعلي، والهوية بكل لمسة نمو نضعها.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services-grid" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {servicesData.map((service, i) => (
              <motion.div 
                key={service.id}
                id={service.id}
                initial="initial"
                whileHover="hover"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative h-full"
              >
                <ScrollFocus>
                  <Tilt className="h-full">
                    <div 
                      className="geometric-card bg-gray-dark/10 p-8 flex flex-col h-full group relative overflow-hidden w-full"
                    >
                      {/* Digital Scan Line Effect */}
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        <motion.div 
                          variants={{
                            initial: { top: "-10%", opacity: 0 },
                            hover: { top: "110%", opacity: 1 }
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute left-0 right-0 h-[3px] bg-pulse-orange shadow-[0_0_20px_rgba(244,77,43,1)] z-20"
                        />
                        <motion.div 
                          variants={{
                            initial: { top: "-40%", opacity: 0 },
                            hover: { top: "110%", opacity: 0.4 }
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute left-0 right-0 h-40 bg-gradient-to-b from-pulse-orange/50 via-pulse-orange/10 to-transparent z-10"
                        />
                      </div>

                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange mb-6 group-hover:bg-pulse-orange group-hover:text-snow transition-colors">
                          <service.icon size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-snow mb-4 leading-tight">{service.title}</h3>
                        <p className="text-gray-medium text-sm leading-relaxed mb-8 flex-grow font-medium">
                          {service.desc}
                        </p>
                        <div className="space-y-3 mb-8">
                          {service.subServices.map((sub, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-snow/70">
                              <Check className="text-pulse-orange w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{sub}</span>
                            </div>
                          ))}
                        </div>
                        <Link 
                          href={service.link} 
                          className="text-pulse-orange text-sm font-bold flex items-center gap-2 group/link"
                        >
                          التفاصيل <ChevronLeft size={16} className="group-hover/link:-translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </Tilt>
                </ScrollFocus>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After Comparison */}
      <section className="py-24 px-6 relative border-y border-gray-dark bg-gray-dark/5">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">الفرق الذي نصنعه</h2>
            <p className="text-gray-medium max-w-2xl mx-auto font-medium mt-6">
              كيف تتغير تجربة نموك قبل وبعد الانتقال إلى نموذج AGMA المدعوم بالذكاء الاصطناعي.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-w-5xl mx-auto">
            <div className="geometric-card bg-gray-dark/20 p-10 border-gray-dark">
              <h3 className="text-xl font-bold text-gray-medium mb-8 flex items-center gap-3">
                <X className="text-red-500" /> قبل AGMA
              </h3>
              <ul className="space-y-6">
                {[
                  'مزودون متعددون وفريق عمل مشتت.',
                  'تقارير يدوية متأخرة وغير دقيقة.',
                  'قرارات بطيئة تعتمد على التخمين.',
                  'تنفيذ تقليدي بطيء وغير مترابط.',
                  'ضعف في قياس العائد الفعلي للاستثمار.'
                ].map((item, i) => (
                  <li key={i} className="text-gray-medium text-sm flex items-start gap-4">
                    <div className="w-1.5 h-1.5 bg-gray-medium rounded-full mt-1.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="geometric-card bg-pulse-orange/5 p-10 border-pulse-orange/30">
              <h3 className="text-xl font-bold text-pulse-orange mb-8 flex items-center gap-3">
                <Check className="text-pulse-orange" /> مع AGMA
              </h3>
              <ul className="space-y-6">
                {[
                  'فريق واحد متكامل يدير كل رحلة النمو.',
                  'بيانات موحدة لحظية بدقة مطلقة.',
                  'منهجية واحدة واضحة وقابلة للتكرار.',
                  'تنفيذ أسرع بنسبة 300% عبر الأتمتة.',
                  'رؤية واضحة ونتائج قابلة للقياس والنمو.'
                ].map((item, i) => (
                  <li key={i} className="text-snow text-sm flex items-start gap-4 font-bold">
                    <div className="w-1.5 h-1.5 bg-pulse-orange rounded-full mt-1.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-snow leading-tight">
                اختر خدمة واحدة، <br />
                <span className="text-pulse-orange">أو دعنا نبني لك المنظومة كاملة.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                سواء كنت تحتاج إلى حملة إعلانية، موقع إلكتروني، هوية بصرية، أتمتة عمليات، أو خطة نمو كاملة — نحن نبدأ من هدفك التجاري ونبني كل شيء حوله.
              </p>
              <div className="flex justify-center w-full">
                <Magnetic className="w-full sm:w-auto">
                  <Link href="/contact" className="btn-primary text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 shadow-2xl shadow-pulse-orange/20 inline-block w-full sm:w-auto text-center">
                    اطلب عرض سعر الآن
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
            "@type": "CollectionPage",
            "name": "خدمات AGMA | منظومة النمو بالذكاء الاصطناعي",
            "description": "32 خدمة تسويقية وتقنية مدعومة بالذكاء الاصطناعي تشمل الأتمتة، الإعلانات، السيو، المحتوى، الهوية، والويب.",
            "url": "https://agma.com.sa/services",
            "hasPart": servicesData.map(s => ({
              "@type": "Service",
              "name": s.title,
              "description": s.desc
            }))
          }),
        }}
      />
    </main>
  );
}
