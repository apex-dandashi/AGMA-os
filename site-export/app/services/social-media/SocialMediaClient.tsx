'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Share2, 
  Megaphone, 
  MessageSquare, 
  Target, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  ChevronLeft,
  Smartphone,
  Facebook,
  Heart,
  MessageCircle,
  ShieldAlert,
  CheckCircle2,
  Flame,
  Sparkles,
  TrendingUp,
  ThumbsUp,
  Eye,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const socialServices = [
  {
    title: 'إدارة السوشال ميديا',
    subtitle: 'Social Media Management',
    desc: 'إدارة كاملة لمنصاتك — تخطيط، إنتاج، نشر، تفاعل، وتقارير أداء دورية.',
    price: 'يبدأ من 2,800 ر.س شهرياً',
    icon: Share2,
  },
  {
    title: 'التسويق عبر المؤثرين',
    subtitle: 'KOL & Influencer Marketing',
    desc: 'شراكات مع مؤثرين سعوديين وخليجيين، اختيار دقيق، تنفيذ احترافي، وقياس أثر فعلي.',
    price: 'عرض مخصص لكل حملة',
    icon: Users,
  },
  {
    title: 'استراتيجية السوشال ميديا',
    subtitle: 'Social Media Strategy',
    desc: 'خطة متكاملة لحضورك الرقمي — أهداف، جمهور، قنوات، محتوى، KPIs، وتقويم نشر.',
    price: 'يبدأ من 5,000 ر.س مرة واحدة',
    icon: Target,
  },
  {
    title: 'إدارة المجتمعات الرقمية',
    subtitle: 'Community Management',
    desc: 'ردود فعالة على التعليقات والرسائل، إدارة الأزمات، وبناء مجتمع متفاعل حول علامتك.',
    price: 'يبدأ من 2,200 ر.س شهرياً',
    icon: MessageSquare,
  }
];

const platforms = [
  { name: 'Instagram', icon: Instagram },
  { name: 'TikTok', icon: Smartphone },
  { name: 'X (Twitter)', icon: Twitter },
  { name: 'LinkedIn', icon: Linkedin },
  { name: 'Snapchat', icon: Megaphone },
  { name: 'Facebook', icon: Facebook },
  { name: 'YouTube Shorts', icon: Youtube },
];

const contentTypes = [
  'Reels', 'Carousels', 'Stories', 'Posts', 'Motion Graphics', 'Founder Content', 'Educational Content', 'Campaign Content', 'Community Posts'
];

const socialPresets = [
  {
    category: "💼 قصة نجاح إستراتيجية",
    text: "قبل سنة أشهر، كانت مبيعات هذا الشريك لا تتجاوز 10,000 ريال شهرياً. واليوم، بفضل الانتقال من النشر العشوائي إلى محتوى سيمانتك فائق الجودة، وهندسة مسارات الفكرة لخدمة نية المشتري الحقيقية، نفخر بتجاوز مبيعاته العضوية 850,000 ريال شهريا! 🚀 النمو المستدام يبدأ بالتحليل والدراسة العميقة وليس بضربة حظ.",
    imageText: "معدل النمو العضوي للشركاء: +310%",
    hashtag: "#هندسة_النمو #تميز_سعودي",
    platform: "linkedin",
    authorName: "عامر بن عبدالله الغامدي",
    authorTitle: "الرئيس التنفيذي لـ AGMA"
  },
  {
    category: "🔥 فلسفة الوصول العضوي",
    text: "الوصول العضوي الملاييني لا يحدث بمجرد نقرة زر، بل هو نتاج تخطيط دقيق، ومحتوى محاذٍ سيمانتياً لنبرة المجتمع. خلف كل حملة ناجحة نطلقها أربع ركائز أساسية: صوت فريد للعلامة التجارية، وتصميم يمنح الناظر شعور الهيبة، وتوقيت مدروس سلوكياً، ومتابعة فورية لبناء مجتمع مخلص ومتفاعل.",
    imageText: "بناء ولاء حقيقي: 10/10",
    hashtag: "#هندسة_المحتوى #AGMA",
    platform: "twitter",
    authorName: "فريق الإستراتيجية الإبداعية",
    authorTitle: "تخطيط ونشر سلوكي"
  },
  {
    category: "✨ تصميم وهوية فاخرة",
    text: "جمال هويتك البصرية على شبكات التواصل يكمن في البساطة البليغة وقوة المعنى. ليس بالضرورة أن تملأ الفراغات بالضجيج الديكوري المشتت، بل الفراغ المتوازن واستخدام الأبعاد المصممة بدقة ورزانة يمنح علامتك مرأى فاخر يربط العميل بوجدانها فوراً 🎨💎",
    imageText: "انطباع بصري مميز ومستهدف: 100%",
    hashtag: "#فخامة_الهوية_البصرية",
    platform: "instagram",
    authorName: "مها العتيبي",
    authorTitle: "رئيسة قسم التصميم الإبداعي"
  }
];

