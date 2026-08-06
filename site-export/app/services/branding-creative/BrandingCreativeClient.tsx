'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Lightbulb, 
  Eye, 
  Zap, 
  ChevronLeft,
  Video,
  Box,
  Sparkles,
  ArrowLeftRight,
  GripVertical,
  Sliders,
  Activity,
  Grid
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const brandingServices = [
  {
    title: 'استراتيجية العلامة',
    subtitle: 'Brand Strategy',
    desc: 'تحديد جوهر العلامة — الرؤية، الرسالة، القيم، التموضع، الشخصية، والجمهور.',
    price: 'عرض مخصص',
    icon: Lightbulb,
  },
  {
    title: 'تصميم الشعار والهوية',
    subtitle: 'Logo & Visual Identity Design',
    desc: 'شعار، نظام لوني، خطوط، عناصر بصرية، وتطبيقات أساسية تعكس طموح العلامة.',
    price: 'من 3,000 إلى 12,500 ر.س',
    icon: Palette,
  },
  {
    title: 'دليل الهوية البصرية',
    subtitle: 'Brand Guidelines Book',
    desc: 'دليل شامل لاستخدام العلامة عبر المنصات، يحافظ على الاتساق في كل نقطة لقاء.',
    price: 'يبدأ من 4,400 ر.س',
    icon: Eye,
  },
  {
    title: 'الموشن جرافيك والإنتاج المرئي',
    subtitle: 'Motion Graphics & Animation',
    desc: 'فيديوهات، شعارات متحركة، انفوجرافيك، ومواد مرئية للحملات والمنصات.',
    price: 'عرض مخصص لكل مشروع',
    icon: Video,
  },
  {
    title: 'تصميم التغليف والمطبوعات',
    subtitle: 'Packaging & Print Design',
    desc: 'تصميم تغليف ومطبوعات احترافية تعكس قيمة المنتج وتساعد على البيع.',
    price: 'عرض مخصص لكل مشروع',
    icon: Box,
  }
];

const methodologySteps = [
  'اكتشاف العلامة',
  'تحليل المنافسين',
  'تحديد التموضع',
  'بناء الشخصية والنبرة',
  'تطوير الاتجاه البصري',
  'تصميم النظام',
  'تسليم التطبيقات والدليل'
];

interface ColorPalette {
  id: string;
  name: string;
  nameAr: string;
  primaryColor: string;
  secondaryColor: string;
  glowBaseRgba: string;
  glowSecRgba: string;
  textColorClass: string;
  badgeBorderColor: string;
  activeBtnBg: string;
  theoryTitle: string;
  theoryEmotions: string[];
  theoryDescAr: string;
  theoryPhysicsAr: string;
}

