'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Zap, 
  Target, 
  RefreshCcw, 
  Search, 
  BrainCircuit, 
  LineChart, 
  Users,
  Layers,
  Sparkles,
  Megaphone,
  Palette,
  Globe,
  Settings,
  Activity,
  GitBranch,
  TrendingUp,
  LayoutGrid,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import Magnetic from '@/components/ui/Magnetic';
import Tilt from '@/components/ui/Tilt';
import ScrollFocus from '@/components/ui/ScrollFocus';

export default function MethodologyPage() {
  const phases = [
    {
      id: 'analyze',
      letter: 'A',
      name: 'Analyze',
      nameAr: 'تحليل',
      title: 'نبدأ من الفهم، لا من التنفيذ.',
      desc: 'فهم عميق للعلامة، السوق، الجمهور، المنافسين، ونقاط الفرص باستخدام أدوات AI، تدقيق العلامة، ذكاء السوق، والتحليلات التنبؤية.',
      items: [
        { label: 'Brand Audit', icon: Search },
        { label: 'Market Intelligence', icon: BrainCircuit },
        { label: 'Predictive Analysis', icon: LineChart },
        { label: 'Audience Mapping', icon: Users },
      ],
      color: 'pulse-orange'
    },
    {
      id: 'generate',
      letter: 'G',
      name: 'Generate',
      nameAr: 'توليد',
      title: 'نحوّل التحليل إلى إنتاج سريع وذكي.',
      desc: 'إنتاج الاستراتيجيات، المحتوى، الإعلانات، التصاميم، الصفحات، والهويات بسرعة الذكاء الاصطناعي وجودة الإبداع البشري.',
      items: [
        { label: 'Content at Scale', icon: Layers },
        { label: 'Creative AI', icon: Sparkles },
        { label: 'Campaign Assets', icon: Megaphone },
        { label: 'Design Systems', icon: Palette },
      ],
      color: 'snow'
    },
    {
      id: 'market',
      letter: 'M',
      name: 'Market',
      nameAr: 'تسويق',
      title: 'نطلق عبر القنوات الأكثر تأثيراً.',
      desc: 'حملات متعددة القنوات، مدعومة بالأتمتة، الاستهداف الدقيق، تحسين الأداء، وقياس النتائج بشكل مستمر.',
      items: [
        { label: 'Performance Ads', icon: Target },
        { label: 'SEO / AEO / GEO', icon: Globe },
        { label: 'Social Media', icon: Activity },
        { label: 'Automation', icon: Settings },
      ],
      color: 'pulse-orange'
    },
    {
      id: 'adapt',
      letter: 'A',
      name: 'Adapt',
      nameAr: 'تطوير',
      title: 'النمو لا يتوقف. يتعلّم ويتطور.',
      desc: 'قراءة البيانات، تحسين الرسائل، تعديل الاستهداف، تطوير المحتوى، وتكرار الدورة لتحقيق نمو مركب.',
      items: [
        { label: 'Real-time Optimization', icon: TrendingUp },
        { label: 'Learning Loop', icon: GitBranch },
        { label: 'Conversion Improvement', icon: LayoutGrid },
        { label: 'Compound Growth', icon: RefreshCcw },
      ],
      color: 'snow'
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
            <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5">
              <span className="text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">SYSTEM v4.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              منهجية <span className="text-pulse-orange">AGMA</span> الملكية.
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              أربع مراحل مستمرة، كل حرف من اسمنا يمثل مرحلة في دورة نمو ذكية تجمع التحليل، الإنتاج، التسويق، والتحسين المستمر.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
              <Magnetic className="w-full sm:w-auto">
                <Link href="/contact" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                  ناقش مشروعك معنا
                </Link>
              </Magnetic>
              <Magnetic className="w-full sm:w-auto">
                <Link href="/services" className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center">
                  استكشف خدماتنا
                </Link>
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
              لماذا AGMA Method™؟
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              صُممت منهجية AGMA Method™ خصيصاً لعصر الذكاء الاصطناعي، حيث لا يكفي إنتاج المحتوى التقليدي أو إطلاق الحملات العشوائية. نحن نبني دورة نمو مستمرة تقرأ السوق بعمق، تنتج بسرعة فائقة، تسوّق بذكاء صناعي، وتتطور بناءً على الأرقام والبيانات اللحظية.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology Phases */}
      <section className="py-24 px-6">
        <div className="container mx-auto space-y-32">
          {phases.map((phase, i) => (
            <motion.div 
              key={phase.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className={`${i % 2 !== 0 ? 'lg:order-2' : ''} space-y-8`}>
                <div className="flex items-center gap-6">
                  <div className={`text-8xl font-black font-mono transition-colors ${phase.color === 'pulse-orange' ? 'text-pulse-orange' : 'text-snow/20'}`}>
                    {phase.letter}
                  </div>
                  <div>
                    <div className="text-pulse-orange font-bold text-sm tracking-widest uppercase mb-1 font-mono">{phase.name}</div>
                    <h3 className="text-4xl font-bold text-snow">{phase.nameAr}</h3>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-2xl font-bold text-snow leading-tight">{phase.title}</h4>
                  <p className="text-gray-medium text-lg leading-relaxed font-medium">
                    {phase.desc}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {phase.items.map((item, idx) => (
                    <ScrollFocus key={idx}>
                      <Tilt className="h-full">
                        <div className="geometric-card bg-gray-dark/5 p-4 flex items-center gap-3 group h-full">
                          <item.icon className="text-pulse-orange w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-snow font-bold text-xs">{item.label}</span>
                        </div>
                      </Tilt>
                    </ScrollFocus>
                  ))}
                </div>
              </div>

              <div className={`${i % 2 !== 0 ? 'lg:order-1' : ''}`}>
                <div className="aspect-video lg:aspect-square bg-gray-dark/20 border border-gray-dark rounded-sm overflow-hidden relative group">
                  <div className="absolute inset-0 grid-pattern opacity-[0.05]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 border border-pulse-orange/20 rounded-full animate-spin-slow flex items-center justify-center">
                       <div className="w-1/2 h-1/2 border border-pulse-orange/40 rounded-full animate-reverse-spin flex items-center justify-center">
                         {React.createElement(phase.items[0].icon, { className: "text-pulse-orange/60 w-12 h-12" })}
                       </div>
                    </div>
                  </div>
                  <div className="absolute top-8 left-8">
                     <span className="text-[10px] text-gray-medium font-mono uppercase tracking-[0.2em]">Processing Phase 0{i+1}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Importance Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow mb-6">لماذا هذه المنهجية مهمة؟</h2>
            <p className="text-gray-medium max-w-2xl mx-auto font-medium">
              المنهجية هي الفرق بين الإهدار والنمو المستدام. في AGMA، نحن لا نبيع خدمات، بل نبيع نظاماً تشغيلياً يحقق النتائج.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {[
              { title: 'تمنع العشوائية', desc: 'كل قرار تسويقي يتم اتخاذه هو نتيجة لبيانات تم تحليلها سلفاً وفق مسار واضح.' },
              { title: 'تربط الإبداع بالأرقام', desc: 'لا نصمم من أجل الجمال فقط، بل نصمم من أجل التحويل والنمو، ونقيس أثر كل بكسل.' },
              { title: 'كل ريال قابل للقياس', desc: 'نظامنا يضمن لك معرفة العائد الدقيق على كل استثمار تسويقي تقوم به معنا.' },
              { title: 'دورة نمو مستمرة', desc: 'المنهجية لا تنتهي بالتنفيذ، بل تعيد إنتاج نفسها من خلال مرحلة التطوير لتعزيز الأداء.' },
              { title: 'الذكاء الاصطناعي كنظام', desc: 'AI ليس مجرد أداة إضافية، بل هو جزء من البنية التحتية لكل مرحلة في منهجيتنا.' },
              { title: 'سرعة التنفيذ الفائقة', desc: 'تتيح لنا هذه الدورة المؤتمتة التحرك بسرعات لم تكن تتخيلها الوكالات التقليدية.' },
            ].map((reason, i) => (
              <ScrollFocus key={i}>
                <Tilt className="h-full">
                  <div className="geometric-card p-10 bg-gray-dark/5 space-y-4 h-full">
                    <div className="w-1.5 h-1.5 bg-pulse-orange rounded-sm" />
                    <h3 className="text-xl font-bold text-snow">{reason.title}</h3>
                    <p className="text-gray-medium text-sm leading-relaxed font-medium">
                      {reason.desc}
                    </p>
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
          <div className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-snow leading-tight">
                ابدأ بمنهجية لا تعتمد <br />
                <span className="text-pulse-orange">على التخمين.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نحلل فرصتك، ونبني لك مسار نمو واضحاً من أول خطوة نحو الريادة في عصر الذكاء الاصطناعي.
              </p>
              <div className="flex justify-center w-full">
                <Magnetic className="w-full sm:w-auto">
                  <Link href="/contact" className="btn-primary text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 shadow-2xl shadow-pulse-orange/20 inline-block w-full sm:w-auto text-center">
                    احجز مكالمة استراتيجية الآن
                  </Link>
                </Magnetic>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
