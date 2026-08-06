'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target,
  Layers,
  Search, 
  FileText, 
  Sparkles, 
  PenTool, 
  Globe, 
  BarChart, 
  Compass, 
  CheckCircle2, 
  ChevronLeft,
  Cpu,
  MousePointer2,
  Share2,
  Mail,
  Video,
  BookOpen,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    title: 'تدقيق سيو شامل',
    subtitle: 'Technical SEO Audit',
    desc: 'فحص شامل لأداء الموقع، البنية، الصفحات، الروابط، المحتوى، السرعة، والفرص.',
    price: 'من 2,200 إلى 4,800 ر.س مرة واحدة',
    icon: Search,
  },
  {
    title: 'سيو عربي متخصص',
    subtitle: 'Arabic SEO',
    desc: 'تحسين ظهور موقعك في السوق السعودي بكلمات عربية فصحى ولهجية، مبنية على نوايا بحث حقيقية.',
    price: 'يبدأ من 3,000 ر.س شهرياً',
    icon: Globe,
  },
  {
    title: 'إنتاج المحتوى بالـ AI',
    subtitle: 'AI-Accelerated Content Production',
    desc: 'مقالات، صفحات، سكربتات، محتوى سوشال، وانفوجرافيك بسرعة AI وتدقيق بشري يحافظ على الجودة.',
    price: 'يبدأ من 2,200 ر.س شهرياً',
    icon: Cpu,
  },
  {
    title: 'الكتابة الإعلانية',
    subtitle: 'Copywriting',
    desc: 'نصوص صفحات هبوط، إعلانات، إيميلات، ومحتوى موقع مصمم للتحويل لا للقراءة فقط.',
    price: 'من 125 ر.س لكل قطعة',
    icon: PenTool,
  }
];

const contentTypes = [
  { label: 'صفحات خدمات', icon: FileText },
  { label: 'مقالات SEO', icon: BookOpen },
  { label: 'صفحات هبوط', icon: MousePointer2 },
  { label: 'محتوى سوشال', icon: Share2 },
  { label: 'Email Copy', icon: Mail },
  { label: 'سكربتات فيديو', icon: Video },
  { label: 'أدلة معرفية', icon: BookOpen },
  { label: 'FAQ محسنة', icon: HelpCircle },
];