const PALETTES: ColorPalette[] = [
  {
    id: 'orange',
    name: 'Nebula Orange',
    nameAr: 'برتقالي سديمي',
    primaryColor: '#f44d2b',
    secondaryColor: '#fbbf24',
    glowBaseRgba: '244, 77, 43',
    glowSecRgba: '251, 191, 36',
    textColorClass: 'text-pulse-orange',
    badgeBorderColor: 'border-pulse-orange/20',
    activeBtnBg: 'bg-pulse-orange',
    theoryTitle: 'البرتقالي السديمي: الابتكار الحركي الشغوف',
    theoryEmotions: ['الجرأة', 'النشاط', 'الإثارة', 'التطور'],
    theoryDescAr: 'يعكس اللون البرتقالي السديمي طاقة ديناميكية تُحفز المهام العقلية والإنتاج الاستباقي. يسهم لونه البراق في جذب الأنظار فوراً وبث الفضول والتفاعل الحيوي في نفوس الجمهور.',
    theoryPhysicsAr: 'طاقة طيفية عند طول موجي ~610nm: تزيد من تدفق الأوكسجين وتدعم قرارت الشراء والطلب.',
  },
  {
    id: 'violet',
    name: 'Cosmic Violet',
    nameAr: 'سديم بنفسجي',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    glowBaseRgba: '168, 85, 247',
    glowSecRgba: '236, 72, 153',
    textColorClass: 'text-purple-400',
    badgeBorderColor: 'border-purple-400/20',
    activeBtnBg: 'bg-purple-500',
    theoryTitle: 'البنفسجي الكوني: الفخامة المعرفية والوقار',
    theoryEmotions: ['الهيبة', 'الغموض', 'الذكاء', 'النخبوية'],
    theoryDescAr: 'يدمج دفء الأحمر باستقرار الأزرق. يربطه العقل الباطن بالفخامة الرقمية، المعرفة المطلقة، والرؤية الكونية العميقة؛ وهو مثير للاحترام والولاء المستمر للعلامة.',
    theoryPhysicsAr: 'طيف عالي التردد (~400nm): يحفز الجانب الإبداعي والفلسفي والتفكير المستقبلي اللا محدود.',
  },
  {
    id: 'emerald',
    name: 'Aurora Emerald',
    nameAr: 'زمرد قطبي',
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    glowBaseRgba: '16, 185, 129',
    glowSecRgba: '6, 182, 212',
    textColorClass: 'text-emerald-400',
    badgeBorderColor: 'border-emerald-400/20',
    activeBtnBg: 'bg-emerald-500',
    theoryTitle: 'الزمرد القطبي: الاستقرار العضوي والنمو',
    theoryEmotions: ['الأمان', 'الاستدامة', 'الازدهار', 'الثقة'],
    theoryDescAr: 'اللون الأكثر ملاءمة وفخامة لشبكة العين. يبعث على الهدوء والاسترخاء والاطمئنان، مما يجعله اللون الأول لتأصيل الثقة الدائمة والشعور بالاستقرار الجغرافي والمالي.',
    theoryPhysicsAr: 'منطقة الراحة الشبكية البصرية (~540nm): لا يحتاج مجهوداً للتركيز، مما يهدئ نبض المتلقي.',
  },
  {
    id: 'cyan',
    name: 'Hydrogen Cyan',
    nameAr: 'سيان فضائي',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    glowBaseRgba: '6, 182, 212',
    glowSecRgba: '59, 130, 246',
    textColorClass: 'text-cyan-400',
    badgeBorderColor: 'border-cyan-400/20',
    activeBtnBg: 'bg-cyan-500',
    theoryTitle: 'السيان الفضائي: النقاء التقني فائق السرعة',
    theoryEmotions: ['الوضوح', 'الأفق', 'السرعة', 'التقنية'],
    theoryDescAr: 'يرمز لغازات الهيدروجين البعيدة والوضوح السحابي المطلق. يمثّل قمة المنطق الرقمي المعاصر، ويمنح المتصفح شعوراً بالنقاء المعقم والابتكار السريع الخالي من التعقيد.',
    theoryPhysicsAr: 'النطاق البارد عالي التردد (~485nm): يزيد من مساحة التركيز البصري ويحد من التشتت.',
  }
];