const baseComments = {
  0: [
    { name: "فواز السديري", role: "شريك مؤسس - سدير للتجارة", comment: "الربط بين إعلانات المشاهير وبناء مسارات (Funnels) هندسة المحتوى غيّر مبيعاتنا بالكامل! الإعلانات بمفردها دون استراتيجية ونية شراء حقيقية كانت تهدر الميزانيات، لكن مع AGMA كل زيارة أصبحت عميلاً مخلصاً." },
    { name: "نورة القحطاني", role: "مديرة التسويق - دلة كافيه", comment: "عمل عظيم من الأستاذ عامر وفريق AGMA.. عقلية هندسة المسارات هي ما يحتاجه السوق المحلي اليوم فعلاً." },
    { name: "خالد الحربي", role: "مستشار نمو رقمي", comment: "أرقام ممتازة وملهمة، هندسة المحتوى السيمانتي تثبت دائماً أنها الرقم الصعب في تقليل تكلفة الاستحواذ (CAC)." }
  ],
  1: [
    { name: "د. عبدالمحسن البقمي", role: "أكاديمي وخبير سلوك مستهلك", comment: "الربط بين سلوك المجتمع والتصميم الرزين يحترم عقل العميل ويخلق ارتباطاً عاطفياً مستداماً. خطوة موفقة لـ AGMA." },
    { name: "سعد الشهري", role: "مطور أعمال رقمية", comment: "أربع ركائز واضحة ومدروسة. كفانا ضجيجاً تسويقياً والتركيز على الولاء الحقيقي وإثراء السيمانتكس هو المستقبل." }
  ],
  2: [
    { name: "سارة المقبل", role: "مصممة واجهات فنية", comment: "الفراغ المدروس في التصميم هو قمة الفخامة! الهويات الوجاهية تدوم طويلاً بعكس التصاميم المزدحمة بالضجيج." },
    { name: "م. فيصل الغامدي", role: "رائد أعمال - قطاع التجارة الفاخرة", comment: "الهوية البصرية لـ AGMA والخطوط الرزينة تعكس تماماً فلسفتهم. الفخامة تكمن في البساطة البليغة فعلاً." }
  ]
};

