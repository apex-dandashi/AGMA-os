'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  ShoppingBag, 
  Smartphone, 
  Zap, 
  MousePointer2, 
  Layout, 
  CheckCircle2, 
  ChevronLeft,
  Globe,
  Activity,
  Target,
  Rocket,
  Search,
  Eye,
  Settings,
  MessageSquare,
  BarChart3,
  Layers,
  MousePointerClick,
  MonitorSmartphone,
  Server,
  Cloud,
  Power,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Cpu,
  X
} from 'lucide-react';
import Link from 'next/link';

const webServices = [
  {
    title: 'تصميم وتطوير المواقع',
    subtitle: 'Website Design & Development',
    desc: 'مواقع احترافية بأحدث التقنيات — تصميم متجاوب، أداء سريع، SEO جاهز، وإدارة سهلة.',
    price: 'تبدأ من 7,500 ر.س',
    icon: Code,
  },
  {
    title: 'المتاجر الإلكترونية',
    subtitle: 'E-commerce (Salla, Zid, Shopify)',
    desc: 'إعداد وتطوير متاجر إلكترونية متكاملة مع الدفع، الشحن، الصفحات، والتحليلات.',
    price: 'تبدأ من 9,000 ر.س',
    icon: ShoppingBag,
  },
  {
    title: 'تصميم واجهات التطبيقات',
    subtitle: 'App UI/UX Design',
    desc: 'تصميم تجارب تطبيقات جوال بنظام تصميمي واضح وقابل للتوسع.',
    price: 'عرض مخصص لكل تطبيق',
    icon: Layout,
  },
  {
    title: 'صفحات الهبوط',
    subtitle: 'Landing Pages',
    desc: 'صفحات هبوط محسنة للتحويل للحملات الإعلانية، مع نسخ مقنع، تصميم سريع، واختبارات A/B.',
    price: 'من 2,500 إلى 7,500 ر.س',
    icon: MousePointer2,
  }
];

const buildStats = [
  'مواقع شركات', 'مواقع وكالات', 'مواقع خدمات', 'متاجر إلكترونية', 'صفحات هبوط', 'صفحات حملات', 'منصات حجز', 'واجهات تطبيقات'
];

const processStages = [
  { title: 'تحليل الهدف', icon: Target },
  { title: 'خريطة الموقع', icon: Layers },
  { title: 'كتابة المحتوى', icon: MessageSquare },
  { title: 'تصميم UX/UI', icon: Layout },
  { title: 'التطوير', icon: Code },
  { title: 'الربط والتتبع', icon: BarChart3 },
  { title: 'الاختبار', icon: Activity },
  { title: 'الإطلاق', icon: Rocket }
];