export default function BrandingCreativeClient() {
  const [resonance, setResonance] = React.useState<number>(65);
  const [auraDepth, setAuraDepth] = React.useState<number>(75);
  const [symmetry, setSymmetry] = React.useState<number>(50);
  const [phase, setPhase] = React.useState<number>(0);
  const [selectedPalette, setSelectedPalette] = React.useState<ColorPalette>(PALETTES[0]);

  // Background animated tick for continuous fluid floating/breathing wave movement
  React.useEffect(() => {
    let animFrameId: number;
    const tick = () => {
      setPhase((prev) => (prev + 0.04) % (Math.PI * 2));
      animFrameId = requestAnimationFrame(tick);
    };
    animFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Sine math calculations
  const getSineWavePath = (res: number, ph: number) => {
    const points = [];
    const width = 600;
    const height = 100;
    const midY = height / 2;
    const amp = (res / 100) * 35;
    const freq = 0.015 + (res / 100) * 0.02;
    
    for (let x = 0; x <= width; x += 15) {
      const y = midY + Math.sin(x * freq + ph) * amp;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  const getSineWavePath2 = (res: number, ph: number) => {
    const points = [];
    const width = 600;
    const height = 100;
    const midY = height / 2;
    const amp = (res / 100) * 22;
    const freq = 0.01 + (res / 100) * 0.012;
    
    for (let x = 0; x <= width; x += 15) {
      const y = midY + Math.sin(x * freq - ph - 1.5) * amp;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
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
              Branding & Creative Design
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              نبني علامات <br />
              <span className="text-pulse-orange">لا تُنسى.</span>
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              هويات بصرية، أنظمة علامة، تصميمات وموشن جرافيك تعبّر عن جوهرك، وتميزك في السوق، وتمنح علامتك حضوراً ثابتاً على كل نقطة تواصل.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4">
                اطلب بناء هوية
              </Link>
              <Link href="/services/web-digital" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4">
                 شاهد خدمات الويب
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow">
              الهوية ليست مجرد شعار
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              في AGMA، نؤمن بأن الشعار هو مجرد رأس جبل الجليد. الهوية الحقيقية هي نظام متكامل يشمل الاستراتيجية، التموضع في السوق، اختيار الألوان والخطوط بدقة، بناء نبرة الحديث، وتصميم تجربة الجمهور الشاملة مع العلامة في كل لحظة لقاء.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Magic Lens Branding Showcase - The Brand Resonance Orchestrator */}
      <section className="py-24 px-6 relative overflow-hidden border-b border-gray-dark/45 bg-[#07080b]">
        <div className="grid-pattern opacity-10" />
        <div className="absolute inset-0 bg-radial-glowing opacity-60 pointer-events-none" />
        <div className="container mx-auto relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pulse-orange/10 border border-pulse-orange/20 text-pulse-orange text-[10px] font-extrabold tracking-wider uppercase font-mono">
              <Sparkles size={11} className="animate-pulse" />
              <span>The Brand Resonance Orchestrator | مُولّد تفاعلات علامتك الكونية</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-snow leading-tight tracking-tight">
              أوركسترا التناغم البصري الفاخر
            </h2>
            <p className="text-gray-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              تحكّم بطاقة الإبداع والإيقاع الهندسي لتشاهد كيف تتنفس أيقونة وعلامة هويتك وتنبض حوافها وتستقر مواءمتها تلقائياً مع معادلات النسبة الذهبية والجاذبية الأرضية في نظام كوني تفاعلي متجاوب.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-6xl mx-auto items-stretch">
            
            {/* Left Column / Control console board */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#0e1118]/90 to-[#07090d]/95 border border-gray-dark/50 p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 backdrop-blur-md shadow-2xl">
              <div className="space-y-5">
                <div className="border-b border-gray-dark/40 pb-4">
                  <span className="text-[10px] text-gray-medium/55 font-mono tracking-widest block uppercase">CONTROL CONSOLE DECK v2.1</span>
                  <p className="text-lg font-black text-snow flex items-center gap-2">
                    <Sliders size={18} style={{ color: selectedPalette.primaryColor }} />
                    لوحة المواءمة البصرية النشطة
                  </p>
                </div>

                {/* Slider 1: Resonance */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-medium font-bold flex items-center gap-1.5">
                      <Activity size={14} style={{ color: selectedPalette.primaryColor }} />
                      التردد والنبض الهيكلي
                    </span>
                    <span className="font-mono px-2 py-0.5 rounded-md font-extrabold" style={{ backgroundColor: `${selectedPalette.primaryColor}15`, color: selectedPalette.primaryColor }}>
                      {Math.round(40 + (resonance * 1.6))} Hz
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={resonance}
                    onChange={(e) => setResonance(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-dark/40 outline-none focus:ring-1"
                    style={{ accentColor: selectedPalette.primaryColor }}
                  />
                  <p className="text-[10px] text-gray-medium/60 leading-normal">
                    يتحكم في ذبذبة وتمدد الشعار وسرعة تنفس الهوية، محاكياً تدفق طاقة الذكاء في الشرايين الرقمية للعلامة.
                  </p>
                </div>

                {/* Slider 2: Aura Depth */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-medium font-bold flex items-center gap-1.5">
                      <Palette size={14} style={{ color: selectedPalette.secondaryColor }} />
                      وهج وعمق الهالة (Aura Glow)
                    </span>
                    <span className="font-mono px-2 py-0.5 rounded-md font-extrabold" style={{ backgroundColor: `${selectedPalette.secondaryColor}15`, color: selectedPalette.secondaryColor }}>
                      {Math.round(auraDepth * 12.5)} lm
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={auraDepth}
                    onChange={(e) => setAuraDepth(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-dark/40 outline-none focus:ring-1"
                    style={{ accentColor: selectedPalette.secondaryColor }}
                  />
                  <p className="text-[10px] text-gray-medium/60 leading-normal">
                    يتحكم في بريق الوهج الخلفي (Neon Spectrum) للعلامة لتضفي تباعداً فخماً يملأ العقل الباطن للنخبة وقاراً سديمياً.
                  </p>
                </div>

                {/* Slider 3: Symmetry Grid */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-medium font-bold flex items-center gap-1.5">
                      <Grid size={14} className="text-[#34d399]" />
                      المحاذاة والتشريح الهندسي
                    </span>
                    <span className="font-mono bg-[#34d399]/10 text-[#34d399] px-2 py-0.5 rounded-md font-extrabold">
                      {symmetry === 100 ? 'Φ 1.618 (PERFECT)' : `Φ ${(1 + (symmetry / 100) * 0.618).toFixed(3)}`}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={symmetry}
                    onChange={(e) => setSymmetry(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-dark/40 accent-emerald-450 outline-none focus:ring-1 focus:ring-emerald-400/30"
                  />
                  <p className="text-[10px] text-gray-medium/60 leading-normal">
                    يُظهر شبكة منحنيات فيبوناتشي وخطوط التشريح المتسامحة، محاذياً العلامة في مركز ثقل مغناطيسي متزن بنسبة 100%.
                  </p>
                </div>

                {/* Spectrum Palette Color Switcher 🎨 */}
                <div className="space-y-2.5 pt-2 border-t border-gray-dark/30">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-medium font-bold flex items-center gap-1.5">
                      <Palette size={14} className="text-sky-450" />
                      مُبدّل الطيف اللوني التفاعلي (Spectrum)
                    </span>
                    <span className="font-mono text-[10px] bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded-md font-extrabold uppercase">
                      {selectedPalette.nameAr}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {PALETTES.map((p) => {
                      const isSelected = selectedPalette.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPalette(p)}
                          className={`relative p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${
                            isSelected 
                              ? 'bg-white/[0.04] border-white/20 shadow-lg scale-105' 
                              : 'bg-black/20 border-gray-dark/40 hover:border-gray-dark/75 hover:bg-black/30'
                          }`}
                        >
                          <div className="flex gap-1">
                            <span 
                              className="w-3 h-3 rounded-full shadow-inner" 
                              style={{ backgroundColor: p.primaryColor }}
                            />
                            <span 
                              className="w-3 h-3 rounded-full shadow-inner" 
                              style={{ backgroundColor: p.secondaryColor }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-gray-medium block text-center truncate w-full mt-0.5">
                            {p.nameAr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Quick Presets Panel */}
              <div className="border-t border-gray-dark/45 pt-4 space-y-3">
                <span className="text-[10px] text-gray-semibold font-bold tracking-wider block uppercase">تطبيق سيناريوهات حية سريعة:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResonance(10);
                      setAuraDepth(15);
                      setSymmetry(10);
                    }}
                    className="px-3 py-2 rounded-xl border border-gray-dark/40 bg-black/40 hover:bg-[#0e1118] text-gray-medium hover:text-snow transition-all duration-300 text-[11px] font-extrabold cursor-pointer text-center"
                  >
                    🌌 الوضع الصامت الهادئ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResonance(85);
                      setAuraDepth(60);
                      setSymmetry(40);
                    }}
                    className="px-3 py-2 rounded-xl border border-gray-dark/40 bg-black/40 hover:bg-[#0e1118] text-gray-medium hover:text-snow transition-all duration-300 text-[11px] font-extrabold cursor-pointer text-center"
                  >
                    ⚡ الطاقة الديناميكية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResonance(45);
                      setAuraDepth(85);
                      setSymmetry(100);
                    }}
                    className="col-span-2 px-3 py-2.5 rounded-xl border border-pulse-orange/30 bg-pulse-orange/10 hover:bg-[#0e1118] text-snow transition-all duration-300 text-xs font-black shadow-[0_0_15px_rgba(244,77,43,0.15)] hover:shadow-[0_0_25px_rgba(244,77,43,0.3)] cursor-pointer text-center"
                  >
                    👑 معمارية الاتزان الذهبي الفوقي (Phi-Architect)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column / Live Dynamic Chamber Viewing Screen */}
            <div className="lg:col-span-7 bg-[#040507] rounded-3xl border border-gray-dark/60 overflow-hidden relative flex flex-col items-center justify-center p-6 h-[460px] sm:h-[540px] select-none shadow-[0_30px_70px_rgba(0,0,0,0.8)] group touch-none">
              
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
              
              {/* Dynamic Neon Background Glow (Responsive to Aura Depth & constant floating modulation) */}
              <div 
                className="absolute rounded-full filter blur-[70px] sm:blur-[110px] pointer-events-none mix-blend-screen opacity-70 transition-all duration-500 ease-out"
                style={{
                  width: `${140 + (auraDepth / 100) * 190}px`,
                  height: `${140 + (auraDepth / 100) * 190}px`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, rgba(${selectedPalette.glowBaseRgba},${(auraDepth / 100) * 0.45}) 0%, rgba(${selectedPalette.glowSecRgba},${(auraDepth / 100) * 0.25}) 55%, transparent 100%)`,
                }}
              />

              {/* Dynamic Blueprints & Symmetry Golden Grid (Fade in & spread according to Symmetry) */}
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{ opacity: symmetry / 100 }}
              >
                <svg className="absolute inset-0 w-full h-full text-emerald-400/25" viewBox="0 0 600 500" fill="none">
                  {/* Outer safety bounding box */}
                  <rect x="50" y="50" width="500" height="400" rx="12" stroke="currentColor" strokeWidth="0.5" strokeDasharray="6 6" opacity="0.4" />
                  
                  {/* Focal grid lines matching the logo center */}
                  <line x1="50" y1="250" x2="550" y2="250" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="300" y1="50" x2="300" y2="450" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                  
                  {/* Diagonal rule dimensions */}
                  <line x1="50" y1="50" x2="550" y2="450" stroke="currentColor" strokeWidth="0.25" opacity="0.6" />
                  <line x1="550" y1="50" x2="50" y2="450" stroke="currentColor" strokeWidth="0.25" opacity="0.6" />

                  {/* Adaptive Concentric Fibonacci Circles expanding with grid alignment */}
                  {/* Circles center at x=300, y=250 */}
                  <circle cx="300" cy="250" r={`${15 + (symmetry / 100) * 35}`} stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                  <circle cx="300" cy="250" r={`${35 + (symmetry / 100) * 54}`} stroke="currentColor" strokeWidth="0.75" />
                  <circle cx="300" cy="250" r={`${70 + (symmetry / 100) * 74}`} stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
                  <circle cx="300" cy="250" r={`${100 + (symmetry / 100) * 133}`} stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 8" style={{ color: selectedPalette.primaryColor, opacity: 0.3 }} />

                  {/* Diagnostic alignment specs */}
                  <text x="65" y="75" fill="currentColor" fontSize="8" textAnchor="start" className="font-mono text-emerald-400/80">ALIGN_X: 300.00</text>
                  <text x="65" y="90" fill="currentColor" fontSize="8" textAnchor="start" className="font-mono text-emerald-400/80">ALIGN_Y: 250.00</text>
                  <text x="65" y="105" fill="currentColor" fontSize="8" textAnchor="start" className="font-mono text-emerald-400/80">GRID_MATCH: TRUE</text>
                  <text x="535" y="75" fill="currentColor" fontSize="8" textAnchor="end" className="font-mono text-emerald-400/80">Ф: 1.618</text>
                  <text x="535" y="90" fill="currentColor" fontSize="8" textAnchor="end" className="font-mono text-emerald-400/80">ANG: 38.2°</text>
                </svg>
              </div>

              {/* The Central Breathing and Pulsing Emblem */}
              <div 
                className="relative z-10 flex flex-col items-center justify-center transition-transform duration-100 ease-out"
                style={{
                  // Breathe scale calculations: combines base resonance displacement + sin animation multiplier
                  transform: `scale(${1 + (resonance / 100) * 0.12 + Math.sin(phase) * (resonance / 100) * 0.045})`,
                }}
              >
                
                {/* Glowing favicon holder badge */}
                <div 
                  className="w-32 h-32 rounded-3xl bg-[#030303] border border-gray-dark/80 p-5 flex flex-col items-center justify-center relative shadow-2xl transition-all duration-300"
                  style={{
                    boxShadow: `0 0 ${20 + (auraDepth / 100) * 45}px rgba(${selectedPalette.glowBaseRgba},${0.15 + (auraDepth / 100) * 0.35})`,
                    borderColor: `${selectedPalette.primaryColor}30`
                  }}
                >
                  {/* Dynamic Color-Changing Logo using CSS Masking */}
                  <div 
                    className="w-20 h-20 relative z-10 transition-all duration-300"
                    style={{
                      backgroundColor: selectedPalette.primaryColor,
                      maskImage: 'url("/favicon AGMA.webp")',
                      WebkitMaskImage: 'url("/favicon AGMA.webp")',
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      filter: `drop-shadow(0 0 12px ${selectedPalette.primaryColor})`
                    }}
                  />
                  {/* Internal grid indicators */}
                  <div className="absolute inset-2 border border-white/[0.02] rounded-2xl pointer-events-none" />
                  <div 
                    className="absolute h-full w-[0.5px] left-1/2 -ml-[0.25px] transition-opacity duration-300"
                    style={{ opacity: symmetry / 100, backgroundColor: `${selectedPalette.secondaryColor}` }}
                  />
                  <div 
                    className="absolute w-full h-[0.5px] top-1/2 -mt-[0.25px] transition-opacity duration-300" 
                    style={{ opacity: symmetry / 100, backgroundColor: `${selectedPalette.secondaryColor}` }}
                  />
                </div>
              </div>

              {/* Dynamic Live Sine Waves Overlays at the bottom (Pulsing and speeding up with high resonance) */}
              <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none select-none">
                <svg className="w-full h-full" viewBox="0 0 600 100" preserveAspectRatio="none">
                  {/* Dynamic wave 1: phase */}
                  <path 
                    d={getSineWavePath(resonance, phase)}
                    fill="none"
                    stroke={selectedPalette.primaryColor}
                    strokeWidth="1.5"
                    className="opacity-40"
                  />
                  {/* Dynamic wave 2: opposite phase */}
                  <path 
                    d={getSineWavePath2(resonance, phase)}
                    fill="none"
                    stroke={selectedPalette.secondaryColor}
                    strokeWidth="1"
                    className="opacity-25"
                  />
                </svg>
              </div>

              {/* Float digital readouts overlays */}
              <div className="absolute top-4 right-4 bg-black/75 border border-white/5 px-2.5 py-1.5 rounded-xl text-left font-mono text-[8.5px] text-gray-medium/80 backdrop-blur-md space-y-0.5">
                <div className="flex justify-between gap-4">
                  <span style={{ color: selectedPalette.secondaryColor }}>AURA_GLOW:</span>
                  <span>{auraDepth.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-bold" style={{ color: selectedPalette.primaryColor }}>RESONANCE:</span>
                  <span className="font-bold">{resonance.toFixed(1)}%</span>
                </div>
              </div>

              <div className="absolute top-4 left-4 bg-black/75 border border-white/5 px-2.5 py-1.5 rounded-xl text-right font-mono text-[8.5px] text-gray-medium/80 backdrop-blur-md space-y-0.5">
                <p className="text-[9.5px] text-snow font-bold font-sans">
                  {resonance <= 30 
                    ? '«طاقة منخفضة - سكون بصري»'
                    : resonance <= 70
                    ? '«إيقاع متزن - تنفس حيوي»'
                    : '«تردد كوني - نبض ديناميكي فائق»'
                  }
                </p>
                <div className="flex gap-4 justify-between leading-none mt-1">
                  <span>ALIGN_INDEX:</span>
                  <span className={symmetry >= 80 ? 'text-emerald-400 font-bold' : ''}>
                    {symmetry >= 80 ? '1.000_MAX' : `${(symmetry/100).toFixed(3)}_OK`}
                  </span>
                </div>
              </div>

              {/* Symmetry info badge */}
              {symmetry >= 85 && (
                <div className="absolute bottom-12 left-4 bg-emerald-500/20 border border-emerald-400/40 text-[9px] px-2 py-0.5 rounded text-emerald-400 font-mono font-bold animate-pulse backdrop-blur-md hidden sm:block">
                  Φ_RATIO MATCHED: GOLDEN STANDARD v1.618
                </div>
              )}

            </div>

          </div>

          {/* Interactive informational footer box with 3 columns (now including Color Theory) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right max-w-6xl mx-auto mt-10 bg-[#0c0e12]/30 border border-gray-dark/30 p-6 rounded-3xl text-sm leading-relaxed text-gray-semibold">
            {/* Column 1: Dynamics */}
            <div className="space-y-2">
              <span className="font-mono font-bold text-[10px] tracking-wider block uppercase animate-pulse" style={{ color: selectedPalette.primaryColor }}>DYNAMICS PHILOSOPHY</span>
              <p className="font-bold text-snow">العلامة الحيوية التي تتنفس</p>
              <p className="text-gray-medium/70 text-xs">
                في عصر الذكاء الاصطناعي، الشعار الثابت في الدليل لم يعد كافياً. الهوية البصرية الناجحة يجب أن تمتلك مرونة عضوية (Dynamic Elasticity) للتجاوب مع مختلف شاشات اللمس والمنصات الذكية بسلاسة دون خسارة الاتزان الجيومتري.
              </p>
            </div>
            
            {/* Column 2: Geometry */}
            <div className="space-y-2 border-r border-[#1e293b] pr-0 md:pr-6 pt-4 md:pt-0">
              <span className="text-emerald-400 font-mono font-bold text-[10px] tracking-wider block uppercase">GEOMETRY SYSTEM</span>
              <p className="font-bold text-snow">الهندسة المثالية للنسب</p>
              <p className="text-gray-medium/70 text-xs">
                بتحريك منزلق المحاذاة، تظهر النسبة الذهبية الرياضية (1:1.618) الشهيرة التي حكمت إبداعات دافنشي والمعماريين القدامى، وتتبدى ببريقها الفريد في تفاصيل موازنة أبعاد وانحناءات شعار علامتك لتريح عين المتلقي وتُثبّت وقع الهوية في العقل الباطن.
              </p>
            </div>

            {/* Column 3: Color Theory (Interactive!) */}
            <div className="space-y-3 border-r border-[#1e293b] pr-0 md:pr-6 pt-4 md:pt-0">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-[10px] tracking-wider block uppercase" style={{ color: selectedPalette.secondaryColor }}>COLOR THEORY (لوحة الألوان)</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10" style={{ color: selectedPalette.primaryColor }}>نشط حالياً</span>
              </div>
              <p className="font-bold text-snow">{selectedPalette.theoryTitle}</p>
              <p className="text-gray-medium/70 text-xs leading-relaxed">
                {selectedPalette.theoryDescAr}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selectedPalette.theoryEmotions.map((emotion, idx) => (
                  <span 
                    key={idx} 
                    className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold tracking-tight bg-white/[0.03] border"
                    style={{ borderColor: `${selectedPalette.primaryColor}20`, color: selectedPalette.primaryColor }}
                  >
                    {emotion}
                  </span>
                ))}
              </div>
              <p className="text-[9.5px] font-mono text-gray-medium/40 mt-1">
                {selectedPalette.theoryPhysicsAr}
              </p>
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
            {brandingServices.map((service, i) => (
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
                  <span className="text-[10px] text-gray-medium font-bold uppercase tracking-widest">الاستثمار</span>
                  <span className="text-xl font-bold text-snow">{service.price}</span>
                  <Link href="/contact" className="text-pulse-orange text-sm font-bold flex items-center gap-1 group/link mt-2">
                    احجز الآن <ChevronLeft size={16} className="group-hover/link:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">منهجية بناء الهوية</h2>
            <p className="text-gray-medium mt-4 font-medium">نتبع مساراً استراتيجياً يحول الأفكار إلى واقع بصري متماسك.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-px bg-gray-dark/20">
             {methodologySteps.map((step, i) => (
               <div key={i} className="geometric-card bg-pure-ink p-8 flex flex-col items-start gap-4 text-right group border-none">
                  <span className="text-pulse-orange font-mono font-bold text-xs uppercase tracking-widest">Phase 0{i+1}</span>
                  <h4 className="text-snow font-bold text-sm leading-tight group-hover:text-pulse-orange transition-colors">{step}</h4>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* When do you need a new identity? */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">متى تحتاج هوية جديدة؟</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { title: 'إطلاق مشروع جديد', desc: 'لبناء حضور قوي ومميز من اليوم الأول في سوق تنافسي.' },
              { title: 'التوسع للسوق السعودي', desc: 'لمواءمة علامتك مع الثقافة المحلية وذائقة الجمهور في المملكة.' },
              { title: 'ضعف تميّز العلامة', desc: 'عندما تبدو علامتك مشابهة بشكل كبير للمنافسين وتفتقر للهوية الفريدة.' },
              { title: 'اختلاف التصاميم', desc: 'عندما تلاحظ عدم اتساق في شكل علامتك بين المنصات المختلفة.' },
              { title: 'التحول المؤسسي', desc: 'عندما يتحول مشروعك الصغير إلى كيان مؤسسي يحتاج لهيبة ومكانة أكبر.' },
              { title: 'خسارة الاتصال مع الجمهور', desc: 'عندما تشعر أن علامتك لم تعد تعبر عن تطلعات جمهورك الحالي.' },
            ].map((reason, i) => (
              <div key={i} className="space-y-4 border-r border-pulse-orange/20 pr-6">
                <div className="flex items-center gap-3">
                   <Zap className="text-pulse-orange" size={18} />
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
                اجعل علامتك واضحة <br />
                <span className="text-pulse-orange">قبل أن تطلب من الناس تذكّرها.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                نبدأ من جوهر العلامة، ثم نبني نظاماً بصرياً يعيش بذكاء على كل قناة تواصل مع جمهورك.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                اطلب بناء هوية علامتك
              </Link>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services/web-digital" className="hover:text-snow">الويب والمنتجات</Link>
                <Link href="/services/social-media" className="hover:text-snow">السوشال ميديا</Link>
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
            "serviceType": "Branding & Creative Design",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "تصميم هويات بصرية، استراتيجية العلامة التجارية، وأنظمة التصميم للشركات الناشئة والكبرى في السعودية.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Branding Services",
              "itemListElement": brandingServices.map(s => ({
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