export default function SEOContentClient() {
  const [isOptimized, setIsOptimized] = React.useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = React.useState<boolean>(false);
  const [auditScore, setAuditScore] = React.useState<number>(48);
  const [trafficVolume, setTrafficVolume] = React.useState<number>(1420);
  const [currentStatus, setCurrentStatus] = React.useState<string>("بنية تحتية ضعيفة، ومحتوى غير مأرشف ⛔");
  const [selectedSector, setSelectedSector] = React.useState<number>(0);
  const [activeChecks, setActiveChecks] = React.useState<string[]>([]);

  // Supported business sectors for interactive proof of versatility
  const sectors = [
    {
      name: "🦷 عيادات أسنان",
      searchQuery: "أفضل عيادة أسنان زراعة وتقويم بالرياض",
      clientUrl: "whiteglow-clinic.com",
      results: [
        {
          id: 'competitor-1',
          title: 'مستوصف طبي تقليدي بالرياض - علاج تجميل الأسنان الفوري',
          desc: 'طرق حجز الموعد عبر الهاتف فقط، لا نملك أرشفة متجاوبة للموبايل، والمحتوى مكرر وغير متوافق مع معايير جودة المحتوى من جوجل E-E-A-T...',
          url: 'olddentistry-riyadh.com/services',
          isClient: false,
        },
        {
          id: 'competitor-2',
          title: 'دليل عيادات الأسنان ومستوصفات تجميل الفم العشوائي بجدة والرياض',
          desc: 'قائمة عشوائية غارقة بالإعلانات المنبثقة المزعجة والروابط المعطوبة، ولا يقدم أي إجابة سيمانتية مباشرة تلبي نية المريض الباحث...',
          url: 'riyadhmed-guide.com/dentists',
          isClient: false,
        },
        {
          id: 'client-site',
          title: 'عيادات وايت جلو لطب الأسنان 🦷 | حجز ذكي ومحتوى طبي خبير ومتصدر',
          desc: 'أرشفة لحظية مهيأة، نصوص سيمانتك معتمدة طبياً، سرعة تحميل مذهلة على الموبايل توافق Core Web Vitals، بوابات حجز واتساب سريعة للعملاء...',
          url: 'whiteglow-clinic.com',
          isClient: true,
        }
      ]
    },
    {
      name: "🌴 تمور فاخرة",
      searchQuery: "شراء تمور خلاص وصقعي أصلي شحن سريع بالرياض",
      clientUrl: "goldenpalm-dates.com",
      results: [
        {
          id: 'competitor-1',
          title: 'بقالة محلية للمنتجات البرية والتمور المغلفة بالكرتون',
          desc: 'متجر سلة بتصميم قديم لا يستجيب في الموبايل، غياب تام لخرائط XML والأرشفة التلقائية، وغير مهيأ لمحركات الإجابة بالذكاء الاصطناعي...',
          url: 'localtamr-shop.com/all',
          isClient: false,
        },
        {
          id: 'competitor-2',
          title: 'حراج تمور القصيم والخرج - خلاص فاخر للبيع اليومي بسعر مخفض',
          desc: 'إعلانات عشوائية تفتقر لأرقام الشحن وأدلة سلامة الأغذية، غياب تام للروابط الخلفية القوية وليس لديه صفحات هبوط مخصصة لمقاصد الشراء...',
          url: 'haraj.com/dates-riyadh',
          isClient: false,
        },
        {
          id: 'client-site',
          title: 'مزارع النخلة الذهبية للتمور الفاخرة 🌴 | تسوق فوري موثوق ومؤرشف',
          desc: 'بوابة تسوق سريعة، أرشفة لحظية في جوجل ميرشنت، وصف منتجات غني بالكلمات المفتاحية الطبيعية ومصمم لجذب عملاء الشحنات الضخمة فوراً...',
          url: 'goldenpalm-dates.com',
          isClient: true,
        }
      ]
    },
    {
      name: "🤖 أنظمة ذكاء",
      searchQuery: "أفضل شركة أتمتة وتطبيق أنظمة مبيعات بالذكاء الاصطناعي بالسعودية",
      clientUrl: "agma-flows.com",
      results: [
        {
          id: 'competitor-1',
          title: 'مكتب بيع كمبيوترات ومطور تطبيقات محاسبية قديمة بالبطحاء',
          desc: 'موقع غير متجاوب مهجور منذ عام 2018، غياب الميتاداتا والأرشفة التلقائية، سرعة تصفح بالغة السوء تمنع محركات جوجل من الزحف العادل...',
          url: 'riyadhpc-solutions.net',
          isClient: false,
        },
        {
          id: 'competitor-2',
          title: 'منتديات تعليم البرمجيات ومطورين عرب وكلاسيكيات تقنية مكررة',
          desc: 'منتدى قديم ممتلئ بملفات كوكيز ضارة وإعلانات كاذبة، بدون جودة حقيقية للمحتوى ومصنفة سيئة لدى خوارزميات جوجل وتوصيات الذكاء...',
          url: 'arabtech-forum.org/index',
          isClient: false,
        },
        {
          id: 'client-site',
          title: 'جيل الذكاء الاصطناعي لأنظمة الأتمتة والذكاء الذبذبي 🤖 | جيل الكفاءة الرقمي وسيو متصدر',
          desc: 'مفاعل متطور كلياً للأتمتة وحلول التقنية الفائقة، سيو فني وصياغة محتوى سيمانتك يضمن تربعك على قمة محركات التوصية والبحث فورياً وبذكاء...',
          url: 'agma-flows.com',
          isClient: true,
        }
      ]
    }
  ];

  const currentSectorData = sectors[selectedSector];

  const runSEOOptimization = () => {
    if (isOptimizing) return;
    
    if (isOptimized) {
      setIsOptimized(false);
      setAuditScore(48);
      setTrafficVolume(1420);
      setCurrentStatus("بنية تحتية ضعيفة، ومحتوى غير مأرشف ⛔");
      setActiveChecks([]);
      return;
    }

    setIsOptimizing(true);
    setCurrentStatus("جاري مراجعة الأخطاء الفنية وسرعة النظائر... ⏳");
    setActiveChecks(["🔍 فحص أكواد HTML ومشاكل تجاوب الموبايل..."]);

    // Dynamic audit score & traffic bump animation interval
    let currentScore = 48;
    let currentTraffic = 1420;

    const scoreInterval = setInterval(() => {
      if (currentScore < 99) {
        currentScore += 2;
        setAuditScore(Math.min(currentScore, 99));
      }
    }, 50);

    const trafficInterval = setInterval(() => {
      if (currentTraffic < 6820) {
        currentTraffic += 180;
        setTrafficVolume(Math.min(currentTraffic, 6820));
      }
    }, 45);

    // Progressive checkmarks
    setTimeout(() => {
      setActiveChecks(prev => [...prev, "⚡ تم ضغط الصور وبث أداء Core Web Vitals فائق السلاسة"]);
      setCurrentStatus("جاري معالجة السرعة وتوليد ملفات Sitemap الفورية... 🚀");
    }, 900);

    setTimeout(() => {
      setActiveChecks(prev => [...prev, "✍️ صياغة ونثر نصوص سيمانتك متقدمة بالذكاء الاصطناعي"]);
      setCurrentStatus("جاري تحديث هيكل الكلمات المفتاحية لنية المشتري بالذكاء... 💎");
    }, 1800);

    setTimeout(() => {
      setActiveChecks(prev => [...prev, "🎯 دمج خرائط جوجل وتوطين الروابط المرجعية المحلية"]);
      setCurrentStatus("بناء ملف الأرشفة الفوري لزواحف البحث ومحركات الإجابة... ✨");
    }, 2700);

    // Done Success ascending
    setTimeout(() => {
      clearInterval(scoreInterval);
      clearInterval(trafficInterval);
      setAuditScore(99);
      setTrafficVolume(6820);
      setIsOptimized(true);
      setIsOptimizing(false);
      setCurrentStatus("تم تصدر المركز الأول #1 لقطاع " + currentSectorData.name + " بنجاح وتجاوز المنافسين! 🎉");
      setActiveChecks(prev => [...prev, "🛡️ تم ترقية الأرشفة بالكامل وتصدر المركز الأول #1 بالرياض"]);
    }, 3600);
  };

  const serpOrder = isOptimized 
    ? ['client-site', 'competitor-1', 'competitor-2'] 
    : ['competitor-1', 'competitor-2', 'client-site'];

  const orderedSerps = [...currentSectorData.results].sort((a, b) => {
    return serpOrder.indexOf(a.id) - serpOrder.indexOf(b.id);
  });

  return (
    <main className="min-h-screen relative overflow-hidden bg-pure-ink">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
        <div className="grid-pattern" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Right Column: Copywriting and CTA */}
            <div className="lg:col-span-5 space-y-8 text-right">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5 text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">
                  Live Rank Ascent Simulator
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black mb-6 leading-tight text-snow">
                  نتصدر النتائج. <br />
                  <span className="text-pulse-orange">مو بالحظ.</span>
                </h1>
                <p className="text-gray-medium text-base sm:text-lg lg:text-xl mb-10 leading-relaxed font-medium">
                  سيو عربي متخصص، محتوى يجذب ويحوّل، واستراتيجيات ظهور متكاملة مصممة خصيصاً لتصدر محركات البحث التقليدية والذكية على حد سواء بلمسة ذكاء وأتمتة هندسية.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4 text-center pb-4.5">
                    اطلب تدقيق SEO
                  </Link>
                  <Link href="/contact" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4 text-center pb-4.5">
                    ناقش استراتيجية المحتوى
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Left Column: Interactive Live Rank Ascent Simulator */}
            <div className="lg:col-span-7 w-full relative z-10">
              <div className="bg-gray-dark/15 border border-gray-dark/40 p-4 sm:p-7 rounded-3xl relative backdrop-blur-md overflow-hidden shadow-2xl ring-1 ring-white/5">
                {/* Abstract background glow */}
                <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-pulse-orange/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-10 right-1/4 w-64 h-64 bg-deep-navy/20 rounded-full blur-[80px] pointer-events-none" />
                
                {/* Header widget info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-dark/40">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-pulse-orange animate-pulse" />
                    <h3 className="text-sm font-bold text-snow">مفاعل أرشفة وتصدر النتائج العضوية التفاعلي</h3>
                  </div>
                  <span className="text-[9px] font-mono text-gray-medium border border-gray-dark px-2 py-0.5 rounded bg-gray-dark/20 uppercase tracking-widest self-start sm:self-auto">
                    LIVE RANK ASCENT v2.0
                  </span>
                </div>

                {/* Micro Sector Selector Tab Chips */}
                <div className="flex flex-wrap gap-2 mb-4 justify-end">
                  <span className="text-[10px] text-gray-medium font-bold self-center ml-2">اختر قطاع العمل لرؤية مفعول الأتمتة:</span>
                  {sectors.map((sec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isOptimizing}
                      onClick={() => {
                        setSelectedSector(idx);
                        setIsOptimized(false);
                        setAuditScore(48);
                        setTrafficVolume(1420);
                        setCurrentStatus("بنية تحتية ضعيفة، ومحتوى غير مأرشف ⛔");
                        setActiveChecks([]);
                      }}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold border transition-all duration-300 ${
                        selectedSector === idx
                          ? 'bg-pulse-orange border-pulse-orange text-snow shadow-[0_0_12px_rgba(244,77,43,0.3)]'
                          : 'bg-gray-dark/20 border-gray-dark/40 text-gray-medium hover:text-snow hover:border-gray-dark'
                      } disabled:opacity-40`}
                    >
                      {sec.name}
                    </button>
                  ))}
                </div>

                {/* Google SERP Card Mockup Container */}
                <div className="bg-pure-ink/95 border border-gray-dark/50 rounded-2xl p-4 md:p-5 mb-5 relative">
                  
                  {/* Mock Search Bar with dynamic text reflecting selected sector query */}
                  <div className="flex items-center gap-2.5 bg-gray-dark/20 border border-gray-dark/40 rounded-full px-4 py-2 mb-5">
                    <Search size={15} className="text-pulse-orange animate-pulse" />
                    <span className="text-xs font-bold text-snow select-none truncate">
                      {currentSectorData.searchQuery}
                    </span>
                    <span className="mr-auto w-4.5 h-4.5 rounded-full bg-pulse-orange/10 flex items-center justify-center text-[9px] text-pulse-orange font-bold">✕</span>
                  </div>

                  {/* SEO results with motion dynamic layout */}
                  <div className="space-y-3.5">
                    {orderedSerps.map((serp, i) => {
                      const rank = i + 1;
                      const isTarget = serp.isClient;
                      
                      return (
                        <motion.div
                          layout
                          key={serp.id}
                          transition={{ type: "spring", stiffness: 120, damping: 14 }}
                          className={`p-3.5 rounded-xl border transition-all duration-300 relative text-right flex flex-col gap-1 ${
                            isTarget
                              ? isOptimized
                                ? 'bg-pulse-orange/5 border-pulse-orange shadow-[0_0_20px_rgba(244,77,43,0.18)]'
                                : 'bg-gray-dark/5 border-gray-dark/30 border-dashed opacity-50'
                              : 'bg-gray-dark/15 border-gray-dark/20'
                          }`}
                        >
                          {/* Rank Badge Indicator */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold text-gray-medium/80 uppercase tracking-wider">
                              {serp.url}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {isTarget && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  isOptimized 
                                    ? 'bg-green-500/15 text-green-500 border border-green-500/30' 
                                    : 'bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse'
                                }`}>
                                  {isOptimized ? 'مدرج وموافق لنية محركات الإجابة ✨' : 'بنية ضعيفة وغير مستهدف ⛔'}
                                </span>
                              )}
                              
                              <span className={`text-[11px] font-black leading-none px-2.5 py-1 rounded-md transition-colors duration-500 ${
                                rank === 1 
                                  ? 'bg-pulse-orange text-snow shadow-[0_0_8px_rgba(244,77,43,0.4)]' 
                                  : 'bg-gray-dark/50 text-gray-medium'
                              }`}>
                                المركز #{rank}
                              </span>
                            </div>
                          </div>

                          {/* SERP Title with Glowing Anchor design */}
                          <h4 className={`text-xs md:text-sm font-extrabold leading-snug cursor-pointer transition-colors ${
                            isTarget 
                              ? isOptimized 
                                ? 'text-pulse-orange hover:underline' 
                                : 'text-gray-medium hover:underline' 
                              : 'text-snow hover:underline'
                          }`}>
                            {serp.title}
                          </h4>

                          {/* Snippet Paragraph */}
                          <p className="text-[10.5px] leading-relaxed text-gray-medium font-medium">
                            {serp.desc}
                          </p>

                          {/* Golden Shine overlay effect and Sparkles absolute layout */}
                          {isTarget && isOptimized && (
                            <div className="absolute inset-0 pointer-events-none border border-pulse-orange/40 rounded-xl overflow-hidden">
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-snow/15 to-transparent -translate-x-full"
                                animate={{ translateX: ["100%", "-100%"] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                </div>

                {/* Speedometer Radial Gauge Core Web Vitals Audit & Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-t border-gray-dark/40 pt-5 mb-5">
                  
                  {/* Glowing Radial Semicircle SVG Gauge (Core Web Vitals) */}
                  <div className="md:col-span-5 bg-gray-dark/15 border border-gray-dark/30 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-36">
                    <div className="text-[8.5px] font-bold text-gray-medium uppercase tracking-widest mb-1">صحة الـ Core Web Vitals</div>
                    
                    <div className="relative w-24 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Semicircle Track */}
                        <circle 
                          cx="50" cy="50" r="40" 
                          stroke="rgba(255,255,255,0.06)" 
                          strokeWidth="8.5" 
                          fill="transparent" 
                          strokeDasharray="125 250" 
                          strokeLinecap="round"
                        />
                        {/* Color Filled Semicircle based on dynamic score */}
                        <motion.circle 
                          cx="50" cy="50" r="40" 
                          stroke={auditScore >= 90 ? "#22C55E" : auditScore >= 75 ? "#F44D2B" : "#EF4444"}
                          strokeWidth="8.5" 
                          fill="transparent" 
                          strokeDasharray={`${(auditScore / 100) * 125} 250`} 
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      </svg>
                      {/* Central Digital score */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center flex flex-col">
                        <span className={`text-xl sm:text-2xl font-black font-mono transition-colors ${
                          auditScore >= 90 ? 'text-green-500' : 'text-pulse-orange'
                        }`}>
                          {auditScore}
                        </span>
                        <span className="text-[8px] text-gray-medium font-bold uppercase">ممتاز/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Organic Traffic Meter */}
                  <div className="md:col-span-7 grid grid-cols-2 gap-3 h-full">
                    
                    <div className="bg-gray-dark/15 border border-gray-dark/30 p-3.5 rounded-2xl text-center flex flex-col justify-between">
                      <div className="text-[9px] text-gray-medium font-bold uppercase tracking-wider">زيارات البحث العضوية</div>
                      <div>
                        <div className="text-base sm:text-lg font-black text-pulse-orange font-sans transition-all duration-300">
                          +{trafficVolume.toLocaleString('en-US')}
                          <span className="text-[9px] font-bold text-gray-medium ml-1">زيارة/شهرياً</span>
                        </div>
                        <div className="text-[8px] text-gray-semibold text-green-500 scale-90 mt-1 flex items-center justify-center gap-0.5">
                          <TrendingUp size={9} />
                          <span>توسع تلقائي</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-dark/15 border border-gray-dark/30 p-3.5 rounded-2xl text-center flex flex-col justify-between">
                      <div className="text-[9px] text-gray-medium font-bold uppercase tracking-wider">الحالة الحالية للأرشفة</div>
                      <div className="text-[10px] font-bold text-snow leading-relaxed">
                        {currentStatus}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Custom Process Scanner Steps Terminal Logs */}
                {activeChecks.length > 0 && (
                  <div className="bg-pure-ink border border-gray-dark/40 rounded-2xl p-4 mb-4 text-right space-y-1.5 font-mono text-[10.5px]">
                    <div className="text-[8.5px] text-gray-medium uppercase tracking-widest pb-1 border-b border-gray-dark/40 mb-2">خطوات هندسة وعمليات السيو النشطة (AI SEO Tasks)</div>
                    {activeChecks.map((check, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-start gap-2 text-gray-light"
                      >
                        <span className="text-green-500 font-bold">✓</span>
                        <span className="font-semibold">{check}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Run SEO Interactive Button */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={runSEOOptimization}
                    disabled={isOptimizing}
                    className={`w-full py-4 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                      isOptimized 
                        ? 'bg-green-500 text-snow hover:bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.35)] hover:shadow-[0_0_25px_rgba(34,197,94,0.45)]'
                        : 'btn-primary text-snow'
                    }`}
                  >
                    <span>
                      {isOptimizing 
                        ? 'جاري فحص وتطبيق ممارسات السيو... ⚡' 
                        : isOptimized 
                          ? 'إعادة تشغيل محاكاة التصدر 🔄' 
                          : `حسّن قطاع ${currentSectorData.name} وتصدر النتائج حياً 🚀`
                      }
                    </span>
                    <Sparkles size={16} className={isOptimizing ? 'animate-spin' : ''} />
                  </button>
                  <p className="text-[9.5px] text-center text-gray-medium/70 italic mt-1">
                    📱 انقر على أياً من الأزرار العلوية لتغيير القطاع، ثم اضغط زر التحسين لمشاهدة صعود بطاقتك بنعومة للمركز الأول
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why Arabic SEO is different */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-snow leading-tight">
                لماذا السيو العربي <span className="text-pulse-orange">مختلف؟</span>
              </h2>
              <div className="space-y-6 text-gray-medium text-lg leading-relaxed font-medium">
                <p>
                  السيو العربي ليس مجرد ترجمة آليه للكلمات المفتاحية من الإنجليزية. هو فهم عميق لنوايا البحث (Search Intent)، الثقافة المحلية، اللهجة الدارجة، وسلوك المستخدم السعودي والخليجي أثناء رحلة البحث.
                </p>
                <p>
                  نحن نفرق بدقة بين البحث المعلوماتي (&quot;كيف أبدأ...&quot;) والبحث التجاري (&quot;أفضل وكالة في الرياض&quot;)، لنبني استراتيجية محتوى تضعك في المكان المناسب واللحظة المناسبة.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-snow font-bold">
                  <CheckCircle2 className="text-pulse-orange" size={20} />
                  <span>فهم نية البحث المحلية</span>
                </div>
                <div className="flex items-center gap-3 text-snow font-bold">
                  <CheckCircle2 className="text-pulse-orange" size={20} />
                  <span>التعامل مع اللهجات العربية</span>
                </div>
                <div className="flex items-center gap-3 text-snow font-bold">
                  <CheckCircle2 className="text-pulse-orange" size={20} />
                  <span>السوق السعودي (KSA Focus)</span>
                </div>
                <div className="flex items-center gap-3 text-snow font-bold">
                  <CheckCircle2 className="text-pulse-orange" size={20} />
                  <span>التحويل لا الزيارات فقط</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gray-dark/20 border border-gray-dark flex items-center justify-center p-12">
                 <div className="grid-pattern opacity-[0.05]" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-3/4 h-3/4 border border-pulse-orange/10 rounded-full animate-spin-slow" />
                 </div>
                 <Globe className="text-pulse-orange w-32 h-32 opacity-20" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-snow font-bold text-lg">اللغة العربية</span>
                    <span className="text-[10px] text-gray-medium font-mono uppercase tracking-widest">Natural Language Processing</span>
                 </div>
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

          <div className="space-y-1">
            {services.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="geometric-card group bg-gray-dark/10 p-8 lg:p-12 flex flex-col lg:flex-row gap-8 items-start lg:items-center"
              >
                <div className="w-16 h-16 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange transition-colors group-hover:bg-pulse-orange group-hover:text-snow">
                  <service.icon size={32} />
                </div>
                <div className="flex-grow space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest font-mono">{service.subtitle}</span>
                    <h3 className="text-2xl lg:text-3xl font-bold text-snow">{service.title}</h3>
                  </div>
                  <p className="text-gray-medium text-lg leading-relaxed font-medium max-w-2xl">
                    {service.desc}
                  </p>
                </div>
                <div className="w-full lg:w-max flex flex-col items-start lg:items-end gap-2 pr-0 lg:pr-8 border-r-0 lg:border-r border-gray-dark">
                  <span className="text-[10px] text-gray-medium font-bold uppercase tracking-widest">تكلفة البداية</span>
                  <span className="text-xl font-bold text-snow">{service.price}</span>
                  <Link href="/contact" className="text-pulse-orange text-sm font-bold flex items-center gap-1 group/link mt-2">
                    ابدأ الآن <ChevronLeft size={16} className="group-hover/link:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Google + AI Search */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-6xl font-bold text-snow">
              Google <span className="text-pulse-orange">+</span> AI Search
            </h2>
            <p className="text-gray-medium text-xl leading-relaxed font-medium">
              الظهور لم يعد مقتصراً على نتائج Google التقليدية. نحن نعد علامتك لجيل محركات الإجابة الجديد.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-8">
              {['Google', 'ChatGPT', 'Gemini', 'Perplexity', 'AI Overviews'].map((platform) => (
                <div key={platform} className="geometric-card bg-gray-dark/5 p-6 flex flex-col items-center justify-center gap-3 group">
                  <Sparkles className="text-pulse-orange transition-transform group-hover:rotate-12" size={24} />
                  <span className="text-snow font-bold text-sm tracking-tight">{platform}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-medium text-lg leading-relaxed font-medium max-w-2xl mx-auto">
              نحن نساعد علامتك على بناء بنية تحتية للمحتوى (Semantic Content) يفهمها الذكاء الاصطناعي ويثق بها، لتكون مصدر الإجابة الأول لعملائك عبر كل المنصات.
            </p>
          </div>
        </div>
      </section>

      {/* Strategy Steps Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">كيف نبني استراتيجية المحتوى؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'تدقيق الموقع', icon: Search },
              { title: 'بحث الكلمات', icon: Compass },
              { title: 'تحليل المنافسين', icon: TrendingUp },
              { title: 'تحديد النوايا', icon: Target },
              { title: 'بناء الـ Content Map', icon: Layers },
              { title: 'إنتاج المحتوى', icon: Cpu },
              { title: 'تحسين الصفحات', icon: MousePointer2 },
              { title: 'قياس النتائج', icon: BarChart },
            ].map((step, i) => (
              <div key={i} className="geometric-card bg-gray-dark/5 p-8 flex flex-col items-start gap-4 group">
                <div className="text-[10px] text-gray-medium font-mono font-bold tracking-widest uppercase mb-2">Phase 0{i+1}</div>
                <div className="w-10 h-10 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange transition-transform group-hover:scale-110">
                   <step.icon size={20} />
                </div>
                <h4 className="text-snow font-bold text-base leading-tight">{step.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">أنواع المحتوى الذي نصنعه</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {contentTypes.map((type, i) => (
              <div key={i} className="geometric-card bg-gray-dark/10 p-8 flex flex-col items-center justify-center gap-4 text-center">
                <type.icon className="text-pulse-orange" size={24} />
                <span className="text-snow font-bold text-sm">{type.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-snow leading-tight">
                اجعل علامتك تظهر عندما يبحث العميل، <br />
                <span className="text-pulse-orange">لا بعد أن يختار المنافس.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                ابدأ بتدقيق SEO عميق يكشف أين تقف علامتك اليوم، وما الذي يمنعك من التقدم نحو الصدارة.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                اطلب تدقيق SEO الآن
              </Link>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services/performance-marketing" className="hover:text-snow">التسويق الأدائي</Link>
                <Link href="/services/ai-automation" className="hover:text-snow">الأتمتة والذكاء</Link>
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
            "serviceType": "SEO & Content Strategy",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "سيو عربي متخصص ونظام إنتاج محتوى مدعوم بالذكاء الاصطناعي يستهدف السوق السعودي والخليجي.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "SEO & Content Services",
              "itemListElement": services.map(s => ({
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