export default function WebDigitalPage() {
  const [isLive, setIsLive] = React.useState<boolean>(false);
  const [isAssembling, setIsAssembling] = React.useState<boolean>(false);
  const [assembleProgress, setAssembleProgress] = React.useState<number>(0);
  const [activeTab, setActiveTab] = React.useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Highly Interactive Custom State Parameters for Web Agency Sandbox
  const [calcPages, setCalcPages] = React.useState<number>(5);
  const [websiteType, setWebsiteType] = React.useState<'design' | 'performance' | 'ai'>('design');
  const [speedScore, setSpeedScore] = React.useState<number>(99);
  const [isSpeedTesting, setIsSpeedTesting] = React.useState<boolean>(false);
  const [activeUsers, setActiveUsers] = React.useState<number>(142);
  const [clickedMetric, setClickedMetric] = React.useState<string | null>(null);
  const [demoColor, setDemoColor] = React.useState<'cyan' | 'teal' | 'emerald'>('cyan');

  // Contact modal state
  const [isContactOpen, setIsContactOpen] = React.useState<boolean>(false);
  const [contactForm, setContactForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    projectType: 'web-development',
    msg: ''
  });
  const [isSubmittingForm, setIsSubmittingForm] = React.useState<boolean>(false);
  const [submittingProgress, setSubmittingProgress] = React.useState<number>(0);
  const [isSubmitDone, setIsSubmitDone] = React.useState<boolean>(false);
  const [ticketId, setTicketId] = React.useState<number>(5482);
  const [formErrors, setFormErrors] = React.useState<string[]>([]);

  const openContactWithMsg = (message: string, projectType = 'web-development') => {
    setContactForm({
      name: '',
      email: '',
      phone: '',
      projectType,
      msg: message
    });
    setFormErrors([]);
    setIsSubmitDone(false);
    setIsSubmittingForm(false);
    setSubmittingProgress(0);
    setIsContactOpen(true);
  };

  const getWhatsAppUrl = () => {
    const phoneNumber = "966581195387"; // AGMA official WhatsApp Number
    
    let serviceLabel = "تصميم وتطوير المواقع المخصصة";
    if (contactForm.projectType === 'landing-page') serviceLabel = "بناء صفحات الهبوط التسويقية";
    if (contactForm.projectType === 'e-commerce') serviceLabel = "إعداد متجر إلكتروني متكامل";
    if (contactForm.projectType === 'consultation') serviceLabel = "استشارة فنية استراتيجية";

    const baseMsg = `${contactForm.msg || 'أهلاً فريق جيل الذكاء الاصطناعي، أود البدء الفوري في تصميم موقعنا الإلكتروني وترقية المحتوى البرمجي. أرجو التواصل لمناقشة التفاصيل والأسعار.'}`;

    const text = `أهلاً فريق جيل الذكاء الاصطناعي 👋

أود تقديم طلب استشارة وتأسيس مشروع رقمي مباشر:

👤 الاسم الكريم: ${contactForm.name || 'غير محدد'}
📞 جوال الاتصال: ${contactForm.phone || 'غير محدد'}
📧 البريد الإلكتروني: ${contactForm.email || 'غير محدد'}
📁 نوع الخدمة: ${serviceLabel}
📄 عدد صفحات الموقع: ${calcPages} صفحات
💰 الميزانية التقريبية للمشروع: ${pricing.total.toLocaleString('en-US')} ر.س

💬 تفاصيل الفكرة:
${baseMsg}

تم التوريد عبر محرك AGMA الهيكلي اللحظي 🚀`;

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmitContactForm = (e: React.MouseEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!contactForm.name.trim()) {
      errors.push('يرجى كتابة الاسم الكريم لنتواصل معك بما يليق.');
    }
    if (!contactForm.phone.trim()) {
      errors.push('الرجاء تعبئة رقم الجوال للاتصال وتنسيق الموعد.');
    }
    if (!contactForm.email.trim() || !/^\S+@\S+\.\S+$/.test(contactForm.email)) {
      errors.push('الرجاء إدخال بريد إلكتروني صحيح لإرسال دعوة الجلسة.');
    }
    
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setTicketId(Math.floor(1000 + Math.random() * 9000));
    setFormErrors([]);
    setIsSubmittingForm(true);
    setSubmittingProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        setSubmittingProgress(100);
        setIsSubmitDone(true);
        setIsSubmittingForm(false);
        clearInterval(interval);
      } else {
        setSubmittingProgress(progress);
      }
    }, 150);
  };

  // Dynamic Pricing Calculator matching the progressive discount requirements
  const getCalculatePricing = (pages: number) => {
    if (pages <= 0) return { total: 0, perPage: 0, discount: 0 };
    if (pages === 20) return { total: 15000, perPage: 750, discount: 65 };
    const K = 15000 / Math.pow(20, 0.65);
    const total = Math.round(K * Math.pow(pages, 0.65));
    const perPage = Math.round(total / pages);
    const baseRate = 2140; // Starting cost for single page
    const discount = Math.max(0, Math.round(100 - (perPage / baseRate) * 100));
    return { total, perPage, discount };
  };

  const pricing = getCalculatePricing(calcPages);

  // Auto changing active visitors simulation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4
        const next = prev + delta;
        return next < 50 ? 55 : next > 350 ? 335 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunSpeedTest = () => {
    if (isSpeedTesting) return;
    setIsSpeedTesting(true);
    setSpeedScore(28);
    let score = 28;
    const interval = setInterval(() => {
      score += 3;
      if (score >= 99) {
        setSpeedScore(99);
        setIsSpeedTesting(false);
        clearInterval(interval);
      } else {
        setSpeedScore(score);
      }
    }, 25);
  };

  const handleToggleLive = () => {
    if (isLive) {
      setIsLive(false);
      setIsAssembling(false);
      setAssembleProgress(0);
    } else {
      setIsAssembling(true);
      setAssembleProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress >= 100) {
          setAssembleProgress(100);
          setIsLive(true);
          setIsAssembling(false);
          clearInterval(interval);
        } else {
          setAssembleProgress(progress);
        }
      }, 35);
    }
  };

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
              Web & Digital Products
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              مواقع تبيع. <br />
              <span className="text-pulse-orange">لا تعرض فقط.</span>
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              مواقع، متاجر إلكترونية، صفحات هبوط، وتجارب رقمية مصممة لتحقيق أهداف عملك التجارية — بسرعة، وضوح، وتحويل قابل للقياس.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => openContactWithMsg('أهلاً فريق جيل الذكاء الاصطناعي، أود طلب تصميم وتطوير موقع إلكتروني جديد ذكي يلائم رغبتنا وأهدافنا التجارية. يرجى التواصل.', 'web-development')}
                className="btn-primary w-full sm:w-auto text-lg px-10 py-4 cursor-pointer"
              >
                اطلب موقعًا جديدًا
              </button>
              <button 
                onClick={() => openContactWithMsg('أهلاً فريق جيل الذكاء الاصطناعي، أود البدء الفوري في تصميم صفحة هبوط ذات معدل تحويل عالي لمنتجنا/خدمتنا الجديدة. يرجى مراجعة الطلب والاستشارة.', 'landing-page')}
                className="btn-secondary w-full sm:w-auto text-lg px-10 py-4 cursor-pointer"
              >
                 اطلب صفحة هبوط
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Web Philosophy Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow">
              موقعك ليس بروشوراً رقمياً
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              الموقع الإلكتروني الناجح هو &quot;أصل تجاري&quot; يعمل لصالحك 24/7. مهمته ليست مجرد الظهور بمظهر جميل، بل أن يشرح قيمتك، يقنع الزائر، يحول الاهتمام إلى فعل، يتتبع سلوك المستخدم، ويتكامل بسلاسة مع منظومتك التسويقية.
            </p>
          </div>
        </div>
      </section>

      {/* 6️⃣ الويب والمنتجات الرقمية (Web & Digital Products Showcase) */}
      {/* Interactive Wireframe Blueprint Section */}
      <section id="interactive-blueprint-section" className="py-24 px-6 border-b border-gray-dark bg-[#080a0f] relative overflow-hidden">
        {/* Futuristic background technical grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111622_1px,transparent_1px),linear-gradient(to_bottom,#111622_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pure-ink/55 to-pure-ink pointer-events-none" />
        
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-pulse-orange/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-sky-500/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 tracking-widest py-1 border border-pulse-orange/25 bg-pulse-orange/5 text-pulse-orange text-[10.5px] font-mono font-bold uppercase rounded-full"
            >
              <Cpu size={12} className="animate-spin text-pulse-orange" style={{ animationDuration: '6s' }} />
              Interactive Wireframe Blueprint
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-black text-snow leading-tight tracking-tight animate-none"
            >
              مطور الهيكل التفاعلي السريع
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-medium text-sm sm:text-base leading-relaxed"
            >
              نحن لا نرسم واجهات صامتة؛ نحن نهندس تجارب حية تتنفس مبيعات. اضغط على مفتاح الطاقة بالأسفل لترى كيف ينطوي المخطط الهندسي الخام (Wireframe) ويرتدي رداء الهوية المفعمة بالألوان والحيوية التفاعلية بلمحة بصر.
            </motion.p>
          </div>

          {/* Interactive Simulator Shell */}
          <div className="bg-[#0e121a] border border-gray-dark/60 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Simulation Header Bar */}
            <div className="bg-[#0a0d14]/90 border-b border-gray-dark/50 px-4 py-3.5 flex items-center justify-between">
              {/* Dots & Title */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 block" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80 block" />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded bg-black/40 border border-white/[0.03] text-[10.5px] font-mono text-gray-medium">
                  <Globe size={11} className="text-gray-medium/60" />
                  <span>agma.agency/digital-wireframe-blueprint</span>
                </div>
              </div>

              {/* Dynamic status */}
              <div className="flex items-center gap-3">
                <div className="font-mono text-[9.5px] text-gray-medium/60 flex items-center gap-1.5">
                  <span className="text-gray-medium/30">|</span>
                  <span>ENGINE_STATE:</span>
                  <motion.span 
                    key={isLive ? 'live' : 'blueprint'}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={isLive ? 'text-emerald-400 font-bold' : 'text-pulse-orange font-bold'}
                  >
                    {isLive ? 'LIVE_PRODUCTION_v1.0' : isAssembling ? 'COMPILING_ASSETS_v1.8' : 'WIRE_FRAME_SCHEMATIC'}
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="p-6 md:p-10 relative bg-gradient-to-b from-[#0e1118] to-[#07090e] min-h-[480px]">
              
              {/* Laser sweep animation on toggle */}
              <AnimatePresence mode="wait">
                {isLive && (
                  <motion.div 
                    key="laser"
                    initial={{ left: '-10%' }}
                    animate={{ left: '110%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute top-0 bottom-0 w-2 bg-gradient-to-r from-transparent via-pulse-orange/80 to-transparent shadow-[0_0_35px_rgba(244,77,43,0.9)] z-30 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Quantum compilation overlay screen */}
              <AnimatePresence>
                {isAssembling && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#07090e]/95 flex flex-col items-center justify-center z-40 p-6 md:p-10"
                  >
                    {/* Tech particle backdrop */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#111622_1px,transparent_1px),linear-gradient(to_bottom,#111622_1px,transparent_1px)] bg-[size:15px_15px] opacity-10 pointer-events-none" />
                    
                    <div className="max-w-md w-full text-center space-y-6 relative z-10">
                      {/* Floating Sparkles and Spinner */}
                      <div className="relative inline-flex items-center justify-center">
                        <div className="absolute inset-x-0 bottom-0 top-0 w-16 h-16 bg-gradient-to-tr from-pulse-orange to-yellow-500 rounded-full animate-ping opacity-25" />
                        <div className="w-16 h-16 rounded-2xl border-2 border-pulse-orange/20 border-t-pulse-orange animate-spin flex items-center justify-center">
                          <Cpu className="text-pulse-orange animate-pulse" size={24} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-snow text-lg font-black tracking-wide font-sans">
                          جاري تجميع الهيكل البرمجي الموحد...
                        </h4>
                        <p className="text-gray-medium text-xs font-mono tracking-widest uppercase">
                          [AGMA_QUANTUM_COMPILER_V1.8]
                        </p>
                      </div>

                      {/* Progress Bar & percentage */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-[11px] font-mono font-bold text-gray-medium">
                          <span className="text-pulse-orange">COMPILE_STATUS: ASSEMBLING</span>
                          <span className="text-snow">{assembleProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/[0.02] border border-white/5 rounded-full overflow-hidden p-[1px]">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-pulse-orange to-yellow-400 rounded-full"
                            style={{ width: `${assembleProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Compiler Scrolling Log */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 h-28 overflow-hidden text-right text-[10px] font-mono text-gray-medium/80 space-y-1.5 scrollbar-none shadow-inner">
                        {assembleProgress >= 5 && <div className="text-emerald-400 font-bold">✓ Detected framework setup (Next.js v15.1.0 + Tailwind v4)</div>}
                        {assembleProgress >= 20 && <div className="text-cyan-400">⚡ Initialized physical motion engine preset [stiffness: 100, damping: 15]</div>}
                        {assembleProgress >= 40 && <div className="text-white">⌬ Synchronized true branding assets (`/favicon AGMA.webp`)</div>}
                        {assembleProgress >= 65 && <div className="text-purple-400">⎎ Injected conversion rate optimized schema matrices</div>}
                        {assembleProgress >= 80 && <div className="text-amber-400">✺ Compiling client-side visual layout layers...</div>}
                        {assembleProgress >= 95 && <div className="text-green-400 font-bold">✓ Production payload assembled successfully! Launching LIVE.</div>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Blueprint Grid Lines (Only visible or emphasized in wireframe mode) */}
              <div className={`absolute inset-0 bg-[#0d1017] transition-opacity duration-700 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(244,77,43,0.02),transparent_70%)] ${!isLive ? 'opacity-100' : 'opacity-20'}`} />

              <div className="relative z-10 space-y-8">
                
                {/* 1. NAV SEGMENT */}
                <motion.div 
                  layout
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-500 relative ${
                    !isLive 
                      ? 'border-dashed border-white/10 bg-[#0a0d14]/40 text-gray-medium/40 shadow-none' 
                      : 'border-white/5 bg-black/40 text-snow shadow-lg shadow-black/45 backdrop-blur-md'
                  }`}
                >
                  {/* Absolute Corner Blueprint coordinates */}
                  {!isLive ? (
                    <span className="absolute top-1 left-2 text-[7.5px] font-mono text-gray-medium/20">COORD_X: 52%</span>
                  ) : (
                    <span className={`absolute top-1 left-2 text-[7.5px] font-mono ${
                      demoColor === 'cyan' ? 'text-cyan-400/80' : demoColor === 'teal' ? 'text-teal-400/80' : 'text-emerald-400/80'
                    }`}>
                      CLIENT_MODE: ACTIVE_PRESET
                    </span>
                  )}

                  {/* Dynamic Authentic Isolated Logo of AGMA with customizable hue mask matching the inside theme color dynamically */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 relative z-10 transition-all duration-500 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-white/[0.03]"
                      style={{
                        border: !isLive ? "1px dashed rgba(255,255,255,0.15)" : `1px solid ${
                          demoColor === 'cyan' ? 'rgba(34,211,238,0.35)' : demoColor === 'teal' ? 'rgba(45,212,191,0.35)' : 'rgba(52,211,153,0.35)'
                        }`
                      }}
                    >
                      <img 
                        src="/favicon AGMA.webp" 
                        alt="AGMA" 
                        className={`w-full h-full object-contain transition-all duration-700 ${!isLive ? 'opacity-30 grayscale brightness-95' : 'opacity-100'}`}
                        style={{
                          filter: isLive 
                            ? demoColor === 'cyan'
                              ? 'hue-rotate(155deg) saturate(2.5) brightness(1.25) drop-shadow(0 0 6px rgba(34,211,238,0.85))'
                              : demoColor === 'teal'
                              ? 'hue-rotate(110deg) saturate(2.2) brightness(1.2) drop-shadow(0 0 6px rgba(45,212,191,0.85))'
                              : 'hue-rotate(65deg) saturate(2.5) brightness(1.2) drop-shadow(0 0 6px rgba(52,211,153,0.85))'
                            : 'none'
                        }}
                      />
                    </div>
                    {!isLive ? (
                      <span className="font-mono text-[9px] tracking-wider text-gray-medium/30">[AGMA_LOGO_ISOLATED]</span>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-[10px] border font-mono px-2 py-0.5 rounded-md ${
                          demoColor === 'cyan' 
                            ? 'bg-cyan-950/40 border-cyan-500/15 text-cyan-300' 
                            : demoColor === 'teal'
                            ? 'bg-teal-950/40 border-teal-500/15 text-teal-300'
                            : 'bg-emerald-950/40 border-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        AGMA_CORE_WEB
                      </motion.div>
                    )}
                  </div>

                  {/* Menu Links */}
                  <div className="hidden md:flex items-center gap-6">
                    {!isLive ? (
                      [1, 2, 3, 4].map((n) => (
                        <div key={n} className="w-16 h-2 rounded bg-white/[0.02] border border-dashed border-white/5" />
                      ))
                    ) : (
                      ['الرئيسية', 'قوة الأداء', 'حاسبة التكلفة', 'المشاريع'].map((link, idx) => (
                        <motion.button 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={idx} 
                          className={`text-xs font-bold transition-colors cursor-pointer bg-transparent border-none ${
                            demoColor === 'cyan' 
                              ? 'text-gray-medium hover:text-cyan-400' 
                              : demoColor === 'teal'
                              ? 'text-gray-medium hover:text-teal-400'
                              : 'text-gray-medium hover:text-emerald-400'
                          }`}
                        >
                          {link}
                        </motion.button>
                      ))
                    )}
                  </div>

                  {/* Nav Action Button */}
                  <div className="w-28 text-center pt-0">
                    {!isLive ? (
                      <div className="h-8 rounded border border-dashed border-white/10 flex items-center justify-center bg-white/[0.02] font-mono text-[9px] text-gray-semibold/20">
                        [BTN_01]
                      </div>
                    ) : (
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openContactWithMsg('أهلاً فريق جيل الذكاء الاصطناعي، أود حجز استشارة فنية عاجلة مع مستشار تقني لمراجعة خيارات وتكلفة مشروعنا الرقمي القادم.', 'consultation')}
                        className={`w-full text-[10px] font-bold py-2 px-3 rounded-lg text-snow shadow-md transition-all text-center cursor-pointer border-none bg-gradient-to-r ${
                          demoColor === 'cyan' 
                            ? 'from-cyan-500 to-sky-500 shadow-cyan-500/15 hover:shadow-cyan-500/25' 
                            : demoColor === 'teal'
                            ? 'from-teal-500 to-cyan-500 shadow-teal-500/15 hover:shadow-teal-500/25'
                            : 'from-emerald-500 to-teal-500 shadow-emerald-500/15 hover:shadow-emerald-500/25'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>حجز استشارة</span>
                          <Sparkles size={11} className="shrink-0" />
                        </span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* 2. HERO CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Hero Main Block */}
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 90, damping: 14 }}
                    className={`lg:col-span-7 border p-6 sm:p-8 rounded-3xl flex flex-col justify-between transition-all duration-500 relative ${
                      !isLive 
                        ? 'border-dashed border-white/10 bg-[#07090f]/60' 
                        : 'border-white/[0.05] bg-black/40 shadow-xl backdrop-blur-md'
                    }`}
                  >
                    {!isLive && (
                      <span className="absolute bottom-1 right-2 text-[7.5px] font-mono text-gray-medium/15">BUFFER: ACTIVE_DRAFT_COORDINATION</span>
                    )}
                    
                    {!isLive ? (
                      <div className="space-y-6 text-right">
                        <div className="space-y-3">
                          <div className="w-24 h-5 rounded border border-dashed border-white/10 bg-white/[0.02]" />
                          <div className="w-full h-8 rounded border border-dashed border-white/10 bg-white/[0.02]" />
                          <div className="w-5/6 h-8 rounded border border-dashed border-white/10 bg-white/[0.02]" />
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="w-full h-3 rounded bg-white/[0.02]" />
                          <div className="w-11/12 h-3 rounded bg-white/[0.02]" />
                          <div className="w-4/5 h-3 rounded bg-white/[0.04]" />
                        </div>
                        <div className="pt-6">
                          <div className="w-40 h-12 rounded border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center font-mono text-xs text-gray-medium/20">
                            [CTA_LAUNCH_PAD]
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 text-right">
                        
                        {/* Interactive Status Badge & Accent Switcher Row */}
                        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 ${
                          demoColor === 'cyan' ? 'border-cyan-500/10' : demoColor === 'teal' ? 'border-teal-500/10' : 'border-emerald-500/10'
                        }`}>
                          <motion.div 
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border text-[10px] font-mono font-bold ${
                              demoColor === 'cyan' 
                                ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400' 
                                : demoColor === 'teal'
                                ? 'bg-teal-950/20 border-teal-500/20 text-teal-400'
                                : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            <Sparkles size={11} className="animate-pulse" />
                            [ AGMA_WEB_STUDIO // QUANTUM_v1.8 ]
                          </motion.div>

                          {/* Personalize Appearance Real-time inside simulated site! */}
                          <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 px-2.5 py-1.5 rounded-xl">
                            <span className="text-[9px] text-gray-semibold font-bold pl-1">الهوية الفنية للمحاكي:</span>
                            {[
                              { id: 'cyan', color: 'bg-cyan-400', label: 'سيان فضائي' },
                              { id: 'teal', color: 'bg-teal-400', label: 'تيال معاصر' },
                              { id: 'emerald', color: 'bg-emerald-400', label: 'زمرد فخم' }
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setDemoColor(item.id as any)}
                                title={item.label}
                                className={`w-3.5 h-3.5 rounded-full ${item.color} cursor-pointer transition-all duration-300 ${
                                  demoColor === item.id ? 'scale-125 ring-2 ring-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'opacity-40 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Title & dynamic presentation of Agency's tagline */}
                        <div className="space-y-3">
                          <motion.h3 
                            key={demoColor}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl sm:text-4xl font-black text-snow leading-tight font-sans"
                          >
                            نصنع واجهات ويب حية فائقة السرعة تكتسح الأسواق
                          </motion.h3>
                          
                          <p className="text-gray-medium text-xs sm:text-sm leading-relaxed">
                            موقعك ليس مجرد بروشور رقمي صامت بل هو أصل تجاري يعمل لصالحك ويقنع عملائك على مدار الساعة. ندمج بين الهندسة الحركية الناعمة وقوة الأداء فئة <strong className={demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'}>Next.js 15 و Tailwind v4</strong> لنمنح زوارك متعة تصفح مطلقة وسرعة استجابة مذهلة.
                          </p>
                        </div>

                        {/* HIGHLY INTERACTIVE PROJECT CALCULATOR SLIDER */}
                        <div className={`p-4 rounded-2xl relative shadow-inner space-y-4 bg-black/60 border ${
                          demoColor === 'cyan' 
                            ? 'border-cyan-500/10 shadow-cyan-950/25' 
                            : demoColor === 'teal' 
                            ? 'border-teal-500/10 shadow-teal-950/25' 
                            : 'border-emerald-500/10 shadow-emerald-950/25'
                        }`}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.03] pb-2.5">
                            <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                              <Layers className={
                                demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                              } size={13} />
                              حاسبة الميزانية الفورية التفاعلية للمشروع
                            </span>
                            <span className="text-[8.5px] font-mono text-gray-medium/55">[REAL_TIME_PRECISE_PRICING]</span>
                          </div>

                          <div className="flex gap-4 justify-between items-center text-xs">
                            <div className="text-right">
                              <span className="text-[10px] text-gray-medium block">عدد صفحات الموقع المطلوب:</span>
                              <strong className={`text-sm font-black font-sans ${
                                demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                              }`}>
                                {calcPages === 20 ? '20+ صفحة (بريميوم/مخصص)' : `${calcPages} صفحات`}
                              </strong>
                            </div>

                            <div className="flex-grow max-w-[160px] relative pt-2">
                              <input 
                                type="range" 
                                min="1" 
                                max="20" 
                                value={calcPages}
                                onChange={(e) => setCalcPages(Number(e.target.value))}
                                className={`w-full h-1.5 rounded-lg appearance-none cursor-ew-resize focus:outline-none bg-white/10 ${
                                  demoColor === 'cyan' ? 'accent-cyan-400' : demoColor === 'teal' ? 'accent-teal-400' : 'accent-emerald-400'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Rich pricing breakout summary */}
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.03] text-[10px] sm:text-[11px]">
                            <div className="text-right space-y-0.5">
                              <span className="text-gray-medium block text-[9.5px]">ميزانية المشروع التقديرية:</span>
                              <strong className={`text-[16px] sm:text-[18px] font-black font-mono tracking-wide block ${
                                demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                              }`}>
                                {pricing.total.toLocaleString('en-US')} ر.س
                              </strong>
                            </div>
                            <div className="text-left space-y-1 flex flex-col items-end justify-center">
                              <span className="text-gray-medium block text-[9.5px]">معدل الصفحة: <span className="font-mono text-white font-bold">{pricing.perPage.toLocaleString('en-US')} ر.س</span></span>
                              {pricing.discount > 0 ? (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black ${
                                  demoColor === 'cyan' ? 'bg-cyan-500/10 text-cyan-300' : demoColor === 'teal' ? 'bg-teal-500/10 text-teal-300' : 'bg-emerald-500/10 text-emerald-300'
                                }`}>
                                  <Sparkles size={10} className="animate-pulse shrink-0" />
                                  <span>وفرت {pricing.discount}%</span>
                                </span>
                              ) : (
                                <span className="inline-block text-gray-semibold/40 text-[8.5px] italic">
                                  تأسيس الهيكل الأساسي للموقع
                                </span>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Live User Ticker Indicator */}
                        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl text-[10px] font-mono text-cyan-300">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className={`w-2 h-2 rounded-full animate-ping inline-block ${
                              demoColor === 'cyan' ? 'bg-cyan-400' : demoColor === 'teal' ? 'bg-teal-400' : 'bg-emerald-400'
                            }`} />
                            <span className="text-snow">{activeUsers}</span> عميل يتتبع خدمات التصميم والبرمجة بالوكالة الآن
                          </span>
                          <span className="text-gray-medium/60 text-[9px]">[LIVE_OBSERVABLE_TRAFFIC]</span>
                        </div>

                        {/* Interactive Action Buttons inside live site */}
                        <div className="pt-2 flex flex-wrap gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openContactWithMsg(`أهلاً فريق جيل الذكاء الاصطناعي، أود إطلاق مشروع موقع ويب مميز مكوّن من ${calcPages} صفحات، بتقدير ميزانية استثمارية بقيمة ${pricing.total.toLocaleString('en-US')} ر.س. يرجى مراجعة الطلب وجدولة استشارة تقنية معنا.`, 'web-development')}
                            className={`text-black text-xs font-black px-6 py-3 rounded-xl shadow-lg cursor-pointer transition-all border-none ${
                              demoColor === 'cyan' ? 'bg-cyan-400 shadow-cyan-500/20' : demoColor === 'teal' ? 'bg-teal-400 shadow-teal-500/20' : 'bg-emerald-400 shadow-emerald-500/20'
                            }`}
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <span>اطلق فكرة مشروعك</span>
                              <Rocket size={12} className="shrink-0" />
                            </span>
                          </motion.button>
                          
                          <motion.button 
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openContactWithMsg('مرحباً فريق جيل الذكاء الاصطناعي، أبحث عن شريك رقمي لتأسيس موقعنا الإلكتروني وترقية المحتوى البرمجي. أرجو التواصل لمناقشة التفاصيل والأسعار.', 'consultation')}
                            className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-snow text-xs py-3 px-5 rounded-xl cursor-pointer"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <span>اتصل بنا</span>
                              <Zap size={12} className="shrink-0 animate-pulse text-amber-400" />
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Right Feature Cards Column */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                    
                    {/* Card Spotlight 1 - Interactive Performance Score Gauge with customizable colors */}
                    <motion.div 
                      layout
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      onClick={isLive ? handleRunSpeedTest : undefined}
                      className={`border p-6 rounded-3xl flex flex-col justify-between h-[225px] transition-all duration-500 relative select-none ${
                        !isLive 
                          ? 'border-dashed border-white/10 bg-[#07090f]/60' 
                          : 'border-white/[0.05] bg-black/40 shadow-xl backdrop-blur-md cursor-pointer hover:border-white/10'
                      }`}
                    >
                      {!isLive && (
                        <span className="absolute top-1 left-2 text-[7.5px] font-mono text-gray-medium/15">METRIC: LATENCY_MS</span>
                      )}

                      {!isLive ? (
                        <div className="space-y-4 text-right flex-grow flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded border border-dashed border-white/10 bg-white/[0.02]" />
                            <div className="w-2/3 h-5 rounded border border-dashed border-white/10 bg-white/[0.02]" />
                          </div>
                          <div className="space-y-1">
                            <div className="w-full h-2 rounded bg-white/[0.02]" />
                            <div className="w-5/6 h-2 rounded bg-white/[0.02]" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-right flex-grow flex flex-col justify-between">
                          <div className="space-y-2 font-sans">
                            <div className="flex justify-between items-start">
                              <span className={`text-[9px] border px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-widest leading-none ${
                                demoColor === 'cyan' 
                                  ? 'bg-cyan-950/60 border-cyan-500/20 text-cyan-300' 
                                  : demoColor === 'teal'
                                  ? 'bg-teal-950/60 border-teal-500/20 text-teal-300'
                                  : 'bg-emerald-950/60 border-emerald-500/20 text-emerald-300'
                              }`}>
                                {isSpeedTesting ? 'RUNNING_DIAGNOSTIC' : 'PASSIVE_DIAGNOSTIC'}
                              </span>
                              <div className={`w-10 h-10 rounded flex items-center justify-center bg-white/5 ${
                                demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                              }`}>
                                <Zap size={20} className={isSpeedTesting ? 'animate-bounce' : 'animate-pulse'} />
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-medium font-mono block font-bold uppercase">SPEED_PERFORMANCE_SCORE</span>
                            <h4 className="text-base sm:text-lg font-black text-snow mb-0.5">سرعة استجابة مبرهنة {speedScore}/100</h4>
                          </div>
                          
                          {/* Speed score track */}
                          <div className="space-y-1.5">
                            <div className={`flex justify-between items-center text-[10px] font-mono font-bold ${
                              demoColor === 'cyan' ? 'text-cyan-300' : demoColor === 'teal' ? 'text-teal-300' : 'text-emerald-300'
                            }`}>
                              <span className="text-[9px] text-gray-medium/60 flex items-center gap-1">
                                <span>انقر هنا لإجراء محاكاة قياس السرعة اللحظي</span>
                                <Zap size={10} className="animate-pulse text-amber-400 shrink-0" />
                              </span>
                              <span>MOBILE {speedScore}%</span>
                            </div>
                            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/5">
                              <motion.div 
                                initial={{ width: "99%" }}
                                animate={{ width: `${speedScore}%` }}
                                transition={{ type: "spring", stiffness: 85, damping: 13 }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  demoColor === 'cyan' 
                                    ? 'from-cyan-600 via-cyan-400 to-indigo-400' 
                                    : demoColor === 'teal'
                                    ? 'from-teal-600 via-teal-400 to-indigo-400'
                                    : 'from-emerald-600 via-emerald-400 to-teal-400'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Card Spotlight 2 - Code Architecture Terminal Block representing tech configs */}
                    <motion.div 
                      layout
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className={`border p-6 rounded-3xl flex flex-col justify-between h-[225px] transition-all duration-500 relative ${
                        !isLive 
                          ? 'border-dashed border-white/10 bg-[#07090f]/60' 
                          : 'border-white/[0.05] bg-black/40 shadow-xl backdrop-blur-md'
                      }`}
                    >
                      {!isLive && (
                        <span className="absolute top-1 left-2 text-[7.5px] font-mono text-gray-medium/15">DAMPING: 15</span>
                      )}

                      {!isLive ? (
                        <div className="space-y-4 text-right flex-grow flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded border border-dashed border-white/10 bg-white/[0.02]" />
                            <div className="w-2/3 h-5 rounded border border-dashed border-white/10 bg-white/[0.02]" />
                          </div>
                          <div className="space-y-1">
                            <div className="w-full h-2 rounded bg-white/[0.02]" />
                            <div className="w-5/6 h-2 rounded bg-white/[0.02]" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-right flex-grow flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9.5px] font-mono text-gray-medium/80 uppercase">agma.config.js</span>
                              <span className={`w-2 h-2 rounded-full ${
                                demoColor === 'cyan' ? 'bg-cyan-400' : demoColor === 'teal' ? 'bg-teal-400' : 'bg-emerald-400'
                              } animate-pulse`} />
                            </div>
                            
                            {/* Visual Terminal Block */}
                            <div className="bg-black/80 font-mono text-[9.5px] p-3 rounded-lg border border-white/5 space-y-1 text-left select-text">
                              <div><span className="text-gray-medium">export const</span> <span className="text-amber-400">agmaBuild</span> = &#123;</div>
                              <div className="pl-3"><span className="text-purple-400">framework</span>: <span className="text-emerald-400">&apos;Next.js 15 App&apos;</span>,</div>
                              <div className="pl-3"><span className="text-purple-400">styling</span>: <span className="text-emerald-400">&apos;Tailwind v4.0&apos;</span>,</div>
                              <div className="pl-3"><span className="text-purple-400">lighthouse</span>: <span className="text-emerald-400">&apos;99/100 Mobile&apos;</span>,</div>
                              <div className="pl-3"><span className="text-purple-400">conversions</span>: <span className="text-emerald-400">&apos;+310% Optimized&apos;</span></div>
                              <div>&#125;;</div>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-medium text-right flex justify-between">
                            <span className="flex items-center gap-1">
                              <Rocket size={11} className="shrink-0 text-cyan-400" />
                              <span>تجميع كود حقيقي محبب للسيو</span>
                            </span>
                            <span className="font-mono text-[9px] opacity-60">[ES_ECMA_6]</span>
                          </div>
                        </div>
                      )}
                    </motion.div>

                  </div>

                </div>

              </div>

            </div>

            {/* Dashboard Control Panel Slider / Energy Grid (with dynamic Space Cyan Power Button) */}
            <div className="bg-[#070a0f] border-t border-pulse-orange/10 p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
              {/* Subtle pulsing background power ring overlay in warm AGMA Orange */}
              <div className="absolute inset-0 bg-pulse-orange/[0.01] bg-[radial-gradient(circle_at_center,rgba(244,77,43,0.04),transparent_70%)] pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center gap-6 z-10">
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-pulse-orange font-mono tracking-wider block uppercase">AGMA_CORE_LAUNCH_MODULE v1.8</span>
                  <p className="text-xs text-gray-medium/80 mt-1 max-w-xs leading-relaxed">
                    انقر على محفز الجيل البرمجي الذكي على اليسار لتقفز من وضع الهيكلية الخطية الصامتة إلى قمة الحيوية الرقمية بالسيان الفضائي الساطع.
                  </p>
                </div>

                {/* Highly optimized original warm Orange branding power control trigger */}
                <motion.button
                  type="button"
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: isLive 
                      ? "0 0 25px rgba(244,77,43,0.4)" 
                      : "0 0 25px rgba(244,77,43,0.5)" 
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleToggleLive}
                  disabled={isAssembling}
                  className={`px-8 py-4 rounded-full font-black text-sm flex items-center gap-3 select-none transition-all duration-500 cursor-pointer text-snow shadow-xl border-none ${
                    isLive 
                      ? 'bg-gradient-to-r from-pulse-orange via-orange-500 to-yellow-500 shadow-pulse-orange/20' 
                      : 'bg-[#121622] border border-pulse-orange/20 shadow-black/80 text-pulse-orange'
                  }`}
                >
                  <Power size={18} className={isLive ? 'text-snow/80' : 'text-pulse-orange animate-pulse'} />
                  <span className="flex items-center gap-1.5">
                    {isLive ? 'العودة للهيكل الأول (المخطط الهيكلي)' : isAssembling ? 'جاري تجميع الهياكل السيانية...' : (
                      <>
                        <span>حوّله إلى تصميم حي الآن</span>
                        <Zap size={13} className="inline animate-bounce shrink-0 text-amber-400" />
                      </>
                    )}
                  </span>
                </motion.button>
              </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 bg-gray-dark/20">
            {webServices.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="geometric-card group bg-pure-ink p-8 lg:p-12 flex flex-col justify-between border-none"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange transition-colors group-hover:bg-pulse-orange group-hover:text-snow">
                    <service.icon size={28} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest font-mono">{service.subtitle}</span>
                    <h3 className="text-2xl lg:text-3xl font-bold text-snow">{service.title}</h3>
                  </div>
                  <p className="text-gray-medium text-lg leading-relaxed font-medium">
                    {service.desc}
                  </p>
                </div>
                <div className="pt-8 mt-8 border-t border-gray-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] text-gray-medium font-bold uppercase tracking-widest mb-1">الاستثمار</span>
                    <span className="text-xl font-bold text-snow">{service.price}</span>
                  </div>
                  <Link href="/contact" className="text-pulse-orange text-sm font-bold flex items-center gap-1 group/link">
                    ابدأ الآن <ChevronLeft size={16} className="group-hover/link:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes a site sell? */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
           <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-snow">ما الذي يجعل الموقع يبيع؟</h2>
              <p className="text-gray-medium mt-4 font-medium">معايير AGMA التي تحول الزائر إلى عميل مخلص.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 max-w-6xl mx-auto">
              {[
                { title: 'رسالة واضحة', desc: 'يفهم الزائر ما تقدمه خلال أول 3 ثوانٍ.', icon: Eye },
                { title: 'CTA ظاهر', desc: 'دعوات واضحة للفعل (Call to Action) في كل مكان صحيح.', icon: MousePointerClick },
                { title: 'سرعة تحميل', desc: 'أداء فائق لا يترك مجالاً لملل الزائر.', icon: Zap },
                { title: 'تجربة موبايل ممتازة', desc: 'تصميم متجاوب يحترم مستخدمي الجوال أولاً.', icon: MonitorSmartphone },
                { title: 'SEO تقني', desc: 'هيكلة صحيحة تفهمها محركات البحث من الدقيقة الأولى.', icon: Search },
                { title: 'Tracking صحيح', desc: 'ربط بكسل وتحليلات دقيقة لقياس كل حركة.', icon: BarChart3 },
                { title: 'صفحات خدمات مقنعة', desc: 'محتوى مكتوب بعناية يركز على الفائدة لا المزايا فقط.', icon: MessageSquare },
                { title: 'تصميم RTL عربي حقيقي', desc: 'محاذاة وتجربة تليق بخصوصية اللغة العربية.', icon: Globe },
                { title: 'ربط مع الحملات', desc: 'تزامن كامل مع استراتيجيتك الإعلانية والقمع البيعي.', icon: Target },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 border border-pulse-orange/20 flex items-center justify-center text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow transition-all">
                    <item.icon size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-snow">{item.title}</h4>
                    <p className="text-gray-medium text-sm leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* What do we build? */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">ماذا نبني؟</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
             {buildStats.map((item, i) => (
               <div key={i} className="geometric-card bg-gray-dark/10 p-8 flex flex-col items-center justify-center gap-4 text-center group">
                  <span className="text-snow font-bold text-sm tracking-tight group-hover:text-pulse-orange transition-colors">{item}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Stages Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">مراحل العمل</h2>
            <p className="text-gray-medium mt-4 font-medium">ننتقل معك من الرؤية إلى الإطلاق عبر مسار منظم ومحكم.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {processStages.map((stage, i) => (
               <div key={i} className="space-y-4 border-r border-gray-dark pr-6">
                  <span className="text-pulse-orange font-mono font-bold text-xs">STEP 0{i+1}</span>
                  <div className="flex items-center gap-3">
                    <stage.icon className="text-gray-medium" size={20} />
                    <h4 className="text-snow font-bold">{stage.title}</h4>
                  </div>
               </div>
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
                إذا كان موقعك لا يحوّل الزائر إلى عميل، <br />
                <span className="text-pulse-orange">فهو لا يقوم بدوره.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نبني موقعًا يخدم المبيعات، الحملات، الثقة، والظهور في محركات البحث.
              </p>
              <button 
                onClick={() => openContactWithMsg('أهلاً فريق جيل الذكاء الاصطناعي، أطلعنا على خدمات تجميع الهياكل والمواقع الذكية ونود طلب مراجعة وبناء موقع إلكتروني ريادي مخصص لأعمالنا.', 'web-development')}
                className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20 cursor-pointer"
              >
                اطلب موقعًا جديدًا
              </button>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services/performance-marketing" className="hover:text-snow">التسويق الأدائي</Link>
                <Link href="/services/seo-content" className="hover:text-snow">المحتوى والسيو</Link>
                <button 
                  onClick={() => openContactWithMsg('أهلاً فريق جيل الذكاء الاصطناعي، نود الاستفسار والتواصل السريع بشأن خدماتكم المتكاملة وتصميم وتطوير المواقع والحلول الرقمية.', 'consultation')}
                  className="hover:text-snow cursor-pointer bg-transparent border-none p-0 text-xs font-bold uppercase tracking-widest"
                >
                  تواصل معنا
                </button>
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
            "serviceType": "Web Design & Development",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "تصميم وتطوير المواقع، المتاجر الإلكترونية، وصفحات الهبوط المصممة للبيع والتحويل.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Web & Digital Services",
              "itemListElement": webServices.map(s => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": s.title,
                  "description": s.desc
                }
              }))
            }
          }),
        }}
      />

      {/* Interactive Contact Modal with Dynamic Budget/Page Sync */}
      <AnimatePresence>
        {isContactOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            {/* Backdrop click close */}
            <div className="absolute inset-0 cursor-default" onClick={() => setIsContactOpen(false)} />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-4xl bg-[#090b11] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 z-10 my-8"
            >
              {/* Top abstract line */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${
                demoColor === 'cyan' ? 'from-cyan-500 to-sky-500' : demoColor === 'teal' ? 'from-teal-500 to-cyan-500' : 'from-emerald-500 to-teal-500'
              }`} />

              {/* Close Button */}
              <button 
                onClick={() => setIsContactOpen(false)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-gray-medium hover:text-snow flex items-center justify-center cursor-pointer transition-colors z-20"
              >
                <X size={16} />
              </button>

              {!isSubmitDone ? (
                <div className="p-6 sm:p-10">
                  <div className="flex items-center gap-3 mb-6 text-right">
                    <div className={`p-2 rounded-xl ${
                      demoColor === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' : demoColor === 'teal' ? 'bg-teal-500/10 text-teal-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <MessageSquare size={22} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-snow">ابدأ نجاحك الرقمي مع AGMA</h3>
                      <p className="text-gray-medium text-xs font-medium">سجل بياناتك ومقترح فكرتك الفنية وسنتصل بك فوراً</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Form column (Span 7) */}
                    <div className="lg:col-span-7 space-y-4">
                      {formErrors.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 space-y-1 text-right">
                          {formErrors.map((err, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 justify-end">
                              <span>{err}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-medium text-xs font-bold mb-1.5 text-right">الاسم الكريم</label>
                          <input 
                            type="text" 
                            name="name"
                            value={contactForm.name}
                            onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="أدخل اسمك الكامل أو اسم شركتك"
                            className="w-full bg-[#11141d]/50 border border-white/10 text-snow text-xs rounded-xl px-4 py-3 text-right focus:outline-none focus:border-cyan-400 focus:bg-white/[0.04] transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-medium text-xs font-bold mb-1.5 text-right">جوال الاتصال (الواتس اب)</label>
                            <input 
                              type="tel" 
                              name="phone"
                              value={contactForm.phone}
                              onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+966 50 000 0000"
                              className="w-full bg-[#11141d]/50 border border-white/10 text-snow text-xs rounded-xl px-4 py-3 text-left focus:outline-none focus:border-cyan-400 focus:bg-white/[0.04] transition-all font-mono"
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-medium text-xs font-bold mb-1.5 text-right">البريد الإلكتروني</label>
                            <input 
                              type="email" 
                              name="email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="name@company.com"
                              className="w-full bg-[#11141d]/50 border border-white/10 text-snow text-xs rounded-xl px-4 py-3 text-left focus:outline-none focus:border-cyan-400 focus:bg-white/[0.04] transition-all font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-medium text-xs font-bold mb-1.5 text-right">نوع الخدمة والمنتج الرقمي</label>
                          <select 
                            value={contactForm.projectType}
                            onChange={(e) => setContactForm(prev => ({ ...prev, projectType: e.target.value }))}
                            className="w-full bg-[#11141d] border border-white/10 text-snow text-xs rounded-xl px-4 py-3 text-right focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                          >
                            <option value="web-development">تصميم وتطوير المواقع المخصصة</option>
                            <option value="landing-page">بناء صفحات الهبوط التسويقية</option>
                            <option value="e-commerce">إعداد متجر إلكتروني متكامل</option>
                            <option value="consultation">استشارة فنية استراتيجية</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-medium text-xs font-bold mb-1.5 text-right">تفاصيل فكرة مشروعك (المقترح الأولي)</label>
                          <textarea 
                            value={contactForm.msg}
                            onChange={(e) => setContactForm(prev => ({ ...prev, msg: e.target.value }))}
                            rows={3}
                            placeholder="اكتب هنا تفاصيل مشروعك أو أي احتياج تود طرحه على مستشار الخدمة..."
                            className="w-full bg-[#11141d]/50 border border-white/10 text-snow text-xs rounded-xl p-4 text-right focus:outline-none focus:border-cyan-400 focus:bg-white/[0.04] transition-all resize-none leading-relaxed text-[11px]"
                          />
                        </div>
                      </div>

                      {/* Submit handle */}
                      <div className="pt-2">
                        {isSubmittingForm ? (
                          <div className="space-y-2 text-right">
                            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-medium/80">
                              <span>
                                {submittingProgress < 40 ? 'تشفير الطلب الكمي...' : submittingProgress < 80 ? 'تسجيل الشراكة في AGMA Cloud...' : 'توصيل برقية الاتصال السحابية...'}
                              </span>
                              <span>{submittingProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/5">
                              <div 
                                className={`h-full rounded-full transition-all duration-100 ${
                                  demoColor === 'cyan' ? 'bg-cyan-500' : demoColor === 'teal' ? 'bg-teal-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${submittingProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button 
                              onClick={handleSubmitContactForm}
                              className={`w-full text-black font-black text-xs py-3.5 px-5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
                                demoColor === 'cyan' ? 'bg-cyan-400 shadow-cyan-500/20 hover:bg-cyan-300' : demoColor === 'teal' ? 'bg-teal-400 shadow-teal-500/20 hover:bg-teal-300' : 'bg-emerald-400 shadow-emerald-500/20 hover:bg-emerald-300'
                              }`}
                            >
                              <span>إرسال فكرة المشروع</span>
                              <Zap size={13} className="shrink-0 text-black fill-black animate-pulse" />
                            </button>

                            <a 
                              href={getWhatsAppUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold text-xs py-3.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-center no-underline"
                            >
                              <span>أرسل عبر واتساب مباشرة</span>
                              <MessageSquare size={13} className="shrink-0 text-emerald-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Price Breakout Info block (Span 5) */}
                    <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 p-6 rounded-2xl text-right space-y-4">
                      <h4 className="text-gray-medium text-xs font-black tracking-tight border-b border-white/5 pb-2.5">
                        ⚙️ الهيكل الاستثماري التقديري
                      </h4>
                      
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-medium/80">عدد الصفحات المحدد:</span>
                          <span className="text-snow font-black font-mono bg-white/5 px-2 py-0.5 rounded text-[11px]">{calcPages} صفحات</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-medium/80">سعر كود السيو الموحد:</span>
                          <span className="text-snow font-bold font-mono">مشمول ومجاني 🚀</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-medium/80">رخص الاستضافة السيرفرية:</span>
                          <span className="text-snow font-bold">مهيأة بالكامل</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-medium/80">معدل التكلفة للصفحة:</span>
                          <span className="text-snow font-bold font-mono">{pricing.perPage.toLocaleString('en-US')} ر.س</span>
                        </div>

                        {pricing.discount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-medium/80">معدل الخصم المتراكم:</span>
                            <span className={`font-mono font-black ${
                              demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                            }`}>
                              وفرت {pricing.discount}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <span className="text-gray-medium text-[9.5px] block mb-1">الميزانية الاستثمارية الكلية:</span>
                        <div className={`text-2xl font-black font-mono tracking-wide ${
                          demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                        }`}>
                          {pricing.total.toLocaleString('en-US')} ر.س
                        </div>
                        <span className="text-gray-semibold/40 text-[9px] block mt-1.5 leading-relaxed">
                          * هذا السعر تقريبي يتم تدقيقه مع المستشار الفني والمصممين في ضوء المتطلبات النهائية وتصميم تجربة المشتري.
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-medium/80 bg-[#07090f] p-3 rounded-xl border border-white/[0.03] flex items-start gap-2.5 leading-relaxed">
                        <Sparkles size={14} className="string-0 text-amber-400 mt-0.5 animate-pulse shrink-0" />
                        <div>
                          <strong className="text-snow block mb-0.5">ضمان الدقة والأداء</strong>
                          بصفتك شريك AGMA، تحصل على تصميم حي للمخطط الهيكلي وشهادة سرعة تفوق 95%+ لجميع محركات البحث العالمية.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* SUCCESS TICKET STATE */
                <div className="p-8 sm:p-14 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center relative ${
                      demoColor === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' : demoColor === 'teal' ? 'bg-teal-500/10 text-teal-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                        demoColor === 'cyan' ? 'bg-cyan-400' : demoColor === 'teal' ? 'bg-teal-400' : 'bg-emerald-400'
                      }`} />
                      <CheckCircle2 size={36} />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xl mx-auto">
                    <h3 className="text-2xl sm:text-3xl font-bold text-snow">أهلاً {contactForm.name}، تم استلام فكرة مشروعك بنجاح!</h3>
                    <p className="text-gray-medium text-xs sm:text-sm font-medium leading-relaxed">
                      لقد قمنا بنقل برقية البيانات وتصنيفها كشراكة رقمية مميزة. تم تعيين معرف مشروع معتمد لمشروعك لمتابعة الاستشارة:
                    </p>
                  </div>

                  {/* Holographic Interactive Receipt Ticket */}
                  <div className="inline-block bg-[#05060b] border border-white/10 rounded-2xl p-6 text-right max-w-md w-full font-mono text-xs space-y-3 relative shadow-2xl overflow-hidden shadow-emerald-500/5">
                    <div className={`absolute top-0 right-0 w-24 h-24 opacity-[0.03] pointer-events-none rounded-full blur-2xl ${
                      demoColor === 'cyan' ? 'bg-cyan-400' : demoColor === 'teal' ? 'bg-teal-400' : 'bg-emerald-400'
                    }`} />
                    
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                      <span className="text-gray-semibold/30">[RESOURCE_TICKET_GEN]</span>
                      <strong className={`font-black tracking-widest ${
                        demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                      }`}>
                        AGMA-WEB-{ticketId}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-medium animate-pulse">العميل الشريك:</span>
                      <span className="text-snow font-bold">{contactForm.name}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-medium">الجوال المسجل:</span>
                      <span className="text-snow font-bold" dir="ltr">{contactForm.phone}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-medium">هيكل الصفحات:</span>
                      <span className="text-snow font-bold">{calcPages} صفحات</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-medium">الميزانية التقديرية:</span>
                      <span className={`font-black ${
                        demoColor === 'cyan' ? 'text-cyan-400' : demoColor === 'teal' ? 'text-teal-400' : 'text-emerald-400'
                      }`}>
                        {pricing.total.toLocaleString('en-US')} ر.س
                      </span>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-1 text-center text-gray-semibold/50 text-[9px] leading-relaxed">
                      سيتصل بك مستشارك الإبداعي من وكالة AGMA خلال أقل من ساعتين لمناقشة التفاصيل وجدولة مكالمة Zoom الافتراضية.
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a 
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 font-black text-xs py-3 px-8 rounded-xl cursor-pointer shadow-md text-center flex items-center gap-2 justify-center w-full sm:w-auto no-underline"
                    >
                      <span>تأكيد واستعجال الجلسة عبر واتساب</span>
                      <MessageSquare size={13} className="text-emerald-400" />
                    </a>

                    <button 
                      onClick={() => setIsContactOpen(false)}
                      className={`text-black font-black text-xs py-3 px-8 rounded-xl cursor-pointer border-none shadow-md w-full sm:w-auto ${
                        demoColor === 'cyan' ? 'bg-cyan-400 hover:bg-cyan-300' : demoColor === 'teal' ? 'bg-teal-400 hover:bg-teal-300' : 'bg-emerald-400 hover:bg-emerald-300'
                      }`}
                    >
                      موافق، العودة للموقع المخطط الهيكلي
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
