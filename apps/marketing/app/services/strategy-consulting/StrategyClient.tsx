'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Cpu, 
  Search, 
  CheckCircle2, 
  ChevronLeft,
  Rocket,
  Target,
  Zap,
  MessageSquare,
  TrendingUp,
  Layers,
  Activity,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Milestone,
  RefreshCw,
  ShieldCheck,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function StrategyConsultingPage() {
  const [activeGoal, setActiveGoal] = React.useState<string>('dominance');
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
  const [showGlossary, setShowGlossary] = React.useState<boolean>(false);

  const strategicGoals = [
    {
      id: 'dominance',
      title: 'السيطرة على الصدارة السوقية',
      subtitle: 'Market Dominance',
      desc: 'التربع كخيار أول في ذهن العميل وتجاوز حرب الأسعار والمزايدات الصفريّة.',
      pathPillars: ['market-share', 'growth-engineering'],
      activeColor: 'orange',
      themeBorder: 'border-pulse-orange/40 hover:border-pulse-orange',
      themeGlow: 'shadow-pulse-orange/20 from-pulse-orange/10 to-pulse-orange/5',
      accentText: 'text-pulse-orange',
      bgGlow: 'bg-pulse-orange/5',
      benefits: [
        { label: 'التموضع الرقمي الفريد', desc: 'تحديد قطاع سوقي شاغر بلا منافسة حادة لتسهيل الاستحواذ السريع.' },
        { label: 'أقماع تحويل عالية التدفق', desc: 'بناء مسارات تسويقية ذكية تضمن الحفاظ على نية الشراء وترقيتها.' },
        { label: 'صياغة الرسالة المهندسة', desc: 'صياغة العرض المميز (Value Proposition) الذي يمنع المقارنات التقليدية المنهكة.' }
      ],
      estimatedTime: '60 - 90 يوم',
      successMetric: 'زيادة 150% في معدل الوعي بالعلامة وفوز بفرص الصدارة السوقية (Blue Ocean)'
    },
    {
      id: 'roi',
      title: 'كفاءة الإنفاق ومضاعفة الأرباح',
      subtitle: 'ROI Maximization',
      desc: 'تحقيق أعلى عائد على الاستثمار الإعلاني الفعلي لتقليص تكلفة الاستحواذ بالبيانات.',
      pathPillars: ['feasibility', 'growth-engineering'],
      activeColor: 'cyan',
      themeBorder: 'border-cyan-500/40 hover:border-cyan-500',
      themeGlow: 'shadow-cyan-500/20 from-cyan-500/10 to-cyan-500/5',
      accentText: 'text-cyan-400',
      bgGlow: 'bg-cyan-500/5',
      benefits: [
        { label: 'حساب العائد والجدوى الكسيرية', desc: 'تقييم شامل لنموذج الربحية لضمان الجدوى المالية قبل صرف الميزانيات.' },
        { label: 'ميزنة مرنة قائمة على الكفاءة', desc: 'أدوات لإعادة توزيع الموارد فورياً نحو الحملات والقنوات الأكثر توليداً للقيمة.' },
        { label: 'أتمتة الاستبقاء والمتابعة', desc: 'استرداد السلات المهجورة وزيادة معدل الشراء المتكرر عبر مسارات دقيقة.' }
      ],
      estimatedTime: '30 - 45 يوم',
      successMetric: 'خفض تكلفة الاستحواذ للعميل (CPA) بـ 35% ومضاعفة القيمة الحياتية له (CLV) بـ 2.5x'
    },
    {
      id: 'autopilot',
      title: 'الأتمتة الاستحواذية المستقلة',
      subtitle: 'Autopilot Acquisition',
      desc: 'بناء منظومة جذب وتأهيل للعملاء المحتملين تعمل لصالحك على مدار الساعة.',
      pathPillars: ['market-share', 'feasibility'],
      activeColor: 'emerald',
      themeBorder: 'border-emerald-500/40 hover:border-emerald-500',
      themeGlow: 'shadow-emerald-500/20 from-emerald-500/10 to-emerald-500/5',
      accentText: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/5',
      benefits: [
        { label: 'استهداف النوايا المخفية', desc: 'تحديد فئات تبحث بدافع نية حقيقية بالاستعانة بأدوات رصد وبحث سلوكية.' },
        { label: 'هندسة رحلة العميل السهلة', desc: 'تخفيض نقاط الاحتكاك في الطلب لبناء قنوات اتصال رقمي فائقة الاستجابة.' },
        { label: 'أتمتة ملاحية مرنة', desc: 'ربط الأنظمة الرقمية لتصفية وتصنيف العملاء الجادين بملفات جاهزة للمبيعات.' }
      ],
      estimatedTime: '45 - 60 يوم',
      successMetric: 'تأهيل تلقائي للمشترين بنسبة 85% مع استدامة تدفق الصفقات'
    }
  ];

  const strategicPillars = [
    {
      id: 'market-share',
      title: 'استهداف الحصص السوقية',
      desc: 'صيد الفجوات وبناء التموضع المتفرد',
      icon: Target,
      steps: [
        { name: 'تموضع المحيط الأزرق', desc: 'تجاوز الصراع الدموي وتصميم مسار نفوذ يخاطب الاحتياج مباشرة.' },
        { name: 'رصد فجوات المنافسين', desc: 'استكشاف نقاط الضعف في خدمات المنافسين لتقديم حلول بديلة فورية.' },
        { name: 'سلوك الجمهور المستتر', desc: 'تحليل المنعطفات النفسية والسلوكية التي تدفع العميل لاتخاذ قرار الشراء.' }
      ]
    },
    {
      id: 'feasibility',
      title: 'دراسات الجدوى الحصيفة',
      desc: 'الجدوى الرقمية والمالية الصارمة',
      icon: Layers,
      steps: [
        { name: 'تقدير الحساب الاستثماري', desc: 'تدقيق الميزانيات لتقليص الهدر وحساب نقطة التعادل التعاقدية.' },
        { name: 'تجنب الاحتكاك والمخاطر', desc: 'قراءة تقلبات السوق وسلامة البوابات القانونية والتقنية للمشروع.' },
        { name: 'التخصيص المتوازن الذكي', desc: 'ميزنة دقيقة تحدد أوزان الصرف في كل قناة لزيادة الكفاءة التشغيلية.' }
      ]
    },
    {
      id: 'growth-engineering',
      title: 'هندسة مسارات النمو',
      desc: 'الأتمتة وتسييل حركة المرور الرقمي',
      icon: TrendingUp,
      steps: [
        { name: 'أقماع تحويل متكاملة', desc: 'تصميم مسارات تضمن تتابع الإقناع والتغذية المستمرة بالبيانات.' },
        { name: 'ترقب نية الشراء الحاسمة', desc: 'توقع توقيت اتخاذ القرار لتقديم التسهيل أو الخيار المناسب فورياً.' },
        { name: 'تمكين حلقات النمو الدائري', desc: 'صناعة مميزات تدفع العميل الحالي ليصبح محرك توليد عملاء جدد.' }
      ]
    }
  ];

  const getWhatsAppStrategyUrl = () => {
    const goal = strategicGoals.find(g => g.id === activeGoal) || strategicGoals[0];
    const text = `أهلاً فريق جيل الذكاء الاصطناعي (AI Generation) 👋

أود حجز استشارة استراتيجية تسويقية وتفعيل خارطة مسار الأهداف لمشروعي:

🎯 المسار المختار: ${goal.title} (${goal.subtitle})
⏱️ المخرجات المتوقعة في غضون: ${goal.estimatedTime}
⚡ مؤشر نجاح الخطة المستهدف: ${goal.successMetric}

الخطوات المستهدفة في خارطة الطريق:
${goal.benefits.map((b, idx) => `  ${idx + 1}. [${b.label}]: ${b.desc}`).join('\n')}

يرجى التواصل للبدء الفوري وجدولة مكالمة Zoom الافتراضية للتحليل الاستراتيجي 🚀`;

    return `https://wa.me/966581195387?text=${encodeURIComponent(text)}`;
  };

  const consultingServices = [
    {
      title: 'الاستراتيجية التسويقية الشاملة',
      subtitle: 'Marketing Strategy',
      desc: 'خارطة طريق تسويقية لمدة 12 شهراً تشمل الأهداف، الجمهور، القنوات، الميزانية، KPIs، وخطة التنفيذ التفصيلية.',
      icon: Compass,
    },
    {
      title: 'استشارات التحول الرقمي والـ AI',
      subtitle: 'Digital Transformation & AI Consulting',
      desc: 'مساعدة علامتك على دمج الذكاء الاصطناعي في التسويق، العمليات، الأتمتة، إنتاج المحتوى، خدمة العملاء، والتحليل العميق.',
      icon: Cpu,
    },
    {
      title: 'أبحاث السوق وتحليل المنافسين',
      subtitle: 'Market Research & Competitor Analysis',
      desc: 'فهم عميق للسوق السعودي، دراسة سلوك الجمهور، تحليل المنافسين المباشرين، واكتشاف الفجوات والفرص قبل اتخاذ قرارات النمو.',
      icon: Search,
    }
  ];

  const strategyComponents = [
    'تحليل الوضع الحالي', 'تحليل الجمهور', 'تحليل المنافسين',
    'التموضع (Positioning)', 'الرسائل الرئيسية', 'القنوات التسويقية',
    'الميزانية المقترحة', 'مؤشرات الأداء (KPIs)', 'الجدول الزمني (Timeline)',
    'الأولويات (Priorities)', 'خطة العمل (Action Plan)'
  ];

  const targetClients = [
    { title: 'شركة تبدأ التوسع', desc: 'تحتاج إلى أساس استراتيجي صلب للانتقال للمرحلة التالية.' },
    { title: 'علامة تريد دخول السوق السعودي', desc: 'تحتاج لفهم الخصوصية المحلية وتحديد تموضعها المنافس.' },
    { title: 'شركة لديها تسويق مشتت', desc: 'تحتاج لتوحيد الجهود وتركيز الميزانية في القنوات الأكثر فاعلية.' },
    { title: 'جهة تحتاج خطة قبل المناقصة', desc: 'تحتاج لعرض فني واستراتيجي احترافي ومبني على الأرقام.' },
    { title: 'إدارة تريد رؤية أوضح', desc: 'تحتاج لبيانات وتوقعات دقيقة قبل اعتماد الميزانيات السنوية.' },
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
              Strategy & Consulting
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              قبل أن تنفق على التسويق، <br />
              <span className="text-pulse-orange">ابنِ الخطة.</span>
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              استراتيجيات تسويقية، تحول رقمي، دمج AI، وأبحاث سوق تساعدك على اتخاذ قرارات أوضح قبل إطلاق الحملات والميزانيات.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4">
                اطلب استراتيجية تسويقية
              </Link>
              <Link href="/contact" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4">
                 احجز جلسة استشارية
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Strategy First */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow">
              لماذا الاستراتيجية أولاً؟
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              كثير من الميزانيات التسويقية تضيع هباءً لأن التنفيذ يبدأ قبل وضوح الرؤية. بدون تحديد الجمهور بدقة، وفهم التموضع التنافسي، وصياغة الرسائل الصحيحة، واختيار القنوات المناسبة، وتحديد مؤشرات الأداء (KPIs)؛ يتحول التسويق من استثمار إلى مقامرة. نحن في جيل الذكاء الاصطناعي نخرجك من دوامة &quot;التجربة والخطأ&quot; إلى &quot;منهجية القرار المدروس&quot;.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE BLUE OCEAN ROADMAP SECTION */}
      <section className="py-24 px-6 relative bg-gradient-to-b from-pure-ink via-gray-dark/10 to-pure-ink">
        <div className="grid-pattern opacity-[0.03]" />
        
        {/* CSS KEYFRAMES INJECTED SECURELY */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes flow-rtl {
            to {
              stroke-dashoffset: -40;
            }
          }
          .animate-flow-rtl-orange {
            stroke-dasharray: 10 6;
            animation: flow-rtl 1s linear infinite;
          }
          .animate-flow-rtl-cyan {
            stroke-dasharray: 10 6;
            animation: flow-rtl 0.8s linear infinite;
          }
          .animate-flow-rtl-emerald {
            stroke-dasharray: 10 6;
            animation: flow-rtl 0.7s linear infinite;
          }
        `}} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-pulse-orange/20 rounded-full bg-pulse-orange/5 text-pulse-orange text-[10px] font-bold uppercase tracking-widest font-mono">
              <Sparkles size={11} className="animate-pulse" />
              الكونسبت الفكري: خارطة مسار الأهداف
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-snow tracking-tight leading-tight">
              خارطة طريق المحيط الأزرق التفاعلية
            </h2>
            <p className="text-gray-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              الاستشارة تعني الدقة والمسار الواضح في عصر يكتظ بالخيارات العشوائية. حدد هدفك الاستراتيجي الأساسي ليرتسم أمامك أفضل مسار رقمي متكامل يربط بين علامتك والريادة والجدوى الحتمية.
            </p>
          </div>

          {/* GOAL SELECTORS (3 PILLARS OF SELECTION) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {strategicGoals.map((goal) => {
              const isActive = activeGoal === goal.id;
              const accentColor = goal.id === 'dominance' ? '#ff6100' : goal.id === 'roi' ? '#00f3ff' : '#10b981';
              const activeBorderClass = goal.id === 'dominance' ? 'border-[#ff6100]' : goal.id === 'roi' ? 'border-cyan-400' : 'border-emerald-400';
              const activeBgClass = goal.id === 'dominance' ? 'bg-[#ff6100]/5' : goal.id === 'roi' ? 'bg-cyan-500/5' : 'bg-emerald-500/5';
              return (
                <motion.div
                  key={goal.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveGoal(goal.id)}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    isActive 
                      ? `${activeBorderClass} ${activeBgClass} shadow-[0_0_20px_rgba(255,255,255,0.02)]` 
                      : 'border-white/5 bg-white/[0.01] hover:border-white/20'
                  }`}
                >
                  {/* Subtle Top Accent bar for Active */}
                  {isActive && (
                    <div 
                      className="absolute top-0 right-0 left-0 h-[3px]"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}

                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-gray-medium/50 block">Targeting Goal</span>
                      <h3 className="text-lg font-bold text-snow flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full inline-block" 
                          style={{ backgroundColor: accentColor }}
                        />
                        {goal.title}
                      </h3>
                      <p className="text-xs text-gray-medium leading-relaxed font-sans line-clamp-2">
                        {goal.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* THE INTERCONNECTIVE ROADMAP CANVAS */}
          <div className="bg-neutral-950/60 border border-white/5 rounded-3xl p-6 sm:p-10 relative shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-between">
            {/* Grid Map layout */}
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-center relative z-10 w-full">
              
              {/* LEFT COLUMN: THE 3 TACTICAL STRATEGIC PILLARS */}
              <div className="lg:col-span-5 space-y-6 w-full order-2 lg:order-1">
                <div className="text-right border-b border-white/[0.03] pb-3 mb-2">
                  <span className="text-[10px] font-mono text-gray-medium/40 uppercase block">Destination Output Nodes</span>
                  <span className="text-xs font-bold text-snow">أركان التنفيذ الاستراتيجي الثلاثة</span>
                </div>
                
                {strategicPillars.map((pillar) => {
                  const currentGoalData = strategicGoals.find(g => g.id === activeGoal)!;
                  const isHighlighted = currentGoalData.pathPillars.includes(pillar.id);
                  const activeColorHex = currentGoalData.id === 'dominance' ? '#ff6100' : currentGoalData.id === 'roi' ? '#00f3ff' : '#10b981';
                  
                  return (
                    <motion.div
                      key={pillar.id}
                      animate={{ 
                        opacity: isHighlighted ? 1 : 0.45,
                        scale: isHighlighted ? 1.01 : 0.99
                      }}
                      className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                        isHighlighted 
                          ? 'border-white/10 bg-white/[0.02] shadow-xl' 
                          : 'border-white/5 bg-transparent'
                      }`}
                    >
                      {/* Active Indicator Bar on Right */}
                      {isHighlighted && (
                        <div 
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-l-full"
                          style={{ backgroundColor: activeColorHex }}
                        />
                      )}

                      <div className="flex items-start gap-3.5">
                        <div 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                            isHighlighted ? 'border-white/10 bg-white/5' : 'border-white/5 bg-transparent'
                          }`}
                          style={{ color: isHighlighted ? activeColorHex : 'rgba(255,255,255,0.2)' }}
                        >
                          <pillar.icon size={18} />
                        </div>
                        
                        <div className="space-y-1.5 flex-1">
                          <h4 className="text-sm font-bold text-snow flex items-center gap-2">
                            {pillar.title}
                            {isHighlighted && (
                              <span 
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: `${activeColorHex}15`, color: activeColorHex }}
                              >
                                مسار نشط
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-medium">{pillar.desc}</p>
                          
                          {/* Animated Pillar Steps nested beautifully */}
                          <AnimatePresence>
                            {isHighlighted && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 space-y-2 mt-2 border-t border-white/[0.03] overflow-hidden"
                              >
                                {pillar.steps.map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs">
                                    <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: activeColorHex }} />
                                    <div>
                                      <span className="text-snow font-bold ml-1">{step.name}:</span>
                                      <span className="text-gray-medium/80 text-[11px] font-sans">{step.desc}</span>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* MIDDLE COLUMN: THE RESPONSIVE VECTOR CONNECTIVE CANVAS (DESKTOP ONLY) */}
              <div className="hidden lg:col-span-2 h-full lg:flex items-center justify-center order-2 pointer-events-none relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    width="160" 
                    height="300" 
                    viewBox="0 0 160 300" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="overflow-visible"
                  >
                    {/* Background static paths (Dim) */}
                    <path d="M 150 150 C 90 150, 70 40, 10 40" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
                    <path d="M 150 150 L 10 150" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
                    <path d="M 150 150 C 90 150, 70 260, 10 260" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />

                    {/* Active Glowing Animated Paths dynamically drawn in real-time */}
                    {strategicPillars.map((pillar, idx) => {
                      const currentGoalData = strategicGoals.find(g => g.id === activeGoal)!;
                      const isHighlighted = currentGoalData.pathPillars.includes(pillar.id);
                      if (!isHighlighted) return null;

                      let dPath = "";
                      let flowClass = "";
                      if (pillar.id === 'market-share') {
                        dPath = "M 150 150 C 90 150, 70 40, 10 40";
                      } else if (pillar.id === 'feasibility') {
                        dPath = "M 150 150 L 10 150";
                      } else if (pillar.id === 'growth-engineering') {
                        dPath = "M 150 150 C 90 150, 70 260, 10 260";
                      }

                      if (currentGoalData.id === 'dominance') flowClass = "animate-flow-rtl-orange";
                      if (currentGoalData.id === 'roi') flowClass = "animate-flow-rtl-cyan";
                      if (currentGoalData.id === 'autopilot') flowClass = "animate-flow-rtl-emerald";

                      const activeColorHex = currentGoalData.id === 'dominance' ? '#ff6100' : currentGoalData.id === 'roi' ? '#00f3ff' : '#10b981';

                      return (
                        <g key={pillar.id}>
                          {/* Inner soft glow */}
                          <path 
                            d={dPath} 
                            stroke={activeColorHex} 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                            opacity="0.3"
                            className="blur-[2px]"
                          />
                          {/* Pulsative dashed line */}
                          <path 
                            d={dPath} 
                            stroke={activeColorHex} 
                            strokeWidth="1.5" 
                            strokeLinecap="round"
                            className={flowClass}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* RIGHT COLUMN: THE THEMATIC STRATEGIC GENERATOR HUB */}
              <div className="lg:col-span-4 w-full order-1 lg:order-3 text-center lg:text-right">
                <div className="text-right border-b border-white/[0.03] pb-3 mb-6 hidden lg:block">
                  <span className="text-[10px] font-mono text-gray-medium/40 uppercase block">Initiating Strategic Source</span>
                  <span className="text-xs font-bold text-snow">العقدة المركزية للمشروع</span>
                </div>

                {(() => {
                  const currentGoalData = strategicGoals.find(g => g.id === activeGoal)!;
                  const activeColorHex = currentGoalData.id === 'dominance' ? '#ff6100' : currentGoalData.id === 'roi' ? '#00f3ff' : '#10b981';
                  
                  return (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-white/[0.01] border border-white/5 relative overflow-hidden">
                      {/* Interactive Radar pulses */}
                      <div className="w-24 h-24 mb-6 rounded-full flex items-center justify-center relative">
                        <motion.div 
                          className="absolute inset-0 rounded-full opacity-10 animate-ping"
                          style={{ backgroundColor: activeColorHex }}
                        />
                        <motion.div 
                          className="absolute inset-2 rounded-full opacity-20"
                          style={{ backgroundColor: activeColorHex }}
                        />
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center relative border shadow-lg"
                          style={{ 
                            backgroundColor: '#0a0a0a', 
                            borderColor: `${activeColorHex}40`,
                            boxShadow: `0 0 25px ${activeColorHex}20` 
                          }}
                        >
                          <Compass size={24} className="animate-spin-slow" style={{ color: activeColorHex }} />
                        </div>
                      </div>

                      <div className="space-y-3 text-center">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-gray-medium/40">Active Node</span>
                        <h3 className="text-xl font-black text-snow leading-snug">
                          {currentGoalData.title}
                        </h3>
                        <p className="text-xs text-gray-medium leading-relaxed font-sans max-w-sm">
                          {currentGoalData.desc}
                        </p>
                      </div>

                      {/* Small visual validation note for custom consult */}
                      <div className="mt-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[9px] text-gray-medium/70 font-mono">
                        <ShieldCheck size={11} className="text-emerald-400" />
                        [DECISION_PRECISION_OPTIMIZED]
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* ROADMAP TARGET METRIC SUMMARY DRAWER */}
            {(() => {
              const currentGoalData = strategicGoals.find(g => g.id === activeGoal)!;
              const activeColorHex = currentGoalData.id === 'dominance' ? '#ff6100' : currentGoalData.id === 'roi' ? '#00f3ff' : '#10b981';
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={currentGoalData.id}
                  className="mt-10 pt-6 border-t border-white/[0.04] grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full"
                >
                  <div className="md:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                        <span className="text-[10px] text-gray-medium block mb-1">⏱️ المخرجات والمدى الزمني للتنفيذ:</span>
                        <strong className="text-sm font-bold text-snow">{currentGoalData.estimatedTime}</strong>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                        <span className="text-[10px] text-gray-medium block mb-1">⚡ مؤشر نجاح الخطة المستهدف (KPI):</span>
                        <strong className="text-sm font-bold text-snow" style={{ color: activeColorHex }}>{currentGoalData.successMetric}</strong>
                      </div>
                    </div>

                    {/* Step-by-step deliverable pills */}
                    <div className="hidden sm:flex flex-wrap gap-2.5">
                      {currentGoalData.benefits.map((benefit, idx) => (
                        <div key={idx} className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-gray-soft flex items-center gap-1.5">
                          <Check size={11} style={{ color: activeColorHex }} />
                          <strong className="text-snow">{benefit.label}:</strong> {benefit.desc}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4 w-full flex flex-col justify-end">
                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      href={getWhatsAppStrategyUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center text-xs font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all cursor-pointer border-none"
                      style={{ 
                        backgroundColor: activeColorHex, 
                        color: currentGoalData.id === 'dominance' ? '#000000' : '#000000',
                        boxShadow: `0 8px 24px ${activeColorHex}25`
                      }}
                    >
                      <span>احجز وفعّل خارطة هذا الهدف المختار</span>
                      <Rocket size={13} className="shrink-0" />
                    </motion.a>
                    <span className="text-[9.5px] font-mono text-gray-medium/40 text-center mt-2">
                      [DIRECT_ZOOM_CONSULTATION_ENABLED]
                    </span>
                  </div>
                </motion.div>
              );
            })()}

            {/* INTERACTIVE GLOSSARY DECODER FOR ADVANCED METRICS */}
            <div className="mt-8 pt-6 border-t border-white/[0.04] w-full text-right">
              <button 
                onClick={() => setShowGlossary(!showGlossary)} 
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-medium hover:text-snow transition-colors cursor-pointer bg-transparent border-none outline-none"
              >
                <span>🧠 مفكك شيفرة المصطلحات الاستراتيجية والأرقام (الـ CLV والـ CPA وغيرها)</span>
                <span className={`text-[10px] transition-transform duration-300 ${showGlossary ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <AnimatePresence>
                {showGlossary && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] mt-4">
                      <div className="space-y-1.5 p-4 rounded-xl bg-orange-500/[0.01] border border-orange-500/5 hover:border-orange-500/20 transition-colors">
                        <span className="text-pulse-orange text-xs font-bold block">القيمة الحياتية للعميل (CLV / LTV)</span>
                        <p className="text-[11px] text-gray-medium leading-relaxed font-sans">
                          إجمالي صافي الأرباح المتوقعة التي يدخلها العميل الواحد إلى خزينة مشروعك طوال فترة ولائه لعلامتك التجارية. تحسينها يعني ألا يشتري العميل مرة ويرحل، بل تكرار تعامله لرفع عوائد استثمارك بدون صرف إعلاني جديد.
                        </p>
                      </div>
                      <div className="space-y-1.5 p-4 rounded-xl bg-cyan-500/[0.01] border border-cyan-500/5 hover:border-cyan-500/20 transition-colors">
                        <span className="text-cyan-400 text-xs font-bold block">تكلفة الاستحواذ للعميل (CPA)</span>
                        <p className="text-[11px] text-gray-medium leading-relaxed font-sans">
                          المبلغ الفعلي المستثمر لجلب عميل واحد جديد ومؤهل متمم لعملية الدفع أو الحجز. هدفنا الاستراتيجي هو خفض هذه القيمة مقابل زيادة القيمة الشرائية الدائمة للعميل لضمان أعلى مستويات الربحية المستدامة.
                        </p>
                      </div>
                      <div className="space-y-1.5 p-4 rounded-xl bg-emerald-500/[0.01] border border-emerald-500/5 hover:border-emerald-500/20 transition-colors">
                        <span className="text-emerald-400 text-xs font-bold block">العائد على الاستثمار الإعلاني (ROI / ROAS)</span>
                        <p className="text-[11px] text-gray-medium leading-relaxed font-sans">
                          مقياس لمدى ربحية أي مبالغ تنفقها على منصات الإعلانات وجلب حركة المرور. إنه المؤشر الدقيق الفوري الذي يبعدك عن دوامة هدر الميزانيات غير المحسوبة في الفراغ العشوائي.
                        </p>
                      </div>
                      <div className="space-y-1.5 p-4 rounded-xl bg-purple-500/[0.01] border border-purple-500/5 hover:border-purple-500/20 transition-colors">
                        <span className="text-purple-400 text-xs font-bold block">مستقبل المحيط الأزرق (Blue Ocean)</span>
                        <p className="text-[11px] text-gray-medium leading-relaxed font-sans">
                          تأسيس تموضع استراتيجي متفرد وتوسيع آفاق الطلب لعلامتك في فئة سوقية جديدة تماماً وبلا منافسة دموية، مما يعزز قدرتك على فرض الأسعار المناسبة لخدماتك دون مقارنة رخيصة بالمنافسين.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">الخدمات الأساسية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-dark/20 max-w-7xl mx-auto">
            {consultingServices.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="geometric-card bg-pure-ink p-10 flex flex-col items-center text-center gap-6 border-none"
              >
                <div className="w-16 h-16 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange transition-colors">
                  <service.icon size={32} />
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest font-mono">{service.subtitle}</span>
                    <h3 className="text-2xl font-bold text-snow">{service.title}</h3>
                  </div>
                  <p className="text-gray-medium text-sm leading-relaxed font-medium">
                    {service.desc}
                  </p>
                </div>
                <Link href="/contact" className="mt-auto text-pulse-orange text-sm font-bold flex items-center gap-1 group/link">
                  استفسر الآن <ChevronLeft size={16} className="group-hover/link:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What does the strategy include? */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
           <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-snow">ماذا تشمل الاستراتيجية؟</h2>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {strategyComponents.map((item, i) => (
                <div key={i} className="geometric-card bg-gray-dark/5 p-6 flex items-center gap-3 group">
                   <div className="w-2 h-2 bg-pulse-orange rounded-full" />
                   <span className="text-snow font-bold text-sm tracking-tight">{item}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Who is this for? */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">لمن هذه الخدمة؟</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {targetClients.map((client, i) => (
              <div key={i} className="p-8 border border-gray-dark bg-gray-dark/5 hover:border-pulse-orange/50 transition-colors">
                <h4 className="text-snow font-bold text-xl mb-4 flex items-center gap-3">
                   <CheckCircle2 className="text-pulse-orange" size={20} />
                   {client.title}
                </h4>
                <p className="text-gray-medium text-sm leading-relaxed font-medium">
                  {client.desc}
                </p>
              </div>
            ))}
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
                لا تجعل التسويق مجموعة أنشطة. <br />
                <span className="text-pulse-orange">اجعله خطة نمو.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                ابدأ بخارطة طريق واضحة قبل أن تصرف ميزانيتك على الحملات، المحتوى، والموقع الإلكتروني.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                اطلب استراتيجية تسويقية
              </Link>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/agma-method" className="hover:text-snow">منهجية AGMA</Link>
                <Link href="/services/performance-marketing" className="hover:text-snow">التسويق الأدائي</Link>
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
            "@type": "Service",
            "serviceType": "Marketing Strategy & Consulting",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "استشارات استراتيجية تسويقية، تحول رقمي، ودمج الذكاء الاصطناعي في العمليات التجارية في السعودية.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Strategy Services",
              "itemListElement": consultingServices.map(s => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": s.title
                }
              }))
            }
          }),
        }}
      />
    </main>
  );
}
