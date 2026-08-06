'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  Tv, 
  Calendar, 
  CheckCircle2, 
  ChevronLeft,
  Users,
  ShieldCheck,
  Zap,
  Target,
  Share2,
  FileText,
  BarChart3,
  Camera,
  Newspaper,
  Radio,
  Globe,
  Award,
  Volume2,
  Sparkles,
  Check,
  Send,
  Atom
} from 'lucide-react';
import Link from 'next/link';

export default function PRMediaPage() {
  const [activeChannel, setActiveChannel] = React.useState<string>('regional-portals');
  const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([]);
  const [lastRippleTime, setLastRippleTime] = React.useState<number>(0);

  const mediaChannels = [
    {
      id: 'regional-portals',
      title: 'الصحف والمواقع الإقليمية الكبرى',
      subtitle: 'Regional Premium Portals',
      desc: 'قنوات الأخبار السعودية والعربية الرائدة مثل العربية نت، صحيفة عكاظ، الشرق الأوسط، والمواقع التقنية/الاقتصادية المؤثرة.',
      impact: 'وصول مباشر وفحص دقيق للرسالة يضمن لجمهورك وصناع القرار رؤية تحولات علامتك بمستويات مصداقية تفوق أي إعلان مدفوع.',
      highlightColor: 'emerald',
      accentColorHex: '#10b981',
      glowingShadow: 'shadow-emerald-950/20 shadow-lg border-emerald-500/25',
      accentText: 'text-emerald-400',
      icon: Newspaper,
      reach: '2.5M+ قارئ نشط شهرياً',
      credibility: '96% معامل موثوقية'
    },
    {
      id: 'global-economy',
      title: 'الصحافة الاقتصادية المتخصصة',
      subtitle: 'Premium Global Economics',
      desc: 'المنصات الاقتصادية والاستثمارية الرصينة كـ بلومبرغ الشرق، Forbes Middle East، وأرقام المالية.',
      impact: 'تسليط الضوء باحترافية على جولاتك الاستثمارية، خطط التوسع، أو ابتكاراتك لتلفت انتباه الشركاء الماليين والصناديق الاستثمارية.',
      highlightColor: 'cyan',
      accentColorHex: '#00f3ff',
      glowingShadow: 'shadow-cyan-950/20 shadow-lg border-cyan-500/25',
      accentText: 'text-cyan-400',
      icon: Globe,
      reach: '500K+ مستثمر ومحلل',
      credibility: '98% لمعان العلامة الاستثمارية'
    },
    {
      id: 'digital-podcasts',
      title: 'البودكاست والمنصات الحوارية المؤثرة',
      subtitle: 'Elite Digital Podcasts',
      desc: 'الاستضافة في النوافذ الحوارية والمقابلات الفكرية في السعودية والخليج (مثل بودكاست فنجان، ثمانية، والمنصات الصاعدة).',
      impact: 'صياغة الـ Storytelling المؤسسية، حيث يتحدث المؤسسون عن رؤيتهم وفلسفتهم، مما يخلق ارتباطاً وجدانياً وثقة مطلقة مع الجمهور.',
      highlightColor: 'orange',
      accentColorHex: '#ff6100',
      glowingShadow: 'shadow-orange-950/20 shadow-lg border-pulse-orange/25',
      accentText: 'text-pulse-orange',
      icon: Radio,
      reach: '1.2M+ مستمع مخلص',
      credibility: '94% ارتباط وجداني عميق'
    },
    {
      id: 'community-amplification',
      title: 'موجات التأثير وقادة الفكر (KOLs)',
      subtitle: 'Social PR Amplification',
      desc: 'تنشيط الحوارات والنقاشات المهنية عبر قادة الفكر على LinkedIn، والمؤثرين التقنيين وصناع المحتوى المتخصص.',
      impact: 'صناعة حوارات إيجابية مستدامة تحيط بإنتاجات علامتك الجديدة وتجعلها في صدارة التريندات والنقاشات المهنية لأسابيع.',
      highlightColor: 'purple',
      accentColorHex: '#a855f7',
      glowingShadow: 'shadow-purple-950/20 shadow-lg border-purple-500/25',
      accentText: 'text-purple-400',
      icon: Volume2,
      reach: '3M+ تفاعل ممتد',
      credibility: '88% صدى وتأثير في اتخاذ القرار'
    }
  ];

  const triggerCentralPulse = () => {
    const now = Date.now();
    // Throttle ripples just slightly for performance
    if (now - lastRippleTime < 300) return;
    setLastRippleTime(now);

    const newRipple = {
      id: now,
      x: 0,
      y: 0
    };
    setRipples((prev) => [...prev.slice(-4), newRipple]); // Keep max 5 ripples around
  };

  const getWhatsAppPRUrl = () => {
    const channel = mediaChannels.find(c => c.id === activeChannel) || mediaChannels[0];
    const text = `أهلاً فريق جيل الذكاء الاصطناعي (AI Generation) 👋

أود مناقشة خطة تفعيل العلاقات العامة وصناعة الصدى الإعلامي لعلامتي التجارية:

📢 المسار المستهدف للصوت والصدى: ${channel.title} (${channel.subtitle})
🎯 مدى الوصول المتوقع للمسار: ${channel.reach}
🔬 مؤشر الموثوقية: ${channel.credibility}

يرجى جدولة جلسة عصف ذهني أولى لمناقشة صياغة البيان الصحفي وتنسيق الظهور الإعلامي الفائز 🚀`;

    return `https://wa.me/966581195387?text=${encodeURIComponent(text)}`;
  };

  const prServices = [
    {
      title: 'العلاقات العامة وإدارة الإعلام',
      subtitle: 'PR & Media Relations',
      desc: 'بناء علاقات إعلامية، إعداد وتوزيع بيانات صحفية، إدارة الرسائل، وتعزيز حضور العلامة في القنوات المناسبة.',
      icon: Megaphone,
    },
    {
      title: 'الشراء الإعلامي',
      subtitle: 'Media Buying',
      desc: 'حضور مدروس في الإعلام التقليدي والرقمي، اللوحات الخارجية، الراديو، والمنصات المناسبة حسب هدف الحملة.',
      icon: Tv,
    },
    {
      title: 'تسويق الفعاليات والتفعيلات',
      subtitle: 'Event Marketing & Activations',
      desc: 'تخطيط وتسويق وتغطية الفعاليات، المعارض، والتفعيلات الميدانية قبل وأثناء وبعد الحدث.',
      icon: Calendar,
    }
  ];

  const methodologySteps = [
    { title: 'تحديد الرسائل', icon: FileText },
    { title: 'اختيار القنوات', icon: Target },
    { title: 'تجهيز المواد الإعلامية', icon: Camera },
    { title: 'إدارة النشر', icon: Megaphone },
    { title: 'تغطية الحدث', icon: Share2 },
    { title: 'قياس الأثر', icon: BarChart3 },
    { title: 'تقرير ختامي', icon: FileText }
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
              PR & Media
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] text-snow max-w-4xl mx-auto">
              نوصل صوتك. <br />
              <span className="text-pulse-orange">بدقة.</span>
            </h1>
            <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              علاقات عامة، حضور إعلامي، شراء إعلاني، وتفعيل للفعاليات — لنمنح علامتك صوتاً واضحاً في القنوات الصحيحة.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4">
                اطلب خطة إعلامية
              </Link>
              <Link href="/contact" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4">
                 تواصل معنا
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why PR is important */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-snow animate-fade-in">
              لماذا العلاقات العامة مهمة؟
            </h2>
            <p className="text-gray-medium text-lg lg:text-xl leading-relaxed font-medium">
              العلاقات العامة لا تعني الظهور الإعلامي فحسب، بل هي فن بناء الثقة المستدامة وإدارة الرسائل الاستراتيجية. في جيل الذكاء الاصطناعي، نساعد العلامات على حماية سمعتها، وتوسيع حضورها في اللحظات المفصلية، وضمان أن تصل رسالتها للجمهور الصحيح في الوقت الصحيح وبالنبرة التي تخدم أهدافها المؤسسية.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AMPLIFICATION WAVE SIMULATOR */}
      <section className="py-24 px-6 relative bg-gradient-to-b from-pure-ink via-neutral-900/45 to-pure-ink overflow-hidden border-b border-gray-dark/10">
        <div className="grid-pattern opacity-[0.03]" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-purple-500/25 rounded-full bg-purple-500/5 text-purple-400 text-[10px] font-bold uppercase tracking-widest font-mono">
              <Sparkles size={11} className="animate-pulse text-purple-400" />
              تفاعل المحاكاة: نبضات العلاقات العامة والانتشار
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-snow tracking-tight leading-tight">
              ممحاة الضجيج وموجة تكبير السمعة والصدى
            </h2>
            <p className="text-gray-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              انقر على نواة <strong className="text-snow">«علامتك»</strong> في المنتصف لتصنع موجات صدى ارتدادية تفاعلية ترتطم مباشرةً بالمحافل الصحفية ومراكز الأخبار وصناع القرار الإقليميين وترفع قيمتك السوقية فوراً.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* LEFT COLUMN: INTERACTIVE VISUAL INFOGRAPHIC MAP */}
            <div className="lg:col-span-8 bg-neutral-950/80 border border-white/5 p-6 sm:p-10 rounded-3xl relative min-h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl">
              
              {/* Radial Connective Wave Board (Highly Styled) */}
              <div className="relative w-full h-[320px] flex items-center justify-center">
                
                {/* Embedded ripples mapping */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  {ripples.map((rip) => {
                    const activeChanData = mediaChannels.find(c => c.id === activeChannel) || mediaChannels[0];
                    const activeColor = activeChanData.accentColorHex;
                    return (
                      <motion.div
                        key={rip.id}
                        initial={{ scale: 0.1, opacity: 0.9 }}
                        animate={{ scale: 3.0, opacity: 0 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                        onAnimationComplete={() => {
                          setRipples((prev) => prev.filter((r) => r.id !== rip.id));
                        }}
                        className="absolute rounded-full border pointer-events-none"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderColor: activeColor,
                          boxShadow: `0 0 15px ${activeColor}10`
                        }}
                      />
                    );
                  })}
                </div>

                {/* CENTRAL POWER HUB: YOUR BRAND SOURCE (التصميم: منبع دائري مركزي ينبض بشعار علامتك) */}
                <div className="relative z-20">
                  <motion.div 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={triggerCentralPulse}
                    className="w-24 h-24 rounded-full bg-black border border-white/10 flex flex-col items-center justify-center cursor-pointer shadow-xl relative group"
                  >
                    {/* Concentric ambient background pulses */}
                    <div className="absolute -inset-2 bg-gradient-to-tr from-pulse-orange/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-pulse" />
                    <div className="absolute inset-0.5 rounded-full bg-neutral-900 border border-white/5 flex flex-col items-center justify-center z-10">
                      <Atom size={20} className="text-pulse-orange animate-spin-slow mb-1" />
                      <span className="text-[11px] font-black text-snow tracking-wider font-sans">علامتك</span>
                      <span className="text-[7.5px] font-mono text-gray-medium/60 uppercase group-hover:text-pulse-orange tracking-widest">[انقر لبث الصدى]</span>
                    </div>
                  </motion.div>
                </div>

                {/* SATELLITE TARGETS: SPREAD OUT CIRCULAR NODES */}
                {mediaChannels.map((channel, idx) => {
                  const isActive = activeChannel === channel.id;
                  const isEmerald = channel.id === 'regional-portals';
                  const isCyan = channel.id === 'global-economy';
                  const isOrange = channel.id === 'digital-podcasts';
                  const isPurple = channel.id === 'community-amplification';

                  // Symmetrical positions surrounding central brand
                  let positionClasses = "";
                  if (isEmerald) positionClasses = "-translate-y-24 -translate-x-24 sm:-translate-x-32";
                  if (isCyan) positionClasses = "-translate-y-24 translate-x-24 sm:translate-x-32";
                  if (isOrange) positionClasses = "translate-y-24 -translate-x-24 sm:-translate-x-32";
                  if (isPurple) positionClasses = "translate-y-24 translate-x-24 sm:translate-x-32";

                  const TargetIcon = channel.icon;

                  return (
                    <motion.div
                      key={channel.id}
                      onClick={() => {
                        setActiveChannel(channel.id);
                        triggerCentralPulse();
                      }}
                      whileHover={{ scale: 1.1 }}
                      className={`absolute w-12 sm:w-14 h-12 sm:h-14 rounded-2xl flex items-center justify-center cursor-pointer z-30 transition-all duration-300 ${positionClasses} ${
                        isActive 
                          ? `${channel.glowingShadow} bg-black ring-1` 
                          : 'border border-white/5 bg-neutral-900/40 hover:border-white/25'
                      }`}
                      style={{ 
                        borderColor: isActive ? channel.accentColorHex : 'rgba(255,255,255,0.05)',
                        boxShadow: isActive ? `0 0 20px ${channel.accentColorHex}15` : 'none'
                      }}
                    >
                      <TargetIcon 
                        size={18} 
                        style={{ color: isActive ? channel.accentColorHex : 'rgba(255,255,255,0.3)' }}
                        className={isActive ? 'animate-bounce' : ''}
                      />
                      
                      {/* Responsive tag helper above satellite */}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8.5px] sm:text-[9.5px] font-bold text-gray-medium max-w-[90px] text-center overflow-hidden text-ellipsis">
                        {channel.title.split(' ')[0]}
                      </span>
                    </motion.div>
                  );
                })}

                {/* SVG CONNECTION GRAPHICS FOR LASER PULSES (DESKTOP) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 hidden sm:block">
                  <line x1="50%" y1="50%" x2="25%" y2="25%" stroke={activeChannel === 'regional-portals' ? '#10b981' : 'rgba(255,255,255,0.03)'} strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="50%" y1="50%" x2="75%" y2="25%" stroke={activeChannel === 'global-economy' ? '#00f3ff' : 'rgba(255,255,255,0.03)'} strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="50%" y1="50%" x2="25%" y2="75%" stroke={activeChannel === 'digital-podcasts' ? '#ff6100' : 'rgba(255,255,255,0.03)'} strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="50%" y1="50%" x2="75%" y2="75%" stroke={activeChannel === 'community-amplification' ? '#a855f7' : 'rgba(255,255,255,0.03)'} strokeWidth="1" strokeDasharray="3 3" />
                </svg>

              </div>

              {/* CONSOLE STATUS STATS (تأثير الهاتف: طابع ريادي وعالي الجودة) */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.04] pt-5 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-gray-medium/60 font-mono uppercase tracking-widest">[WAVE_AMPLITUDE_STABLE]</span>
                </div>
                <div className="text-xs text-gray-medium/80 flex items-center gap-2">
                  <span>تم التموضع في:</span>
                  <span className="font-extrabold text-snow underline decoration-pulse-orange/30">المملكة العربية السعودية وباقي دول الخليج 🇸🇦</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: DETAIL DECODER CARD */}
            <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
              {(() => {
                const currentChannel = mediaChannels.find(c => c.id === activeChannel) || mediaChannels[0];
                return (
                  <motion.div
                    key={currentChannel.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 sm:p-8 rounded-3xl bg-white/[0.01] border border-white/5 space-y-6 flex flex-col justify-between h-full"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[9px] uppercase font-mono px-2.5 py-1 rounded-full text-black font-extrabold"
                          style={{ backgroundColor: currentChannel.accentColorHex }}
                        >
                          {currentChannel.subtitle}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-snow leading-tight">
                        {currentChannel.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-medium leading-relaxed">
                        {currentChannel.desc}
                      </p>

                      <div className="p-4 rounded-xl bg-black/60 border border-white/[0.03] space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-medium/70">الوصول التقديري المستهدف:</span>
                          <strong className="text-snow font-mono">{currentChannel.reach}</strong>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-white/[0.03] pt-2.5">
                          <span className="text-gray-medium/70">معامل مصداقية الظهور:</span>
                          <strong className="text-snow" style={{ color: currentChannel.accentColorHex }}>{currentChannel.credibility}</strong>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono text-gray-medium/40 block">الصدى والأثر الإعلامي المحقق (Impact):</span>
                        <p className="text-xs text-gray-medium leading-relaxed font-sans bg-white/[0.01] border border-white/[0.02] p-3 rounded-lg">
                          {currentChannel.impact}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href={getWhatsAppPRUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 text-xs font-black text-black rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all cursor-pointer border-none"
                        style={{ 
                          backgroundColor: currentChannel.accentColorHex,
                          boxShadow: `0 8px 24px ${currentChannel.accentColorHex}25`
                        }}
                      >
                        <span>أطلق بيان السمعة والصدى في هذا المسار</span>
                        <Send size={12} className="shrink-0" />
                      </motion.a>
                      <span className="text-[9px] text-gray-medium/40 font-mono text-center block">
                        [ZERO_AD_WASTE_ORGANIC_CREDIBILITY_GUARANTEED]
                      </span>
                    </div>
                  </motion.div>
                );
              })()}
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
            {prServices.map((service, i) => (
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

      {/* When do you need this service? */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">متى تحتاج هذه الخدمة؟</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { title: 'إطلاق علامة جديدة', icon: Zap },
              { title: 'إطلاق منتج', icon: Target },
              { title: 'دخول سوق جديد', icon: Share2 },
              { title: 'إدارة سمعة', icon: ShieldCheck },
              { title: 'حملة توعية', icon: Megaphone },
              { title: 'فعالية أو معرض', icon: Calendar },
              { title: 'توسع مؤسسي', icon: Users },
            ].map((item, i) => (
              <div key={i} className="geometric-card bg-gray-dark/5 p-8 flex flex-col items-center justify-center gap-4 text-center group">
                 <item.icon className="text-pulse-orange" size={24} />
                 <span className="text-snow font-bold text-sm tracking-tight">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we work? (Methodology) */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow">كيف نعمل؟</h2>
            <p className="text-gray-medium mt-4 font-medium">مسار منظم يضمن وصول رسالتك بأفضل صورة ممكنة.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
             {methodologySteps.map((step, i) => (
               <div key={i} className="space-y-4 border-r border-gray-dark pr-6">
                  <span className="text-pulse-orange font-mono font-bold text-xs">PHASE 0{i+1}</span>
                  <div className="flex items-center gap-3">
                    <step.icon className="text-gray-medium" size={20} />
                    <h4 className="text-snow font-bold text-sm">{step.title}</h4>
                  </div>
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
                الحضور الإعلامي <br />
                <span className="text-pulse-orange">لا يحدث بالصدفة.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نبني رسالة واضحة، ونوصلها للجمهور الصحيح عبر القنوات المناسبة.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                اطلب خطة إعلامية
              </Link>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services/branding-creative" className="hover:text-snow">الهوية والتصميم</Link>
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
            "serviceType": "PR & Media",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "خدمات العلاقات العامة، الشراء الإعلامي، وتسويق الفعاليات في المملكة العربية السعودية.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "PR Services",
              "itemListElement": prServices.map(s => ({
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
