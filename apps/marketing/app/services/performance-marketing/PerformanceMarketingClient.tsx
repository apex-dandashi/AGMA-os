'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Target, 
  BarChart3, 
  TrendingUp, 
  MousePointerClick, 
  Search, 
  Layers, 
  Activity, 
  AlertCircle, 
  ChevronLeft,
  Users,
  Megaphone,
  Zap,
  Globe
} from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    title: 'إعلانات السوشال المدفوعة',
    subtitle: 'Paid Social Ads',
    platforms: 'Meta, TikTok, X, Snapchat',
    desc: 'حملات مدفوعة على المنصات الاجتماعية، باستهداف دقيق، إبداع متجدد، واختبارات مستمرة.',
    price: 'يبدأ من 2,500 ر.س شهرياً',
    icon: Megaphone,
  },
  {
    title: 'إعلانات جوجل',
    subtitle: 'Google Ads',
    platforms: 'Search, Display, YouTube',
    desc: 'حملات بحث وظهور ويوتيوب، مبنية على نية العميل، الكلمات المفتاحية، وتحسين تكلفة الحصول على العميل.',
    price: 'يبدأ من 2,500 ر.س شهرياً',
    icon: Search,
  },
  {
    title: 'الإعلانات البرمجية',
    subtitle: 'Programmatic Advertising',
    platforms: 'Display, Video, DSP',
    desc: 'شراء إعلاني آلي عبر منصات DSP، للحملات الكبرى التي تحتاج وصولاً واسعاً واستهدافاً دقيقاً.',
    price: 'عرض مخصص',
    icon: Layers,
  },
  {
    title: 'تحسين معدل التحويل',
    subtitle: 'CRO',
    platforms: 'LPs, A/B Testing',
    desc: 'تحليل سلوك المستخدم، اختبارات A/B، تحسين صفحات الهبوط، ورفع التحويل دون زيادة الميزانية.',
    price: 'يبدأ من 3,800 ر.س لكل Engagement',
    icon: MousePointerClick,
  }
];

const managementSteps = [
  'تحليل الجمهور',
  'بناء الرسائل',
  'تجهيز الإبداع الإعلاني',
  'إعداد التتبع',
  'إطلاق الحملات',
  'اختبار A/B',
  'تحسين مستمر',
  'تقرير واضح'
];

const metrics = [
  { label: 'CTR', icon: MousePointerClick },
  { label: 'CPC', icon: Activity },
  { label: 'CPA', icon: Target },
  { label: 'ROAS', icon: TrendingUp },
  { label: 'Conversion Rate', icon: Zap },
  { label: 'Leads Quality', icon: Users },
  { label: 'Cost per Lead', icon: BarChart3 },
  { label: 'LP Performance', icon: Globe },
];

const failureReasons = [
  { title: 'صفحة هبوط ضعيفة', desc: 'مهما كان الإعلان ناجحاً، الصفحة غير المهيأة تفشل في تحويل الزائر إلى عميل.' },
  { title: 'رسالة غير واضحة', desc: 'الغموض في العرض أو عدم وضوح القيمة المضافة يقتل الاهتمام في ثوانٍ.' },
  { title: 'استهداف واسع', desc: 'محاولة الوصول للجميع تعني الوصول لغير المهتمين وهدر الميزانية.' },
  { title: 'عدم وجود تتبع', desc: 'بدون بكسل وتتبع دقيق، أنت تقود سيارتك في الظلام دون عدادات.' },
  { title: 'عدم اختبار كافٍ', desc: 'الاعتماد على إبداع إعلاني واحد دون اختبار البدائل (A/B) يحد من النتائج.' },
  { title: 'تصميم جميل لكنه لا يبيع', desc: 'الجمالية مطلوبة، لكن الوضوح والطلب المباشر (CTA) هما ما يحققان الأرقام.' },
];