export default function SocialMediaClient() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = React.useState<number>(0);
  const [particles, setParticles] = React.useState<Array<{ id: string; type: string; x: number; y: number; dx: number; dy: number; rotate: number; size: number }>>([]);
  const [reach, setReach] = React.useState<number>(1240);
  const [interactions, setInteractions] = React.useState<number>(84);
  const [engagementRate, setEngagementRate] = React.useState<number>(1.4);
  const [isBroadcasting, setIsBroadcasting] = React.useState<boolean>(false);
  const [showComments, setShowComments] = React.useState<boolean>(false);
  const [showShareToast, setShowShareToast] = React.useState<boolean>(false);
  const [showBoostToast, setShowBoostToast] = React.useState<boolean>(false);
  const [boostAmount, setBoostAmount] = React.useState<{ reach: number; interactions: number }>({ reach: 0, interactions: 0 });
  const [isLiked, setIsLiked] = React.useState<boolean>(false);

  const currentPreset = socialPresets[activePreset];

  // Dynamically generate timestamps on preset change or mount so it never feels like static spam
  const dynamicComments = React.useMemo(() => {
    const rawComments = baseComments[activePreset as keyof typeof baseComments] || [];
    return rawComments.map((c, idx) => {
      // Create seed based on name length and activePreset index so it stays consistent but unique per preset
      const seed = (c.name.length + idx + activePreset) % 5;
      let timeStr = "";
      if (idx === 0) {
        const mins = (seed * 2) + 3; // 3 to 11 mins
        timeStr = `منذ ${mins} دقائق`;
      } else if (idx === 1) {
        const mins = (seed * 5) + 15; // 15 to 35 mins
        timeStr = `منذ ${mins} دقيقة`;
      } else {
        const hours = (seed % 3) + 1; // 1 to 3 hours
        if (hours === 1) timeStr = "منذ ساعة";
        else if (hours === 2) timeStr = "منذ ساعتين";
        else timeStr = `منذ ${hours} ساعات`;
      }
      return { ...c, time: timeStr };
    });
  }, [activePreset]);

  // Gradual, realistic slow-paced interval simulation so users have time to interact and manual inputs feel powerful
  React.useEffect(() => {
    if (!isBroadcasting) return;
    const interval = setInterval(() => {
      setReach(prev => {
        const next = prev + Math.floor(Math.random() * 850) + 220;
        if (next >= 1240500) return 1240500;
        return next;
      });
      setInteractions(prev => {
        const next = prev + Math.floor(Math.random() * 45) + 10;
        if (next >= 98300) return 98300;
        return next;
      });
      setEngagementRate(prev => {
        const next = parseFloat((prev + 0.02).toFixed(2));
        if (next >= 12.8) return 12.8;
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isBroadcasting]);

  const triggerCascade = (
    e?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    emojiTypes?: string[]
  ) => {
    let clickX = 250;
    let clickY = 180;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      clickX = rect.width / 2;
      clickY = rect.height / 2;
      
      if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        clickX = e.clientX - rect.left;
        clickY = e.clientY - rect.top;
      }
    }

    const types = emojiTypes || ['heart', 'comment', 'share', 'fire', 'sparkle', 'rocket'];
    
    // Create particles
    const particleCount = emojiTypes ? 12 : 24; // Bigger burst for manual boosts
    const newParticles = Array.from({ length: particleCount }).map((_, idx) => {
      const dx = (Math.random() - 0.5) * 440;
      const dy = -120 - Math.random() * 320;
      const rotate = (Math.random() - 0.5) * 360;
      return {
        id: `${Date.now()}-${idx}-${Math.random()}`,
        type: types[Math.floor(Math.random() * types.length)],
        x: clickX,
        y: clickY,
        dx,
        dy,
        rotate,
        size: 0.85 + Math.random() * 1.3
      };
    });

    setParticles(prev => [...prev.slice(-50), ...newParticles]);

    if (!isBroadcasting) {
      setIsBroadcasting(true);
      // Give a small initial boost on first launch
      setReach(prev => prev + 12500);
      setInteractions(prev => prev + 480);
      setEngagementRate(3.2);
    } else {
      // Manual trigger cascade is a HUGE highly rewarding boost
      const reachBoost = Math.floor(Math.random() * 35000) + 20000;
      const interactionBoost = Math.floor(Math.random() * 1800) + 950;
      const erBoost = parseFloat((0.2 + Math.random() * 0.4).toFixed(2));

      setReach(prev => Math.min(prev + reachBoost, 1240500));
      setInteractions(prev => Math.min(prev + interactionBoost, 98300));
      setEngagementRate(prev => Math.min(parseFloat((prev + erBoost).toFixed(2)), 12.8));

      // Show temporary boost visual toast feedback
      setBoostAmount({ reach: reachBoost, interactions: interactionBoost });
      setShowBoostToast(true);
      const timer = setTimeout(() => setShowBoostToast(false), 2500);
      return () => clearTimeout(timer);
    }
  };

  const handleReset = () => {
    setIsBroadcasting(false);
    setReach(1240);
    setInteractions(84);
    setEngagementRate(1.4);
    setParticles([]);
    setShowComments(false);
    setIsLiked(false);
    setShowShareToast(false);
    setShowBoostToast(false);
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
            <div className="lg:col-span-5 space-y-8 text-right">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5 text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">
                  Viral Engagement Cascade
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black mb-6 leading-tight text-snow">
                  نتحدث بصوت علامتك. <br />
                  <span className="text-pulse-orange">كل يوم وبقوة.</span>
                </h1>
                <p className="text-gray-medium text-base sm:text-lg lg:text-xl mb-10 leading-relaxed font-medium">
                  إدارة منصاتك باستراتيجية واضحة ومكثفة، محتوى يتحدث بصوتك الفريد، وحضور اجتماعي يبني تفاعلاً فيروسياً متدفقاً وولاءً حقيقياً مستداماً.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4 text-center pb-4.5">
                    اطلب إدارة السوشال
                  </Link>
                  <Link href="/services/seo-content" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4 text-center pb-4.5">
                    شاهد خدمات المحتوى
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Left Column: Interactive Feed Card Engagement Simulator */}
            <div className="lg:col-span-7 w-full relative z-10">
              <div 
                ref={containerRef}
                onClick={(e) => triggerCascade(e)}
                className="bg-gray-dark/15 border border-gray-dark/40 p-4 sm:p-7 rounded-3xl relative backdrop-blur-md overflow-hidden shadow-2xl ring-1 ring-white/5 cursor-pointer group select-none transition-all duration-300"
              >
                {/* Abstract background glow */}
                <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-pulse-orange/5 rounded-full blur-[90px] pointer-events-none" />
                <div className="absolute -bottom-8 right-1/3 w-72 h-72 bg-deep-navy/30 rounded-full blur-[100px] pointer-events-none" />

                {/* Particle Cascade Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <AnimatePresence>
                    {particles.map((p) => {
                      let emoji = '❤️';
                      if (p.type === 'comment') emoji = '💬';
                      else if (p.type === 'share') emoji = '🔄';
                      else if (p.type === 'fire') emoji = '🔥';
                      else if (p.type === 'sparkle') emoji = '✨';
                      else if (p.type === 'rocket') emoji = '🚀';

                      return (
                        <motion.div
                          key={p.id}
                          initial={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
                          animate={{ 
                            x: p.x + p.dx, 
                            y: p.y + p.dy, 
                            opacity: [1, 1, 0], 
                            scale: [0.3, p.size, 0.4],
                            rotate: p.rotate
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.8, ease: "easeOut" }}
                          style={{ position: 'absolute' }}
                          className="text-2xl filter drop-shadow-[0_4px_10px_rgba(244,77,43,0.3)] select-none pointer-events-none"
                        >
                          {emoji}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Share Toast Notification */}
                <AnimatePresence>
                  {showShareToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className="absolute top-4 right-4 left-4 sm:left-auto sm:max-w-xs bg-black/95 border border-pulse-orange/40 p-3.5 rounded-2xl shadow-[0_10px_35px_rgba(244,77,43,0.3)] z-50 text-right flex items-start gap-2.5 relative"
                    >
                      <div className="w-8 h-8 rounded-full bg-pulse-orange/15 flex items-center justify-center text-pulse-orange shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11.5px] font-extrabold text-snow">تمت محاكاة مشاركة واعية!</p>
                        <p className="text-[10.5px] text-gray-medium leading-snug mt-0.5">تم تسجيل المشاركة وزيادة مستوى التفاعل والسلوكية بنجاح.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Boost Instant Feedback Toast */}
                <AnimatePresence>
                  {showBoostToast && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.92 }}
                      className="absolute bottom-20 left-4 right-4 md:right-auto md:left-4 md:max-w-[280px] bg-black/95 border border-green-500/40 p-3.5 rounded-2xl shadow-[0_10px_35px_rgba(34,197,94,0.15)] z-50 text-right flex items-start gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center text-green-500 shrink-0">
                        <Sparkles size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11.5px] font-extrabold text-green-400">تم تنشيط خطوة انتشار إضافية! 🚀</p>
                        <p className="text-[10.5px] text-gray-medium leading-snug mt-1 font-mono">
                          +{boostAmount.reach.toLocaleString()} وصول جديد <br />
                          +{boostAmount.interactions.toLocaleString()} تفاعلات إضافية
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header info widget */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-dark/40">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-pulse-orange animate-pulse" />
                    <h3 className="text-sm font-bold text-snow">لوحة محاكاة التخطيط والانتشار العضوي المدروس</h3>
                  </div>
                  <span className="text-[9px] font-mono text-gray-medium border border-gray-dark px-2 py-0.5 rounded bg-gray-dark/20 uppercase tracking-widest self-start sm:self-auto">
                    AGMA COGNITIVE CASCADE v2.5
                  </span>
                </div>

                {/* Preset Chips Selector to switch card type */}
                <div className="flex flex-wrap gap-2 mb-4 justify-end relative z-40">
                  <span className="text-[10px] text-gray-medium font-bold self-center ml-2">اختر نموذج المنشور لرؤية أثر التخطيط:</span>
                  {socialPresets.map((pr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreset(idx);
                        setIsBroadcasting(false);
                        setReach(1240);
                        setInteractions(84);
                        setEngagementRate(1.4);
                        setParticles([]);
                        setShowComments(false);
                        setIsLiked(false);
                        setShowShareToast(false);
                      }}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold border transition-all duration-300 relative z-50 cursor-pointer ${
                        activePreset === idx
                          ? 'bg-pulse-orange border-pulse-orange text-snow shadow-[0_0_12px_rgba(244,77,43,0.3)]'
                          : 'bg-gray-dark/20 border-gray-dark/40 text-gray-medium hover:text-snow hover:border-gray-dark'
                      }`}
                    >
                      {pr.category}
                    </button>
                  ))}
                </div>

                {/* High Fidelity Social Post Card Mockup - With Real Logo and Human Copywriting Layout */}
                <div className="bg-pure-ink border border-gray-dark/50 rounded-2xl p-4 md:p-5 mb-5 relative transition-all duration-300 hover:border-pulse-orange/30">
                  
                  {/* Post Creator Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar with digital glowing circle border using actual AGMA Favicon */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pulse-orange to-amber-500 p-[1.5px] shadow-[0_0_8px_rgba(244,77,43,0.3)] flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-pure-ink p-1 flex items-center justify-center relative overflow-hidden">
                          <Image
                            src="/favicon AGMA.webp"
                            alt="AGMA Logo"
                            width={32}
                            height={32}
                            className="object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="text-xs font-extrabold text-snow flex items-center gap-1.5">
                          {currentPreset.authorName}
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </span>
                        <span className="text-[9.5px] font-bold text-gray-medium leading-tight">
                          {currentPreset.authorTitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-medium/70 font-mono font-bold">نشط في الرياض</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-pulse-orange/15 text-pulse-orange font-bold uppercase">
                        {currentPreset.platform.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Post Caption text area */}
                  <p className="text-xs md:text-[13px] leading-relaxed text-snow/90 mb-4 text-right font-medium">
                    {currentPreset.text}
                    <span className="block text-pulse-orange hover:underline cursor-pointer mt-2 font-semibold">
                      {currentPreset.hashtag}
                    </span>
                  </p>

                  {/* Graphic Banner Mockup with subtle design charts inside */}
                  <div className="bg-gray-dark/15 border border-gray-dark/40 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[130px] overflow-hidden text-center gap-2">
                    <div className="absolute inset-0 bg-gradient-to-bl from-pulse-orange/5 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="w-12 h-12 rounded-full bg-pulse-orange/15 flex items-center justify-center text-pulse-orange mb-1">
                      <Sparkles size={22} className="animate-pulse" />
                    </div>
                    
                    <span className="text-xs font-black text-snow tracking-wide uppercase font-mono">
                      {currentPreset.imageText}
                    </span>
                    <span className="text-[9.5px] text-gray-medium font-bold">
                      أداء يفوق مستويات السوق بفضل النثريات السيمانتية الإبداعية
                    </span>

                    {/* Faux waveform analytics backdrop lines */}
                    <div className="absolute bottom-0 inset-x-0 h-8 flex items-end justify-center gap-[4px] opacity-15 pointer-events-none px-4">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div 
                          key={i} 
                          style={{ height: `${20 + Math.sin(i * 0.4) * 60}%` }} 
                          className="w-[3px] bg-pulse-orange rounded-t-sm" 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Interactive Buttons Footer Bar */}
                  <div className="flex items-center justify-between border-t border-gray-dark/40 mt-4 pt-3 text-[11px] text-gray-medium font-bold relative z-30">
                    <button
                      type="button"
                      id="likes-interaction-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLiked(!isLiked);
                        triggerCascade(e, ['heart', 'heart', 'heart', 'fire']);
                        setInteractions(prev => Math.min(prev + (isLiked ? -1250 : 1250), 98300));
                        setEngagementRate(prev => Math.min(prev + (isLiked ? -0.15 : 0.15), 12.8));
                      }}
                      className={`flex items-center gap-1.5 hover:text-pulse-orange transition-colors cursor-pointer relative z-40 ${
                        isLiked ? 'text-pulse-orange' : ''
                      }`}
                    >
                      <ThumbsUp size={13} className={isLiked ? 'scale-110 fill-pulse-orange' : ''} />
                      <span>{isLiked ? 'متفاعل بمحبة' : 'تفاعلات حقيقية'}</span>
                    </button>
                    
                    <button
                      type="button"
                      id="comments-interaction-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowComments(!showComments);
                        triggerCascade(e, ['comment']);
                      }}
                      className={`flex items-center gap-1.5 hover:text-pulse-orange transition-colors cursor-pointer relative z-40 ${
                        showComments ? 'text-pulse-orange' : ''
                      }`}
                    >
                      <MessageCircle size={13} className={showComments ? 'scale-110 fill-pulse-orange/20' : ''} />
                      <span>قراءة الآراء</span>
                    </button>

                    <button
                      type="button"
                      id="share-interaction-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShareToast(true);
                        triggerCascade(e, ['share', 'rocket']);
                        setReach(prev => Math.min(prev + 8400, 1240500));
                        setTimeout(() => setShowShareToast(false), 3500);
                      }}
                      className="flex items-center gap-1.5 hover:text-pulse-orange transition-colors cursor-pointer relative z-40"
                    >
                      <Share2 size={13} />
                      <span>مشاركة واعية</span>
                    </button>
                  </div>

                  {/* Opinions Comments panel */}
                  <AnimatePresence>
                    {showComments && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-dark/40 overflow-hidden space-y-3 relative z-30"
                      >
                        <h4 className="text-xs font-bold text-pulse-orange mb-2 text-right">آراء ودراسات مجتمعية حقيقية للشريك:</h4>
                        {dynamicComments.map((comment, index) => (
                          <div 
                            key={index} 
                            className="bg-gray-dark/15 p-3 rounded-xl border border-gray-dark/30 text-right space-y-1 transition-all duration-300 hover:border-pulse-orange/20"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-gray-medium font-mono">{comment.time}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10.5px] font-extrabold text-snow">{comment.name}</span>
                                <span className="text-[9.5px] text-gray-medium">({comment.role})</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-snow/80 leading-relaxed pt-0.5">{comment.comment}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Interactive Dynamic Strategy Human Roadmap Pipeline */}
                <div className="mb-5 bg-pure-ink border border-gray-dark/40 p-4 rounded-2xl text-right">
                  <h4 className="text-xs font-bold text-gray-medium mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pulse-orange" />
                    مسار هندسة النشر والتأثير البشري الممنهج لـ AGMA:
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      {
                        step: "1",
                        title: "الفهم السلوكي وتوطين النغمة لعمق وجدان القارئ",
                        desc: "صياغة المرتكزات بمحاذاة تامة مع الوعي والقيم المحلية.",
                        isActive: reach >= 1240,
                      },
                      {
                        step: "2",
                        title: "الصياغة السيمانتية وهندسة الإخراج البصري",
                        desc: "تحرير العنوان، وتأطير الهيبة والمقاس المريح لعين الملاحظ.",
                        isActive: reach > 100000,
                      },
                      {
                        step: "3",
                        title: "التوزيع الذكي ومنظومة التوصيل الإرشادية",
                        desc: "اختيار التوقيت الأمثل سلوكياً ومجارات خوارزميات المنصات الملتوية.",
                        isActive: reach > 500000,
                      },
                      {
                        step: "4",
                        title: "رعاية وإدارة المجتمع والردود الواعية المباشرة",
                        desc: "رد فوري بمودة وبناء انتماء وثيق يولّد الرغبة الصادقة للمشاركة الدائمة.",
                        isActive: reach > 900000,
                      }
                    ].map((step, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-xl border transition-all duration-300 text-xs text-right flex items-start gap-3 ${
                          step.isActive 
                            ? 'bg-pulse-orange/5 border-pulse-orange/20 text-snow shadow-[0_0_15px_rgba(244,77,43,0.05)]' 
                            : 'bg-transparent border-gray-dark/20 text-gray-semibold/50 opacity-40'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          step.isActive 
                            ? 'bg-pulse-orange text-snow shadow-[0_0_8px_rgba(244,77,43,0.4)]' 
                            : 'bg-gray-dark/40 text-gray-medium'
                        }`}>
                          {step.step}
                        </div>
                        <div>
                          <p className={`font-extrabold ${step.isActive ? 'text-pulse-orange' : 'text-gray-medium'}`}>{step.title}</p>
                          <p className="text-[10px] text-gray-medium mt-0.5 leading-snug">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Live Stream Counters Container */}
                <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                  
                  <div className="bg-gray-dark/15 border border-gray-dark/30 p-3 rounded-2xl flex flex-col justify-between">
                    <div className="text-[9.5px] text-gray-medium font-bold pb-1 bg-gradient-to-l from-transparent via-gray-dark/40 to-transparent">الوصول العضوي (Reach)</div>
                    <div>
                      <div className="text-base sm:text-lg lg:text-xl font-black font-sans text-snow tracking-wide transition-all duration-300">
                        {reach >= 1000000 
                          ? `${(reach / 1000000).toFixed(2)}M` 
                          : reach.toLocaleString('en-US')
                        }
                      </div>
                      <div className="text-[8px] text-gray-semibold text-green-500 scale-95 mt-1 flex items-center justify-center gap-0.5">
                        <Eye size={9} />
                        <span>مشاهدة عضوية حقيقية</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-dark/15 border border-gray-dark/30 p-3 rounded-2xl flex flex-col justify-between">
                    <div className="text-[9.5px] text-gray-medium font-bold pb-1 bg-gradient-to-l from-transparent via-gray-dark/40 to-transparent">التفاعلات الواعية</div>
                    <div>
                      <div className="text-base sm:text-lg lg:text-xl font-black font-sans text-pulse-orange tracking-wide transition-all duration-300">
                        {interactions.toLocaleString('en-US')}
                      </div>
                      <div className="text-[8px] text-gray-semibold text-green-500 scale-95 mt-1 flex items-center justify-center gap-0.5 animate-pulse">
                        <Flame size={9} />
                        <span>تفاعل مدروس</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-dark/15 border border-gray-dark/30 p-3 rounded-2xl flex flex-col justify-between">
                    <div className="text-[9.5px] text-gray-medium font-bold pb-1 bg-gradient-to-l from-transparent via-gray-dark/40 to-transparent">معدل التفاعل الأصيل ER</div>
                    <div>
                      <div className="text-base sm:text-lg lg:text-xl font-black font-sans text-green-500 tracking-wide transition-all duration-300">
                        {isBroadcasting ? `${engagementRate}%` : '---'}
                      </div>
                      <div className="text-[8px] text-gray-semibold scale-95 mt-1">
                        {engagementRate >= 8 ? '🔥 تفاعل فيروسي حقيقي' : 'معدل صحي للغاية'}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Helper action triggers */}
                <div className="flex flex-col sm:flex-row gap-3 relative z-40">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerCascade(e);
                    }}
                    className={`flex-1 py-4 px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 relative z-50 cursor-pointer ${
                      isBroadcasting 
                        ? 'bg-pulse-orange text-snow hover:bg-orange-600 shadow-[0_0_20px_rgba(244,77,43,0.35)] hover:shadow-[0_0_25px_rgba(244,77,43,0.45)]'
                        : 'btn-primary text-snow'
                    }`}
                  >
                    <Flame size={15} />
                    <span>
                      {isBroadcasting 
                        ? "محاكاة خطوة إضافية لتعزيز الأداء والانتشار 📈" 
                        : "محاكاة إطلاق جدولة النشر والتفاعل الإبداعي 🗓️"
                      }
                    </span>
                  </button>

                  {isBroadcasting && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="bg-gray-dark/20 border border-gray-dark/40 p-4 rounded-xl text-gray-medium hover:text-snow hover:bg-gray-dark/40 transition-colors flex items-center justify-center gap-1.5 relative z-50 cursor-pointer"
                    >
                      <RotateCcw size={15} />
                      <span className="text-xs font-bold leading-none">إعادة محاكاة</span>
                    </button>
                  )}
                </div>

                <p className="text-[9.5px] text-center text-gray-medium/70 italic mt-3.5">
                  📊 نجاح المنصات والانتشار العضوي لا يولد بضغط صامت على زر، بل هو تدفق لخطوات مدروسة وتوليد محتوى بشري فائق الأناقة.
                </p>

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
              السوشال ميديا ليس مجرد جدول نشر
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              في AGMA، ندرك أن الربح في المنصات الاجتماعية لا يأتي من النشر العشوائي. الإدارة الحقيقية تبدأ من الفهم العميق لشخصية العلامة، دراسة الجمهور المستهدف بدقة، ثم تحويل ذلك إلى استراتيجية محتوى، تفاعل حيوي، وإدارة مجتمع ذكية تبني علاقة مستدامة مع العميل.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {socialServices.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="geometric-card group bg-gray-dark/10 p-8 lg:p-12 flex flex-col justify-between"
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
                    <span className="block text-[10px] text-gray-medium font-bold uppercase tracking-widest mb-1">باقاتنا</span>
                    <span className="text-xl font-bold text-snow">{service.price}</span>
                  </div>
                  <Link href="/contact" className="text-pulse-orange text-sm font-bold flex items-center gap-2 group/link">
                    اطلب الخدمة <ChevronLeft size={16} className="group-hover/link:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Voice Building */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-snow leading-tight">
                كيف نبني صوت <br />
                <span className="text-pulse-orange">علامتك التجارية؟</span>
              </h2>
              <p className="text-gray-medium text-lg leading-relaxed font-medium">
                الصوت الموحد هو سر الثقة. نحن نحدد كيف تتحدث علامتك ومع من، وبأي نغمة.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { label: 'شخصية العلامة', icon: Heart },
                  { label: 'نبرة الحديث', icon: MessageCircle },
                  { label: 'لغة الجمهور', icon: Users },
                  { label: 'الرسائل الرئيسية', icon: Target },
                  { label: 'أسلوب الردود', icon: MessageSquare },
                  { label: 'إدارة الأزمات', icon: ShieldAlert },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-snow font-bold">
                    <item.icon className="text-pulse-orange" size={20} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
               <div className="aspect-square bg-gray-dark/20 border border-gray-dark flex flex-col items-center justify-center p-8 text-center gap-6">
                  <div className="w-24 h-24 rounded-full border-2 border-pulse-orange flex items-center justify-center relative">
                     <Users className="text-pulse-orange" size={40} />
                     <div className="absolute -top-1 -right-1 w-6 h-6 bg-pulse-orange rounded-full flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-snow" />
                     </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-snow font-bold text-xl">بناء المجتمع الرقمي</h4>
                    <p className="text-gray-medium text-sm font-medium">نحن لا نجمع لايكات، نحن نصنع انتماء.</p>
                  </div>
                  <div className="flex gap-2">
                     <div className="w-12 h-1 bg-pulse-orange/20 rounded-full" />
                     <div className="w-24 h-1 bg-pulse-orange rounded-full shadow-[0_0_10px_rgba(255,102,0,0.5)]" />
                     <div className="w-12 h-1 bg-pulse-orange/20 rounded-full" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">ما الذي نديره؟</h2>
            <p className="text-gray-medium mt-4 font-medium">حضور قوي على المنصات التي يتواجد فيها عملاؤك فعلياً.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1">
            {platforms.map((platform, i) => (
              <div key={i} className="geometric-card bg-gray-dark/10 p-8 flex flex-col items-center justify-center gap-4 text-center group">
                 <platform.icon className="text-gray-medium transition-colors group-hover:text-pulse-orange" size={32} />
                 <span className="text-snow font-bold text-xs tracking-tight">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">أنواع المحتوى</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
             {contentTypes.map((type, i) => (
               <div key={i} className="px-8 py-4 border border-gray-dark bg-gray-dark/10 text-snow font-bold text-sm hover:border-pulse-orange transition-colors">
                  {type}
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
                حوّل حساباتك من واجهة صامتة <br />
                <span className="text-pulse-orange">إلى قناة نمو حقيقية.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نبني صوت علامتك الفريد، ونحوّله إلى حضور يومي واضح ومؤثر يحقق نتائج أعمال ملموسة.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                اطلب خطة سوشال ميديا
              </Link>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services/seo-content" className="hover:text-snow">السيو والمحتوى</Link>
                <Link href="/services/branding-creative" className="hover:text-snow">الهوية والتصميم</Link>
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
            "serviceType": "Social Media & Community Management",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "إدارة منصات التواصل الاجتماعي، التسويق عبر المؤثرين، وبناء الاستراتيجيات الرقمية في السعودية.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Social Media Services",
              "itemListElement": socialServices.map(s => ({
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
