'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Landmark, 
  Building2, 
  Hotel, 
  ShoppingCart, 
  Stethoscope, 
  GraduationCap, 
  Cpu, 
  PartyPopper, 
  Utensils, 
  Briefcase,
  ChevronLeft,
  Target,
  Users,
  Camera,
  Smartphone,
  Search,
  Zap,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export default function IndustriesPage() {
  const industries = [
    {
      title: 'الجهات الحكومية وشبه الحكومية',
      challenge: 'تحقيق الوصول الواسع والدقة في نقل الرسائل الوطنية وزيادة الوعي.',
      solution: 'إدارة تواصل استراتيجي، حملات توعية ضخمة، وإدارة القنوات الرسمية باحترافية.',
      services: 'العلاقات العامة، الاستراتيجية، السوشال ميديا.',
      icon: Landmark
    },
    {
      title: 'العقار والتطوير العمراني',
      challenge: 'طول دورة القرار الشرائي والحاجة لجذب عملاء محتملين (Leads) بجودة عالية.',
      solution: 'صفحات هبوط متطورة، حملات أداء تركز على التحويل، وأتمتة متابعة العملاء.',
      services: 'الويب، التسويق الأدائي، الهوية والتصميم.',
      icon: Building2
    },
    {
      title: 'الضيافة والسياحة',
      challenge: 'الموسمية العالية والحاجة لمحتوى مرئي يبني الرغبة الفورية في الحجز.',
      solution: 'تصوير احترافي، إدارة مؤثرين، وحملات موسمية مستهدفة عبر السوشال ميديا.',
      services: 'السوشال ميديا، العلاقات العامة، الويب.',
      icon: Hotel
    },
    {
      title: 'التجزئة والتجارة الإلكترونية',
      challenge: 'المنافسة السعرية الشديدة والحاجة لرفع معدلات تحويل السلات المتروكة.',
      solution: 'تحسين تجربة المتجر (Lighthouse)، سيو قوي، وحملات إعادة استهداف ذكية.',
      services: 'الويب والمنتجات، السيو والمحتوى، التسويق الأدائي.',
      icon: ShoppingCart
    },
    {
      title: 'الصحة والعيادات',
      challenge: 'بناء الثقة الطبية والظهور في نتائج البحث المحلية (Local SEO).',
      solution: 'استراتيجية محتوى موثوقة، تحسين الظهور على خرائط جوجل، ومنصات حجز سهلة.',
      services: 'السيو والمحتوى، الويب، السوشال ميديا.',
      icon: Stethoscope
    },
    {
      title: 'التعليم والتدريب',
      challenge: 'إثبات القيمة التعليمية وجلب مشتركين جدد للدورات والبرامج.',
      solution: 'قمع بيعي (Sales Funnel) متكامل، حملات أداء، وصناعة محتوى تعليمي جذاب.',
      services: 'التسويق الأدائي، الويب، السيو والمحتوى.',
      icon: GraduationCap
    },
    {
      title: 'التقنية والبرمجيات',
      challenge: 'شرح المنتجات المعقدة وتقليص دورة مبيعات الـ B2B.',
      solution: 'تصوير واجهات التطبيقات، كتابة تقنية مقنعة، ودمج أدوات Chatbots الذكية.',
      services: 'الويب، الأتمتة والذكاء الاصطناعي، الاستراتيجية.',
      icon: Cpu
    },
    {
      title: 'الفعاليات والمعارض',
      challenge: 'بيع التذاكر في وقت قياسي وخلق زخم (Hype) قبل وأثناء الحدث.',
      solution: 'حملات إعلانية مكثفة، تغطية ميدانية مباشرة، وإدارة علاقات إعلامية قوية.',
      services: 'السوشال ميديا، العلاقات العامة، التسويق الأدائي.',
      icon: PartyPopper
    },
    {
      title: 'المطاعم والمقاهي',
      challenge: 'الاعتماد الكلي على الصور والفيديو لجذب الزيارات المحلية.',
      solution: 'إنتاج محتوى مرئي يثير الشهية، سيو محلي، وإدارة حملات مع مشاهير الطعام.',
      services: 'السوشال ميديا، السيو والمحتوى، الهوية والتصميم.',
      icon: Utensils
    },
    {
      title: 'الخدمات المهنية',
      challenge: 'بناء سمعة الخبير والوصول لأصحاب القرار (Decision Makers).',
      solution: 'إدارة الحضور على LinkedIn، بناء هوية شخصية مؤسسية، واستراتيجية تسويق محتوى.',
      services: 'الاستراتيجية، السوشال ميديا، العلاقات العامة.',
      icon: Briefcase
    }
  ];

  const combinations = [
    {
      industry: 'العقار',
      needs: ['صفحات هبوط', 'إعلانات أداء', 'محتوى ثقة', 'CRM', 'أتمتة متابعة العملاء'],
      icon: Building2
    },
    {
      industry: 'الضيافة',
      needs: ['هوية بصرية', 'سوشال ميديا', 'إدارة مؤثرين', 'محتوى مرئي', 'حملات موسمية'],
      icon: Hotel
    },
    {
      industry: 'التقنية',
      needs: ['شرح منتجات', 'SEO تقني', 'صفحات خدمات', 'Lead Generation', 'AI Agents'],
      icon: Cpu
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
              Market Industries
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-5xl mx-auto">
              نخدم القطاعات الأكثر <br />
              <span className="text-pulse-orange">طموحاً في السعودية.</span>
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              من الجهات الحكومية إلى العقار، الضيافة، الصحة، التقنية، والتجزئة — نبني لكل قطاع منظومة نمو تناسب جمهوره، قراراته، وقنواته.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4">
                ناقش قطاعك معنا
              </Link>
              <Link href="/services" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4">
                 استكشف خدماتنا
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow">
              لا توجد استراتيجية واحدة تناسب الجميع
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              في AGMA، نحن نعلم أن تسويق شقة فاخرة يختلف تماماً عن تسويق تطبيق تقني أو إدارة تواصل لجهة حكومية. نحن لا نتعامل مع القطاعات كقوالب جاهزة، بل نبدأ دائماً من فهم عميق وسلوك الجمهور المستهدف، طبيعة القرار الاستثماري، دورة البيع، شدة المنافسة، والقنوات التي يتواجد فيها العميل فعلياً.
            </p>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">شبكة القطاعات</h2>
            <p className="text-gray-medium mt-4 font-medium">خبرة متراكمة في فهم تحديات ومفاتيح نمو قطاعات الأعمال الرئيسية.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4 max-w-7xl mx-auto">
            {industries.map((industry, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="geometric-card bg-pure-ink p-8 flex flex-col lg:flex-row gap-8 group hover:border-pulse-orange/30 transition-colors"
              >
                <div className="w-16 h-16 bg-pulse-orange/10 rounded-sm flex-shrink-0 flex items-center justify-center text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow transition-all">
                  <industry.icon size={32} />
                </div>
                <div className="space-y-6 flex-grow">
                  <h3 className="text-2xl font-bold text-snow">{industry.title}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest font-mono flex items-center gap-2">
                          <Target size={12} /> التحدي
                       </span>
                       <p className="text-gray-medium text-sm leading-relaxed">{industry.challenge}</p>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest font-mono flex items-center gap-2">
                          <Zap size={12} /> كيف نساعد
                       </span>
                       <p className="text-gray-medium text-sm leading-relaxed">{industry.solution}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-dark">
                    <span className="text-[10px] text-gray-medium font-bold uppercase tracking-widest mb-2 block">الخدمات الأنسب لهذا القطاع</span>
                    <div className="flex flex-wrap gap-2">
                      {industry.services.split('،').map((s, si) => (
                        <span key={si} className="text-xs text-snow bg-gray-dark/20 px-3 py-1 rounded-sm border border-gray-dark">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
           <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-snow">أمثلة على ربط الخدمات بالقطاعات</h2>
              <p className="text-gray-medium mt-4 font-medium">كيف نصمم الحلول (Solutions) لتناسب احتياجات السوق الفعلية.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              {combinations.map((item, i) => (
                <div key={i} className="space-y-6 group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border border-pulse-orange/20 flex items-center justify-center text-pulse-orange">
                         <item.icon size={24} />
                      </div>
                      <h4 className="text-2xl font-bold text-snow">قطاع {item.industry}</h4>
                   </div>
                   <div className="space-y-3">
                      {item.needs.map((need, ni) => (
                        <div key={ni} className="flex items-center gap-3 text-gray-medium text-sm font-medium">
                           <div className="w-1.5 h-1.5 bg-pulse-orange rounded-full" />
                           <span>{need}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="border border-pulse-orange/20 p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-snow leading-tight">
                لكل قطاع طريقته <br />
                <span className="text-pulse-orange">في النمو.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نفهم قطاعك أولاً، ثم نختار القنوات والخدمات التي تحقق أثراً حقيقياً ومستداماً لعملك.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                ناقش قطاعك معنا
              </Link>
              <div className="mt-12 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services" className="hover:text-snow">خدماتنا</Link>
                <Link href="/agma-method" className="hover:text-snow">منهجية agma</Link>
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
            "@type": "CollectionPage",
            "name": "القطاعات التي تخدمها AGMA",
            "description": "عرض للقطاعات التي تخدمها وكالة AGMA في السعودية والخليج، بما في ذلك الجهات الحكومية، العقار، التقنية، والصحة.",
            "url": "https://agma.ai/industries",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": industries.map((ind, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": ind.title,
                "description": ind.solution
              }))
            }
          }),
        }}
      />
    </main>
  );
}