export default function PerformanceMarketingClient() {
  const [budget, setBudget] = React.useState<number>(15000);

  // Dynamic calculations for ROI/ROAS
  // ROAS increases slightly with a larger optimized budget (representing AGMA's scale efficiencies)
  const roas = Number((3.2 + ((budget - 5000) / 95000) * 1.8).toFixed(1));
  // Cost Per Lead decreases from 45 SAR to 28 SAR as the budget scales and optimization kicks in
  const cpl = Number((45 - ((budget - 5000) / 95000) * 17).toFixed(0));
  const leads = Math.round(budget / cpl);
  const revenue = Math.round(budget * roas);

  // Traditional market benchmark metrics (Standard average ROAS is ~2.1)
  const marketRoas = 2.1;
  const marketRevenue = Math.round(budget * marketRoas);
  const revenueGainPercent = Math.round(((revenue - marketRevenue) / marketRevenue) * 100);
  
  const formattedMarketRev = marketRevenue >= 1000000 
    ? `${(marketRevenue / 1000000).toFixed(1)}M` 
    : `${Math.round(marketRevenue).toLocaleString('en-US')}`;

  // Dynamic Budget Channel Multi-weight distribution
  const getChannelWeights = () => {
    if (budget < 20000) {
      return [
        { name: 'جوجل (فئة بحث شرائية عالية النية)', pct: 65, color: 'bg-pulse-orange' },
        { name: 'تيك توك وإنستا (توعية وبناء طلب)', pct: 35, color: 'bg-snow' }
      ];
    } else if (budget < 55000) {
      return [
        { name: 'إعلانات جوجل وسيرش ذكي', pct: 45, color: 'bg-pulse-orange' },
        { name: 'حملات ميتا وسناب شات متكاملة', pct: 35, color: 'bg-snow' },
        { name: 'إعادة الاستهداف وتحسين التحويل (CRO)', pct: 20, color: 'bg-gray-medium' }
      ];
    } else {
      return [
        { name: 'قنوات جوجل وجاذبية PMax الكبرى', pct: 35, color: 'bg-pulse-orange' },
        { name: 'إعلانات ميتا وتيك توك (توسع واستحواذ)', pct: 40, color: 'bg-snow' },
        { name: 'تخصيص DSP وإعلانات برمجية ذكية بنصف قطر واسع', pct: 25, color: 'bg-gray-medium' }
      ];
    }
  };

  // Generate SVG curve points based on budget (curving upward)
  const getCurvePath = () => {
    const scale = (budget - 5000) / 95000; // 0 to 1
    const endY = 150 - scale * 100; // Peak scales from 150 down to 50
    const ctrlY = 170 - scale * 75;
    return `M 20 180 Q 150 ${ctrlY} 380 ${endY}`;
  };

  // Static / traditional market benchmark curve
  const getMarketCurvePath = () => {
    const scale = (budget - 5000) / 95000; // 0 to 1
    const endY = 170 - scale * 50; // Performance climbs slower
    const ctrlY = 175 - scale * 35;
    return `M 20 180 Q 150 ${ctrlY} 380 ${endY}`;
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-pure-ink">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
        <div className="grid-pattern" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Right Column: Copywriting and CTA */}
            <div className="lg:col-span-6 space-y-8 text-right order-last lg:order-first">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5 text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">
                  Live Growth & ROI Simulator
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black mb-6 leading-tight text-snow">
                  نقيس كل نقرة. <br />
                  <span className="text-pulse-orange">ونرفع عائد كل ريال.</span>
                </h1>
                <p className="text-gray-medium text-base sm:text-lg lg:text-xl mb-10 leading-relaxed font-medium">
                  حملات مدفوعة، استهداف ذكي يعتمد على البيانات، وتحسين مستمر لمعدلات التحويل — نمو فوري مبني بالكامل على الأرقام الحقيقية، لا على التخمين.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4 text-center pb-4.5">
                    ابدأ حملة مدفوعة
                  </Link>
                  <Link href="/contact" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4 text-center pb-4.5">
                    اطلب تحليل حسابك الإعلاني
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Left Column: Interactive Live Growth & ROI Slider */}
            <div className="lg:col-span-6 w-full relative z-10">
              <div className="bg-gray-dark/15 border border-gray-dark/40 p-5 sm:p-8 rounded-3xl relative backdrop-blur-md overflow-hidden shadow-2xl ring-1 ring-white/5">
                {/* Abstract background glow */}
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-pulse-orange/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-10 left-1/4 w-64 h-64 bg-deep-navy/20 rounded-full blur-[80px] pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-dark/40">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-pulse-orange animate-pulse" />
                    <h3 className="text-sm font-bold text-snow">مقياس الميزانية ونمو الأرباح الافتراضي</h3>
                  </div>
                  <span className="text-[9px] font-mono text-gray-medium border border-gray-dark px-2 py-0.5 rounded bg-gray-dark/20 uppercase tracking-wider">
                    ROI ENGINE v2.0
                  </span>
                </div>

                {/* SVG Live Curves (PC, Mobile, Tablet Responsive) */}
                <div className="relative h-56 w-full bg-pure-ink/40 border border-gray-dark/40 rounded-2xl overflow-hidden mb-6 py-4">
                  {/* Grid Lines in background of SVG */}
                  <div className="absolute inset-0 grid-pattern opacity-[0.03] pointer-events-none" />
                  
                  {/* Glowing Vertical/Horizontal Axes Labels */}
                  <div className="absolute top-3 left-3 flex flex-col items-start font-mono text-[8.5px] sm:text-[9.5px] text-gray-medium/50 select-none">
                    <span className="hidden sm:inline">Y_AXIS (العائد بالريال)</span>
                    <span className="text-green-500/80 font-sans font-bold leading-tight">نمو: +{revenueGainPercent}%</span>
                  </div>
                  <div className="absolute bottom-2 right-3 font-mono text-[8px] text-gray-medium/40 select-none hidden sm:block">
                    X_AXIS (الميزانية التسويقية)
                  </div>

                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <defs>
                      {/* Shadow gradient path under our curve */}
                      <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F44D2B" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#F44D2B" stopOpacity="0" />
                      </linearGradient>
                      {/* Grid pattern lines */}
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                      </pattern>
                    </defs>

                    {/* Chart Background Grid */}
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Traditional Market Curve (Benchmark) */}
                    <path 
                      d={getMarketCurvePath()} 
                      fill="none" 
                      className="stroke-gray-medium/20 transition-all duration-500" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                    />

                    {/* Shaded Area under Curve */}
                    <path 
                      d={`${getCurvePath()} L 380 185 L 20 185 Z`} 
                      fill="url(#area-gradient)" 
                      className="transition-all duration-300"
                    />

                    {/* Curve representing dynamic scaling */}
                    <path 
                      d={getCurvePath()} 
                      fill="none" 
                      className="stroke-pulse-orange transition-all duration-500 animate-pulse-slow" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />

                    {/* Running pulse dot along traditional curve end */}
                    <circle 
                      cx="380" 
                      cy={170 - ((budget - 5000) / 95000) * 50} 
                      r="4" 
                      className="fill-gray-medium/40 transition-all duration-500" 
                    />

                    {/* Running pulse dot along our curve end */}
                    <circle 
                      cx="380" 
                      cy={150 - ((budget - 5000) / 95000) * 100} 
                      r="6.5" 
                      className="fill-pulse-orange outline outline-4 outline-pulse-orange/20 animate-pulse transition-all duration-500" 
                    />
                  </svg>

                  {/* Dynamic live badge inside the chart */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className="bg-pulse-orange/10 border border-pulse-orange/30 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg backdrop-blur-sm text-[9px] sm:text-[10px] font-bold text-pulse-orange uppercase tracking-wider">
                      {roas}x ROAS 🚀
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-gray-medium/70 font-bold bg-gray-dark/20 border border-gray-dark/50 px-1.5 py-0.5 rounded">
                      السوق: 2.1x ⛔
                    </span>
                  </div>
                </div>

                {/* Slider and Interactive Scale Values */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-right gap-2">
                    <span className="text-[11px] sm:text-xs font-bold text-gray-medium">الميزانية التسويقية الشهرية</span>
                    <span className="text-xl sm:text-2xl font-black text-snow flex items-center gap-1 shrink-0">
                      <span dir="ltr" className="font-sans text-pulse-orange">
                        {budget.toLocaleString('en-US')}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-gray-medium">ر.س</span>
                    </span>
                  </div>

                  {/* Custom Styled Slider Container */}
                  <div className="relative group/slider pt-2">
                    <input 
                      type="range"
                      min="5000"
                      max="100000"
                      step="5000"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full h-2.5 bg-gray-dark/60 rounded-lg appearance-none cursor-pointer focus:outline-none accent-pulse-orange transition-all duration-300"
                    />
                    <div className="flex justify-between text-[10px] font-semibold text-gray-medium/50 select-none pt-2">
                      <span>100,000 ر.س</span>
                      <span>50,000 ر.س</span>
                      <span>5,000 ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Smart Media Allocation Recommendation Pill Bars */}
                <div className="bg-pure-ink/50 border border-gray-dark/40 rounded-2xl p-4 mb-6 text-right space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] sm:text-[10px] font-bold text-pulse-orange uppercase tracking-wider">توزيع الميزانية الذكي (AI Mix)</span>
                    <span className="text-[8px] font-mono text-gray-medium shrink-0">فئة {(budget / 1000).toFixed(0)}K</span>
                  </div>
                  
                  <div className="space-y-2">
                    {getChannelWeights().map((ch, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-start justify-between gap-2 text-[9.5px] sm:text-[10px] font-bold">
                          <span className="text-gray-medium leading-relaxed">{ch.name}</span>
                          <span className="text-snow font-mono shrink-0">{ch.pct}%</span>
                        </div>
                        <div className="w-full bg-gray-dark/30 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${ch.pct}%` }}
                            transition={{ duration: 0.4 }}
                            className={`${ch.color} h-full rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5 border-t border-gray-dark/40 pt-6">
                  
                  <div className="bg-gray-dark/15 p-3 rounded-xl border border-gray-dark/30 text-center flex flex-col justify-between min-h-[90px]">
                    <div className="text-[9px] sm:text-[10px] text-gray-medium font-bold uppercase tracking-wider mb-2">تكلفة العميل (CPL)</div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-snow flex items-center justify-center gap-0.5">
                        <span className="font-sans text-pulse-orange">{cpl}</span>
                        <span className="text-[10px] text-gray-medium">ر.س</span>
                      </div>
                      <div className="text-[8px] sm:text-[9.5px] text-gray-medium/80 mt-1 leading-normal">توفير ذكي ملحوظ</div>
                    </div>
                  </div>

                  <div className="bg-gray-dark/15 p-3 rounded-xl border border-gray-dark/30 text-center flex flex-col justify-between min-h-[90px]">
                    <div className="text-[9px] sm:text-[10px] text-gray-medium font-bold uppercase tracking-wider mb-2 font-mono">العملاء المتوقعين</div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-snow transition-all duration-300">
                        <span className="font-sans text-pulse-orange">+{leads.toLocaleString('en-US')}</span>
                      </div>
                      <div className="text-[8px] sm:text-[9.5px] text-green-500 font-medium mt-1 leading-normal">عملاء مهتمين موثوقين</div>
                    </div>
                  </div>

                  <div className="bg-gray-dark/15 p-3 rounded-xl border border-gray-dark/30 text-center flex flex-col justify-between min-h-[90px]">
                    <div className="text-[9px] sm:text-[10px] text-gray-medium font-bold uppercase tracking-wider mb-2">العائد المتوقع</div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-snow transition-all duration-300">
                        <span className="font-sans text-green-500">
                          {revenue >= 1000000 
                            ? `${(revenue/1000000).toFixed(1)}M` 
                            : `+${Math.round(revenue).toLocaleString('en-US')}`
                          }
                        </span>
                      </div>
                      <div className="text-[8px] sm:text-[9.5px] text-gray-medium/80 mt-1 leading-normal text-snow/90">
                        السوق: {formattedMarketRev} ر.س
                      </div>
                    </div>
                  </div>

                </div>

                {/* Micro interaction feedback text */}
                <div className="mt-6 text-center">
                  <p className="text-[10px] text-gray-medium italic">
                    📱 اسحب شريط الميزانية يميناً ويساراً لمشاهدة صعود منحنيات الأرباح والعملاء بدقة فائقة
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow">
              فلسفتنا في الأداء
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              في AGMA، نؤمن بأن الإعلان ليس مجرد إطلاق ميزانية، بل هو منظومة دفع تبدأ من صياغة الرسالة المناسبة للجمهور الصحيح، وتوجيههم لصفحة هبوط جاهزة للتحويل، ثم إخضاع كل ذلك لعمليات قياس وتحسين لا تتوقف. نحن لا نصرف المال، نحن نستثمره لتحقيق عائد.
            </p>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">الخدمات الأساسية</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            {services.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="geometric-card group bg-gray-dark/10 p-8 lg:p-12 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange transition-colors group-hover:bg-pulse-orange group-hover:text-snow">
                    {React.createElement(service.icon, { size: 28 })}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                         <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest font-mono">{service.subtitle}</span>
                         <span className="text-[9px] text-gray-medium font-bold uppercase tracking-widest border border-gray-dark px-2 rounded-full">{service.platforms}</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-snow">{service.title}</h3>
                  </div>
                  <p className="text-gray-medium text-lg leading-relaxed font-medium">
                    {service.desc}
                  </p>
                </div>
                <div className="pt-8 mt-8 border-t border-gray-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] text-gray-medium font-bold uppercase tracking-widest mb-1">إدارة الحملات</span>
                    <span className="text-xl font-bold text-snow">{service.price}</span>
                  </div>
                  <Link href="/contact" className="btn-primary py-3 px-6 text-sm">
                    ابدأ الآن
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">ما الذي نقيسه؟</h2>
            <p className="text-gray-medium max-w-2xl mx-auto font-medium mt-4">نحن مهووسون بالأرقام. إليك أهم المؤشرات التي نتابعها لحظياً لضمان نجاح حملتك.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {metrics.map((metric, i) => (
              <div key={i} className="geometric-card bg-gray-dark/5 p-8 text-center space-y-4 group">
                <metric.icon className="text-pulse-orange mx-auto transition-transform group-hover:scale-110" size={24} />
                <h4 className="text-snow font-bold text-sm tracking-tight">{metric.label}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Manage Campaigns Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-snow leading-tight">
                كيف ندير الحملة؟ <br />
                <span className="text-pulse-orange">من الاستهداف إلى التقرير.</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {managementSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-dark bg-gray-dark/5">
                    <span className="text-pulse-orange font-mono font-bold text-lg">0{i+1}</span>
                    <span className="text-snow font-bold text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
                <div className="aspect-square bg-gray-dark/20 border border-gray-dark relative flex items-center justify-center p-12">
                   <div className="grid-pattern opacity-[0.05]" />
                   <div className="w-full h-full border border-pulse-orange/20 rounded-full flex items-center justify-center animate-spin-slow">
                      <div className="w-1/2 h-1/2 border border-pulse-orange/40 rounded-full animate-reverse-spin" />
                   </div>
                   <Target className="absolute text-pulse-orange w-24 h-24 drop-shadow-[0_0_15px_rgba(255,102,0,0.3)]" />
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Failure Reasons Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">لماذا تفشل الحملات أحياناً؟</h2>
            <p className="text-gray-medium max-w-2xl mx-auto font-medium mt-4 text-lg">نحن نصحح المسار قبل الوقوع في الفخ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {failureReasons.map((reason, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-500" size={20} />
                  <h3 className="text-xl font-bold text-snow">{reason.title}</h3>
                </div>
                <p className="text-gray-medium text-sm leading-relaxed font-medium">
                  {reason.desc}
                </p>
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
                لا تبدأ بإعلان. <br />
                <span className="text-pulse-orange">ابدأ بنظام أداء.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نراجع هدفك، جمهورك، قنواتك، وصفحة التحويل قبل صرف أي ميزانية لضمان أفضل عائد ممكن.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                اطلب تحليل حملة مجاناً
              </Link>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services/web-digital" className="hover:text-snow">المواقع والمنتجات</Link>
                <Link href="/services/seo-content" className="hover:text-snow">السيو والمحتوى</Link>
                <Link href="/pricing" className="hover:text-snow">التسعير</Link>
                <Link href="/contact" className="hover:text-snow">تواصل</Link>
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
            "serviceType": "Performance Marketing & Ads",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "حملات إعلانية مدفوعة على جوجل وسوشال ميديا تركز على النتائج الملموسة وعائد الاستثمار.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Ads Services",
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
