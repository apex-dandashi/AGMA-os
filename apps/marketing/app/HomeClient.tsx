'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NeuralMesh from '@/components/NeuralMesh';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  Zap, 
  Target, 
  Cpu, 
  Globe, 
  Search, 
  MessageSquare, 
  Palette, 
  Code, 
  Lightbulb, 
  ArrowLeft,
  Coins,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Compass,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import Magnetic from '@/components/ui/Magnetic';
import Tilt from '@/components/ui/Tilt';
import ScrollFocus from '@/components/ui/ScrollFocus';

// Component to animate numerical statistics from 0 upwards on scroll viewport entrance
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = target;
    const duration = 1800; // ms
    let startTime: number | null = null;
    let animationFrameId: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    }
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, target]);

  return (
    <span ref={ref} className="font-heading tabular-nums text-pulse-orange">
      {count.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}

export default function HomeClient() {
  const { scrollY } = useScroll();

  const [monthlyBudget, setMonthlyBudget] = React.useState<number>(35000);
  const [manualHours, setManualHours] = React.useState<number>(120);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const [activeMethodIndex, setActiveMethodIndex] = React.useState<number>(0);
  const [riyadhTime, setRiyadhTime] = React.useState<string>('');
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHoveredHero, setIsHoveredHero] = React.useState(false);

  React.useEffect(() => {
    const updateClock = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Riyadh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      setRiyadhTime(formatter.format(new Date()));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getWhatsAppRoiUrl = () => {
    const savedTime = Math.min(300, Math.round(monthlyBudget / 1000 + 30));
    const cpaDropPercent = Math.min(45, Math.round(18 + (monthlyBudget / 15000)));
    const roasMultiplier = Math.max(1.8, Math.min(3.5, 1.5 + (monthlyBudget / 150000))).toFixed(1);
    
    const text = `أهلاً فريق جيل الذكاء الاصطناعي (AI Generation) 👋
وددت مشاركة أرقام الحاسبة التفاعلية لعلامتنا التجارية ومناقشة تفاصيل وأرقام النمو والأتمتة المستهدفة:

💰 الميزانية التسويقية الشهرية: ${monthlyBudget.toLocaleString('en-US')} ريال سعودي
⏳ الوقت الموفر المقدر شهرياً: ${savedTime} ساعة عمل
📉 انخفاض تكلفة الاستحواذ المقارن (CPA): %${cpaDropPercent}-
📈 العائد الإضافي المتوقع على الإعلانات (ROAS): ${roasMultiplier}x إضافي!

أرغب في جدولة جلسة استشارية أولى لتفعيل هذه الأرقام لعلامتنا التجارية وبناء خريطة أتمتة مخصصة 🚀`;
    return `https://wa.me/966581195387?text=${encodeURIComponent(text)}`;
  };

  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const rotation = useTransform(scrollY, [0, 1000], [0, 45]);

  const agmaMethod = [
    { letter: 'A', name: 'Analyze', nameAr: 'تحليل', desc: 'نبدأ بالتعمق في بياناتك، منافسيك، وسلوك جمهورك باستخدام أدوات تحليل ذكية تتنبأ بالفرص قبل حدوثها.' },
    { letter: 'G', name: 'Generate', nameAr: 'توليد', desc: 'نقوم بتوليد أفكار ومحتوى وحلول إبداعية مدعومة بالذكاء الاصطناعي، تضمن التميز والسرعة في التنفيذ.' },
    { letter: 'M', name: 'Market', nameAr: 'تسويق', desc: 'نطلق حملاتك بدقة متناهية، مستهدفين العميل المثالي في الوقت المثالي عبر القنوات الأكثر تأثيراً.' },
    { letter: 'A', name: 'Adapt', nameAr: 'تطوير', desc: 'نراقب الأداء لحظياً، ونقوم بأتمتة التحسينات المستمرة لضمان أعلى عائد على الاستثمار ونمو مستدام.' },
  ];

  const services = [
    { id: 'ai-automation', title: 'الذكاء الاصطناعي والأتمتة', icon: Cpu, desc: 'أتمتة العمليات التسويقية وبناء أنظمة ذكاء اصطناعي مخصصة لعملك.' },
    { id: 'performance-marketing', title: 'التسويق الأدائي والإعلانات', icon: Target, desc: 'إدارة حملات إعلانية ذكية تركز على النتائج والتحويل الفعلي.' },
    { id: 'seo-content', title: 'السيو والمحتوى', icon: Search, desc: 'تصدر نتائج البحث وصناعة محتوى استراتيجي يخدم أهدافك.' },
    { id: 'social-media', title: 'السوشال ميديا والمجتمعات', icon: MessageSquare, desc: 'بناء حضور رقمي قوي وإدارة مجتمعات متفاعلة حول علامتك.' },
    { id: 'branding-creative', title: 'الهوية والتصميم الإبداعي', icon: Palette, desc: 'تصميم هويات بصرية تعكس روح العصر وتدمج بين الفن والتقنية.' },
    { id: 'web-digital', title: 'الويب والمنتجات الرقمية', icon: Code, desc: 'تطوير مواقع وتطبيقات تركز على تجربة المستخدم والأداء العالي.' },
    { id: 'strategy-consulting', title: 'الاستراتيجية والاستشارات', icon: Lightbulb, desc: 'رسم خارطة طريق واضحة لنمو شركتك في العصر الرقمي.' },
    { id: 'pr-media', title: 'العلاقات العامة والإعلام', icon: Globe, desc: 'إدارة السمعة الرقمية والتواصل الفعال مع الجمهور والمؤثرين.' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <main className="min-h-screen relative overflow-hidden" suppressHydrationWarning>
      <Header />

      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
        onMouseEnter={() => setIsHoveredHero(true)}
        onMouseLeave={() => setIsHoveredHero(false)}
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <NeuralMesh />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-transparent to-[#0A0A0A]/80 opacity-60" />
          
          {/* Interactive Glowing Cursor Follower in the background */}
          {isHoveredHero && (
            <motion.div 
              className="absolute pointer-events-none rounded-full blur-[140px] opacity-35 z-0 mix-blend-screen hidden lg:block"
              animate={{
                x: mousePosition.x - 225,
                y: mousePosition.y - 225,
              }}
              transition={{ type: "spring", damping: 30, stiffness: 150, mass: 0.2 }}
              style={{
                width: '450px',
                height: '450px',
                background: 'radial-gradient(circle, rgba(255,97,0,0.18) 0%, rgba(0,243,255,0.08) 55%, transparent 100%)',
                position: 'absolute',
                left: 0,
                top: 0,
              }}
            />
          )}

          {/* Floating Parallax Elements */}
          <motion.div 
            style={{ y: y1, rotate: rotation }}
            className="absolute top-1/4 right-[10%] w-32 h-32 border border-pulse-orange/20 rounded-full blur-[2px] opacity-20"
          />
          <motion.div 
            style={{ y: y2 }}
            className="absolute bottom-1/4 left-[5%] w-48 h-48 border border-pulse-orange/10 rounded-sm blur-[1px] opacity-10 rotate-12"
          />
        </div>
        
        <div className="grid-pattern" />
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-8 border border-pulse-orange/20 rounded-full bg-[#0d0d0d]/80 shadow-[0_0_20px_rgba(255,97,0,0.06)] backdrop-blur relative overflow-hidden group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pulse-orange/80 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pulse-orange"></span>
              </span>
              <span className="text-snow text-xs font-bold tracking-wider font-mono">
                {riyadhTime ? `${riyadhTime} KSA` : '00:00:00 KSA'}
              </span>
              <span className="text-gray-medium/30 text-xs font-semibold">|</span>
              <span className="text-pulse-orange text-xs font-bold tracking-widest uppercase">من الرياض، قلب المملكة</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black font-black-arabic mb-8 leading-[1.2] text-snow max-w-4xl mx-auto tracking-normal py-4"
            >
              وكالتك الكاملة <br className="hidden sm:block" />
              في عصر <br className="hidden sm:block" />
              <span className="text-gradient px-4 py-2 sm:py-6 inline-block leading-[1.4]">الذكاء الاصطناعي</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-gray-medium text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium px-4"
            >
              AGMA هي وكالة جيل الذكاء الاصطناعي. نجمع بين الأتمتة المتقدمة والبيانات الدقيقة والإبداع البشري لتحقيق نمو استراتيجي لشركات المملكة الواعدة.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-6"
            >
              <Magnetic className="w-full sm:w-auto">
                <Link href="/contact" data-cursor-text="GROW" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 shadow-lg shadow-pulse-orange/20 block text-center transition-all duration-300">
                  ابدأ رحلة النمو الآن
                </Link>
              </Magnetic>
              <Magnetic className="w-full sm:w-auto">
                <Link href="/services" data-cursor-text="EXPLORE" className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 block text-center transition-all duration-300">
                  استعرض خدماتنا
                </Link>
              </Magnetic>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section className="py-20 border-y border-gray-dark bg-gray-dark/10">
        <div className="container mx-auto px-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-x divide-x-reverse divide-gray-dark"
          >
            {[
              { label: 'النمو المتوسط للعملاء', target: 45, suffix: '%' },
              { label: 'ساعات العمل المؤتمتة', target: 12, suffix: 'k+' },
              { label: 'حملات رقمية ناجحة', target: 500, suffix: '+' },
              { label: 'خبير في جيل الذكاء الاصطناعي', target: 40, suffix: '+' },
            ].map((stat, i) => (
              <motion.div variants={itemVariants} key={i} className="space-y-2 px-4">
                <div className="text-3xl lg:text-4xl font-black text-pulse-orange font-heading">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-gray-medium text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 relative">
        <div className="grid-pattern opacity-[0.015]" />
        <div className="container mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-16 gap-6"
          >
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-snow">
                منهجية AGMA Method™
              </h2>
              <p className="text-gray-medium font-medium text-sm sm:text-base">
                نظامنا الرباعي المصمم لتحويل البيانات إلى نتائج تجارية ملموسة عبر التكامل الكامل بين الذكاء البشري والاصطناعي.
              </p>
            </div>
            <div className="text-stroke font-black text-5xl sm:text-7xl lg:text-9xl absolute -top-10 -right-4 sm:-right-10 opacity-40 select-none pointer-events-none font-mono">
              SYSTEM v4.0
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans mt-12">
            
            {/* SELECTORS COLLAPSE / STEPS STACK (5/12 columns on large screens) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {agmaMethod.map((step, idx) => {
                const isActive = activeMethodIndex === idx;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveMethodIndex(idx)}
                    className={`p-6 rounded-2xl border text-right cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                      isActive 
                        ? 'bg-neutral-900 border-pulse-orange shadow-[0_4px_25px_rgba(255,97,0,0.1)]' 
                        : 'bg-neutral-950/40 border-white/5 opacity-60 hover:opacity-100 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-black ${
                        isActive ? 'bg-pulse-orange/20 text-pulse-orange' : 'bg-white/5 text-gray-medium'
                      }`}>
                        Phase 0{idx + 1}
                      </span>
                      <strong className={`font-mono text-base tracking-widest ${isActive ? 'text-pulse-orange' : 'text-gray-medium/40'}`}>
                        {step.letter}
                      </strong>
                    </div>

                    <h3 className={`text-lg sm:text-xl font-black mb-2 transition-colors duration-300 ${isActive ? 'text-snow' : 'text-gray-medium'}`}>
                      {step.name} — {step.nameAr}
                    </h3>
                    
                    <p className={`text-xs leading-relaxed transition-colors duration-300 ${isActive ? 'text-gray-medium' : 'text-gray-medium/50'}`}>
                      {step.desc}
                    </p>

                    {/* Active glowing underline tag */}
                    {isActive && (
                      <motion.div 
                        layoutId="active-method-line"
                        className="absolute bottom-0 right-0 left-0 h-[2px] bg-pulse-orange"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* DIGITAL COMMAND CENTER (7/12 columns) */}
            <div className="lg:col-span-7 bg-neutral-950 border border-white/5 shadow-2xl rounded-3xl p-5 sm:p-7 relative overflow-hidden flex flex-col justify-between h-[450px] transition-all duration-300">
              {/* TOP COCKPIT CONTROLS HEADER */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[10px] font-mono text-gray-medium/50 select-none flex items-center gap-1.5">
                  <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="uppercase text-left font-mono">
                    SYSTEM_CORE_V4_RUNNING // /agma/method/{agmaMethod[activeMethodIndex].name.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* DYNAMIC SCREEN CHANGELOG CONTENT */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMethodIndex}
                  initial={{ opacity: 0, scale: 0.98, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -5 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col justify-between mt-4"
                >
                  {activeMethodIndex === 0 && (
                    <div className="flex-1 flex flex-col justify-between font-mono text-right pb-1">
                      <div className="space-y-3">
                        <div className="text-[11px] text-emerald-400 leading-normal bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/10 text-right">
                          &gt; AI.discoverAudiences(&quot;KSA_MARKETS&quot;) ...<br />
                          &gt; Scanning demographic micro-segments ...<br />
                          <span className="text-snow font-bold">&gt; Done. Discovered 12 high-intent organic clusters.</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">ثقة التنبؤ الديموغرافي:</span>
                            <strong className="text-base font-black text-emerald-400">98.6%</strong>
                          </div>
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">تكلفة حد سقف المحاكاة:</span>
                            <strong className="text-base font-black text-snow">14.2 ريال SAR</strong>
                          </div>
                        </div>
                      </div>

                      {/* Visual: Radar scanning */}
                      <div className="h-32 relative flex items-center justify-center border border-white/5 rounded-xl bg-black/40 overflow-hidden mt-4">
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-0 opacity-10">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="border-[0.5px] border-white/10" />
                          ))}
                        </div>
                        <div className="absolute w-24 h-24 border border-pulse-orange/10 rounded-full animate-ping" />
                        <div className="absolute w-14 h-14 border border-pulse-orange/20 rounded-full" />
                        <div 
                          className="absolute w-0.5 h-16 bg-gradient-to-t from-pulse-orange to-transparent origin-bottom animate-spin" 
                          style={{ animationDuration: '3.5s' }} 
                        />
                        <span className="absolute bottom-2 right-3 text-[8.5px] text-pulse-orange font-bold uppercase tracking-wider font-mono">
                          A_SCAN_ACTIVE // DISCOVERY LAYER
                        </span>
                      </div>
                    </div>
                  )}

                  {activeMethodIndex === 1 && (
                    <div className="flex-1 flex flex-col justify-between font-mono text-right pb-1">
                      <div className="space-y-3">
                        <div className="text-[11px] text-cyan-400 leading-normal bg-cyan-950/20 p-3.5 rounded-xl border border-cyan-500/10 text-right">
                          &gt; Generator.synthAds(&quot;KSA_Promo_SaaS&quot;, 150) ...<br />
                          &gt; Iteration 150 complete. Synthesizing assets ...<br />
                          <span className="text-snow font-bold">&gt; Copy &amp; graphics score threshold &gt;= 9.4 verified.</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">التكرارات الإبداعية / دقيقة:</span>
                            <strong className="text-base font-black text-cyan-400">120x baseline</strong>
                          </div>
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">المعدل الإضافي CTR:</span>
                            <strong className="text-base font-black text-snow">+4.2%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Visual: Prompt layout pills */}
                      <div className="relative border border-white/5 rounded-xl bg-black/40 p-4 mt-4 text-right">
                        <span className="text-[9px] text-cyan-400 block mb-2 font-bold uppercase tracking-wider">PROMPT INJECTION ACTIVE:</span>
                        <div className="flex flex-wrap gap-2 mb-3 justify-end">
                          <span className="text-[9px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-md">رؤية السعودية 2030</span>
                          <span className="text-[9px] bg-pulse-orange/10 text-pulse-orange border border-pulse-orange/20 px-2.5 py-1 rounded-md">جدولة أوتوماتيكية</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-md">نمو المبيعات (SaaS)</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[8px] text-gray-medium">
                            <span>جودة صياغة المتغيرات وتحسين اللكنة</span>
                            <span>98%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              className="bg-cyan-400 h-full rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: "98%" }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMethodIndex === 2 && (
                    <div className="flex-1 flex flex-col justify-between font-mono text-right pb-1">
                      <div className="space-y-3">
                        <div className="text-[11px] text-amber-400 leading-normal bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/10 text-right">
                          &gt; Dispatcher.optimizeBids(platforms, maxCPA) ...<br />
                          &gt; Real-time auction dynamic bidding index stable ...<br />
                          <span className="text-snow font-bold">&gt; Automated budget reallocation complete.</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">تتبع الصرف والتحويل:</span>
                            <strong className="text-base font-black text-amber-400">24/7 Live Sync</strong>
                          </div>
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">أتمتة تعديل المزايدات:</span>
                            <strong className="text-base font-black text-snow">كل 15 ثانية</strong>
                          </div>
                        </div>
                      </div>

                      {/* Visual: Horizontal budget allocation meters */}
                      <div className="space-y-2 border border-white/5 rounded-xl bg-black/40 p-4 mt-4 text-right">
                        <span className="text-[8.5px] text-amber-400 block uppercase font-bold tracking-wider mb-2">LIVE BUDGET BID DISPATCHING:</span>
                        {[
                          { logo: 'TikTok Active Ads', p: '45%' },
                          { logo: 'Snapchat Story Campaign', p: '28%' },
                          { logo: 'Google GAds MaxPerformance', p: '17%' },
                          { logo: 'Meta Retargeting System', p: '10%' }
                        ].map((plat, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[7.5px] text-gray-medium">
                              <span>{plat.logo}</span>
                              <span className="font-bold text-amber-400">{plat.p}</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <motion.div 
                                className="bg-amber-400 h-full rounded-full" 
                                initial={{ width: 0 }}
                                animate={{ width: plat.p }}
                                transition={{ duration: 0.8, delay: idx * 0.1 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeMethodIndex === 3 && (
                    <div className="flex-1 flex flex-col justify-between font-mono text-right pb-1">
                      <div className="space-y-3">
                        <div className="text-[11px] text-pulse-orange leading-normal bg-pulse-orange/5 p-3.5 rounded-xl border border-pulse-orange/10 text-right">
                          &gt; FeedbackLoop.evaluateROAS() ...<br />
                          &gt; Self-optimizing loop checking budget leaks ...<br />
                          <span className="text-snow font-bold">&gt; Redirecting 35% leaked budget. System optimized.</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">الميزانية المستردة من التسرب:</span>
                            <strong className="text-base font-black text-pulse-orange">35% توفير</strong>
                          </div>
                          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-right">
                            <span className="text-[9px] text-gray-medium block">مستهدف استرداد العوائد (CPA):</span>
                            <strong className="text-base font-black text-snow">5.2x ROAS Peak</strong>
                          </div>
                        </div>
                      </div>

                      {/* Visual: Growth line graph */}
                      <div className="h-32 border border-white/5 rounded-xl bg-black/40 p-3 mt-4 relative flex items-end">
                        <span className="absolute top-2.5 right-3 text-[8.5px] text-pulse-orange font-bold uppercase tracking-wider">
                          REAL-TIME_ROAS_SCALING_CURVE
                        </span>
                        
                        <svg className="w-full h-16 pointer-events-none drop-shadow-[0_0_12px_rgba(255,97,0,0.4)]" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <motion.path
                            d="M 5 25 Q 20 23 35 18 T 65 9 T 95 2"
                            fill="none"
                            stroke="#ff6100"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                          <motion.path
                            d="M 5 25 Q 20 23 35 18 T 65 9 T 95 2 L 95 30 L 5 30 Z"
                            fill="url(#adapt-glow-dashboard)"
                            opacity="0.12"
                          />
                          <defs>
                            <linearGradient id="adapt-glow-dashboard" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff6100" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        <div className="absolute right-[93%] bottom-14 w-2 h-2 rounded-full bg-pulse-orange animate-ping" />
                        <div className="absolute left-[3%] top-1/4 w-1.5 h-1.5 rounded-full bg-pulse-orange shadow-lg" />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-24 px-6 bg-deep-navy/10 relative">
        <div className="orange-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.05]" />
        
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 relative px-4"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 text-snow tracking-tighter-heading">حلولنا <span className="text-pulse-orange">الفائقة</span></h2>
            <p className="text-gray-medium max-w-2xl mx-auto text-base sm:text-lg font-medium">
              نغطي ثمانية مجالات استراتيجية لنكون شريكك التقني والإبداعي الوحيد في رحلة التحول نحو الذكاء الاصطناعي.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {services.map((service, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                initial="initial"
                whileHover="hover"
                className="relative h-full"
              >
                <ScrollFocus>
                  <Tilt className="h-full">
                    <Link 
                      href={`/services/${service.id || ''}`} 
                      data-cursor-text="VIEW"
                      className="group block h-full p-8 rounded-3xl border border-snow/5 bg-gray-dark/30 hover:bg-pulse-orange/5 hover:border-pulse-orange/30 transition-all duration-500 relative overflow-hidden"
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
                      <div className="w-12 h-12 rounded-2xl bg-pulse-orange/10 flex items-center justify-center mb-6 text-pulse-orange group-hover:scale-110 transition-transform">
                        <service.icon size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-snow group-hover:text-pulse-orange transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-medium text-sm leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </Link>
                </Tilt>
              </ScrollFocus>
            </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* INTERACTIVE AI ROI OPTIMIZATION SANDBOX */}
      <section className="py-24 px-6 relative bg-gradient-to-b from-pure-ink via-[#0d0d0d] to-pure-ink border-t border-b border-white/[0.03]">
        <div className="grid-pattern opacity-[0.03]" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-pulse-orange/20 rounded-full bg-pulse-orange/5 text-pulse-orange text-[10px] font-bold uppercase tracking-widest font-mono">
              <Sparkles size={11} className="animate-pulse" />
              مختبر محاكاة العائد على الأتمتة بالذكاء الاصطناعي
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-snow tracking-tight leading-tight">
              كم توفّر لشركتك هجرتك لـ AI-Native؟
            </h2>
            <p className="text-gray-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              الوكالات التقليدية تبدد عوائدك في الأيدي العاملة البطيئة والخطوات اليدوية المكررة. حرك المؤشرات أدناه واكتشف التأثير الحقيقي والمالي الفوري لأتمتة تسويقك وعملياتك بدعم جيل الذكاء الاصطناعي.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
            {/* SLIDERS BOX (5/12 columns) */}
            <div className="lg:col-span-5 bg-neutral-950/60 border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-8">
              <div>
                <div className="text-right border-b border-white/[0.03] pb-3 mb-6">
                  <span className="text-[10px] font-mono text-gray-medium/40 uppercase block">Simulation Parameters</span>
                  <span className="text-xs font-bold text-snow">حدد موارك ونفقاتك الحالية لتفحص فرص الأتمتة</span>
                </div>

                {/* SLIDER 1: Monthly Budget */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-medium font-medium">الميزانية التسويقية الشهرية الحالية:</span>
                    <span className="text-pulse-orange font-bold font-mono text-base">
                      {monthlyBudget.toLocaleString('en-US')} <span className="text-[11px] text-gray-medium mr-1">ريال</span>
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="5000"
                    max="350000"
                    step="5000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-pulse-orange"
                    style={{ accentColor: '#ff6100' }}
                  />
                  <div className="flex justify-between text-[9px] text-gray-medium/50 font-mono">
                    <span>5,000 ريال</span>
                    <span>100,000 ريال</span>
                    <span>250,000 ريال</span>
                    <span>350,000 ريال+</span>
                  </div>
                </div>

                {/* SLIDER 2: Manual Operations Hours */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-medium font-medium">ساعات المتابعة اليدوية والإنتاج شهرياً:</span>
                    <span className="text-cyan-400 font-bold font-mono text-base">
                      {manualHours} <span className="text-[11px] text-gray-medium mr-1">ساعة</span>
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="20"
                    max="600"
                    step="10"
                    value={manualHours}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-cyan-400"
                    style={{ accentColor: '#00f3ff' }}
                  />
                  <div className="flex justify-between text-[9px] text-gray-medium/50 font-mono">
                    <span>20 ساعة</span>
                    <span>150 ساعة</span>
                    <span>300 ساعة</span>
                    <span>600 ساعة+</span>
                  </div>
                </div>
              </div>

              {/* Quick tip box */}
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] flex gap-2.5 items-start">
                <HelpCircle size={15} className="text-pulse-orange mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-medium leading-relaxed">
                  هذه المعادلة مبنية على رصد حقيقي للتوفير الذي تسجله الأنظمة المؤتمتة وبرامج فرز وتحليل البيانات وحقن الـ GenAI في عمليات صياغة وإطلاق الحملات الرقمية لعملائنا في الخليج.
                </p>
              </div>
            </div>

            {/* BENEFITS & SAVINGS BOX (7/12 columns) */}
            <div className="lg:col-span-7 bg-neutral-950/40 border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-8">
              <div className="text-right border-b border-white/[0.03] pb-3">
                <span className="text-[10px] font-mono text-gray-medium/40 uppercase block">Expected Dynamic ROI</span>
                <span className="text-xs font-bold text-snow">العائد والمردود المتوقع تحقيقه عبر جيل الذكاء الاصطناعي</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Save 1: CPA Drop */}
                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 relative overflow-hidden group hover:border-[#ff6100]/25 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-pulse-orange/10 flex items-center justify-center text-pulse-orange">
                    <Coins size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-medium block">انخفاض تكلفة الاستحواذ (CPA):</span>
                    <strong className="text-xl sm:text-2xl font-black text-snow block mt-1 font-mono text-pulse-orange">
                      -%{Math.min(45, Math.round(18 + (monthlyBudget / 15000)))}
                    </strong>
                    <p className="text-[11px] text-gray-medium mt-1 leading-relaxed">
                      انخفاض تكلفة الحصول على العميل نتيجة دقة خوارزميات الاستهداف والاستبعاد التلقائي للمتغيرات الضعيفة.
                    </p>
                  </div>
                </div>

                {/* Save 2: Time Saved */}
                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 relative overflow-hidden group hover:border-cyan-400/25 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-medium block">ساعات العمل الموفرة شهرياً:</span>
                    <strong className="text-xl sm:text-2xl font-black text-snow block mt-1 font-mono text-cyan-400">
                      {Math.min(300, Math.round(monthlyBudget / 1000 + 30))} <span className="text-xs text-gray-medium">ساعة/ش</span>
                    </strong>
                    <p className="text-[11px] text-gray-medium mt-1 leading-relaxed">
                      ساعات ترفع ثقلها الأتمتة الذكية والأنظمة الروبوتية المكررة عن عاتق موظفي التسويق في فريق عملك.
                    </p>
                  </div>
                </div>

                {/* Save 3: ROAS Lift */}
                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 relative overflow-hidden group hover:border-emerald-400/25 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-medium block">العائد الإضافي المتوقع (ROAS):</span>
                    <strong className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1 font-mono">
                      +{Math.max(1.8, Math.min(3.5, 1.5 + (monthlyBudget / 150000))).toFixed(1)}x <span className="text-xs text-gray-medium">إضافي</span>
                    </strong>
                    <p className="text-[11px] text-gray-medium mt-1 leading-relaxed">
                      مضاعف كفاءة وتغطية تسويقية بفضل سرعة اتخاذ القرار المناسب وتضييق فترات التجربة اليدوية البطيئة.
                    </p>
                  </div>
                </div>

              </div>

              {/* CTA row nested dynamically inside ROI */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.03]">
                <div className="space-y-1 text-right">
                  <span className="text-[9.5px] font-mono text-pulse-orange uppercase block tracking-wider">[STRATEGIC_PLANNING_READY]</span>
                  <span className="text-xs text-snow font-bold leading-relaxed">تواصل معنا لتفعيل هذه الأرقام المثيرة لعلامتك التجارية</span>
                </div>
                
                <div className="w-full sm:w-auto">
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={getWhatsAppRoiUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full sm:w-auto text-xs font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 !border-none cursor-pointer"
                    style={{ 
                      backgroundColor: '#ff6100', 
                      color: '#000000',
                      boxShadow: '0 8px 24px rgba(255,97,0,0.2)'
                    }}
                  >
                    <span>احجز جلسة لتفعيل هذه الأرقام لعلامتك</span>
                    <ArrowLeft size={13} className="shrink-0 scale-x-[-1]" />
                  </motion.a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-square rounded-sm bg-gray-dark/50 overflow-hidden border border-gray-dark relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-pulse-orange/10 to-transparent flex items-center justify-center">
                    <Zap className="text-pulse-orange w-32 h-32 opacity-20" />
                 </div>
              </div>
              <div className="absolute -bottom-6 -right-6 geometric-card bg-gray-dark p-6 max-w-[240px]">
                <p className="text-pulse-orange font-bold text-sm mb-1 font-heading uppercase tracking-widest">AGMA Native-AI</p>
                <p className="text-xs text-gray-light leading-relaxed font-medium">كل عملياتنا مبنية بالذكاء الاصطناعي من الداخل، لسنا وكالة تستخدم أدوات فقط.</p>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-4xl lg:text-6xl font-bold leading-tight text-snow">
                نحن المحرك الجديد <br />
                لنمو <span className="text-pulse-orange">علامتك</span>.
              </h2>
              <p className="text-gray-medium text-lg leading-relaxed font-medium">
                في AGMA، نعتقد أن عصر التسويق التقليدي قد انتهى. نحن لا نصب الذكاء الاصطناعي فوق عمليات قديمة، بل أعدنا بناء مفهوم &quot;الوكالة&quot; من الصفر ليعمل بالبيانات والأتمتة كقلب نابض.
              </p>
              <ul className="space-y-4">
                {[
                  'تنفيذ أسرع بنسبة 300% من الوكالات التقليدية.',
                  'قرارات مبنية على بيانات تنبؤية دقيقة للغاية.',
                  'فريق يجمع بين الإبداع البشري والقدرات التقنية.',
                  'تمركز استراتيجي في الرياض لخدمة السوق الخليجي.'
                ].map((point, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-gray-light font-medium">
                    <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-sm bg-pulse-orange" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link href="/about" className="btn-primary inline-flex items-center gap-3">
                  اكتشف لماذا AGMA؟ <ArrowLeft size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="py-24 px-6 relative bg-deep-navy/5">
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-pulse-orange/20 rounded-full bg-pulse-orange/5 text-pulse-orange text-[10px] font-bold uppercase tracking-widest font-mono">
              <HelpCircle size={11} className="text-pulse-orange" />
              قسم المعرفة والإضاءات
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-snow tracking-tight leading-tight">
              الأسئلة الأكثر تداولاً
            </h2>
            <p className="text-gray-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              إضاءات وتفاصيل سريعة تجيب على تساؤلات النخبة من شركائنا حول كيفية دمج الذكاء الاصطناعي بمقاييس الأمان والسرعة الفائقة.
            </p>
          </div>

          <div className="space-y-4 font-sans">
            {[
              {
                q: "كيف يختلف عمل وكالتكم Native-AI عن وكالات التسويق والميديا التقليدية؟",
                a: "الوكالات التقليدية تعتمد على تضخيم فِرق العمل اليدوية مما يسبب بطء التنفيذ وهدر الميزانيات التجريبية. نحن نعيد صياغة المفهوم كلياً بإنشاء أنظمة وروبوتات ناعمة تقوم بأتمتة فرز الجماهير، وتوليد واختبار مئات المتغيرات الإبداعية في دقائق بدلاً من أسابيع، مدعومة بصناعة استراتيجية بشرية تضمن لك السرعة والدقة وخفض تكلفة الاستحواذ."
              },
              {
                q: "هل الذكاء الاصطناعي يلغي دور اللمسة الإنسانية الإبداعية؟",
                a: "بالعكس تماماً. الذكاء الاصطناعي هو المحرك والساعد المضاعف، لكن الرؤية، والقصة الملهمة، والتقييم الاستراتيجي، وفهم اللمسة الحجازية أو النجدية أو الخليجية بدقة هي ملكة يتميز بها خبراؤنا البشريون. الذكاء الاصطناعي يتولى روتين العمليات الصعبة والتكرار لتتفرغ عقولنا لتصميم وبناء الابتكارات المزلزلة."
              },
              {
                q: "ما هي فئات الشركات والمشاريع الأكثر ملاءمة لخدماتكم؟",
                a: "نخدم بالدرجة الأولى شركات التقنية والـ SaaS الواعدة، المتاجر الكبرى والمنصات الرقمية سريعة التوسع، والشركات والمؤسسات الطموحة الساعية للتحول الرقمي الكامل والريادة في السوق الخليجي عبر حلول تقنية واقتصادية غير مقلدة."
              },
              {
                q: "هل بيانات مشروعي وحملات الإعلانات آمنة ومحمية لدينا؟",
                a: "الالتزام بالأمن السيبراني وبنود الحوكمة المحلية والعالمية هو أساس ميثاق العمل لدينا. نقوم ببناء بوابات أمنة وحلقات اتصال وسحابية مغلقة، ونتبع بروتوكولات صارمة تضمن عدم تسرب أو استخدام بياناتك وسجلات عملائك في تدريب النماذج العامة المفتوحة."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-white/[0.04] bg-neutral-950/40 overflow-hidden transition-all duration-300 hover:border-white/10"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-5 px-6 sm:px-8 text-right flex justify-between items-center gap-4 bg-transparent border-none outline-none cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-snow hover:text-pulse-orange transition-colors">
                      {faq.q}
                    </span>
                    <span 
                      className={`text-gray-medium transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-pulse-orange' : ''}`}
                    >
                      <ChevronDown size={18} />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 sm:px-8 pb-6 text-xs sm:text-sm text-gray-medium leading-relaxed font-sans border-t border-white/[0.02] pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 mb-20">
        <div className="container mx-auto">
          <motion.div 
            initial="initial"
            whileHover="hover"
            data-cursor-text="CONTACT" 
            className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5 rounded-[40px]"
          >
            {/* Digital Scan Line Effect for CTA */}
            <motion.div 
              variants={{
                initial: { left: "-10%", opacity: 0 },
                hover: { left: "110%", opacity: 1 }
              }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
              className="absolute top-0 bottom-0 w-[2px] bg-pulse-orange shadow-[0_0_20px_rgba(244,77,43,1)] z-20 pointer-events-none"
            />

            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10 px-4">
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 text-snow leading-tight">
                جاهز لجيل <br />
                <span className="text-pulse-orange">النمو القادم؟</span>
              </h2>
              <p className="text-gray-medium text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نحلل علامتك التجارية ونقدم لك أول استراتيجية نمو مدعومة بالذكاء الاصطناعي مجاناً.
              </p>
              <div className="flex justify-center w-full">
                <Magnetic className="w-full sm:w-auto">
                  <Link href="/contact" className="btn-primary text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 shadow-2xl shadow-pulse-orange/20 inline-block w-full sm:w-auto text-center transition-all duration-300">
                    احجز مكالمة استراتيجية الآن
                  </Link>
                </Magnetic>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Suggested Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AdvertisingAgency",
            "name": "AGMA | وكالة جيل الذكاء الاصطناعي",
            "description": "وكالة تسويق سعودية Native-AI متخصصة في الأتمتة والذكاء الاصطناعي والنمو الاستراتيجي.",
            "url": "https://agma.com.sa",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "الرياض",
              "addressCountry": "SA"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "sales",
              "email": "hello@agma.com.sa"
            }
          }),
        }}
      />
    </main>
  );
}
