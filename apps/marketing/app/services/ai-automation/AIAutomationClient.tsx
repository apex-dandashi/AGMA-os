'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  Bot, 
  Workflow, 
  Database, 
  LineChart, 
  ShieldCheck, 
  MessagesSquare, 
  Sparkles, 
  ChevronLeft,
  Settings,
  Repeat,
  CheckCircle2,
  Users
} from 'lucide-react';
import Link from 'next/link';

const aiServices = [
  {
    title: 'أتمتة العمليات (Workflow)',
    subtitle: 'Process Automation',
    desc: 'ربط الأنظمة وتلقائية المهام المتكررة لتقليل الخطأ البشري وزيادة سرعة التنفيذ.',
    price: 'عرض مخصص حسب التعقيد',
    icon: Workflow,
  },
  {
    title: 'بناء وكلاء AI متخصصين',
    subtitle: 'Custom AI Agents',
    desc: 'تطوير وكلاء ذكاء اصطناعي لخدمة العملاء، المبيعات، أو تحليل البيانات داخل مؤسستك.',
    price: 'يبدأ من 7,500 ر.س',
    icon: Bot,
  },
  {
    title: 'دمج نماذج LLM',
    subtitle: 'LLM Integration',
    desc: 'دمج GPT-4, Gemini، أو Claude في منتجاتك الرقمية الحالية لتقديم تجربة أذكى.',
    price: 'عرض مخصص',
    icon: Sparkles,
  },
  {
    title: 'استشارات التحول للـ AI',
    subtitle: 'AI Strategy Consulting',
    desc: 'تحليل أعمالك واكتشاف أين يمكن للذكاء الاصطناعي توفير المال أو زيادة الأرباح.',
    price: 'يبدأ من 3,500 ر.س للجلسة',
    icon: Settings,
  }
];

const efficiencyStats = [
  { label: 'تقليل التكاليف التشغيلية', value: '40%', icon: Zap },
  { label: 'زيادة سرعة معالجة البيانات', value: '10x', icon: Cpu },
  { label: 'تقليل الخطأ البشري', value: '95%', icon: ShieldCheck },
  { label: 'توافر الخدمة (24/7)', value: '100%', icon: Bot },
];

export default function AIAutomationClient() {
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [kpiScore, setKpiScore] = React.useState<number>(1482);
  const [speedMetric, setSpeedMetric] = React.useState<string>("—");
  const [accuracyMetric, setAccuracyMetric] = React.useState<string>("—");
  const [processLogs, setProcessLogs] = React.useState<React.ReactNode[]>([]);

  const runSimulation = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveStep(1);
    setProcessLogs([
      <span key="step-1">📥 تم استقبال طلب عميل جديد وتلقي البيانات...</span>
    ]);
    setSpeedMetric("معالجة فورية...");
    setAccuracyMetric("الفرز...");

    // Step 2 AI Analysis
    setTimeout(() => {
      setActiveStep(2);
      setProcessLogs(prev => [
        ...prev,
        <span key="step-2">🤖 محلل الذكاء للفرز: العميل مهتم بمستقبل الأتمتة والميزانية مثالية ⚡</span>
      ]);
      setAccuracyMetric("99.4%");
    }, 1500);

    // Step 3 Integration & CRM Send
    setTimeout(() => {
      setActiveStep(3);
      setProcessLogs(prev => [
        ...prev,
        <span key="step-3">
          📊 تم تحديث CRM التوجيه وبث إشعار واتساب فوري برقم{" "}
          <span dir="ltr" className="inline-block font-sans font-bold text-pulse-orange">+966 58 119 5387</span>
        </span>
      ]);
    }, 3000);

    // Done Success
    setTimeout(() => {
      setActiveStep(4);
      setProcessLogs(prev => [
        ...prev,
        <span key="step-4">
          ✅ تم تحويل وتصنيف وتنبيه المبيعات بالكامل بنجاح في{" "}
          <span className="font-sans font-bold text-pulse-orange">0.8</span> ثانية!
        </span>
      ]);
      setSpeedMetric("0.8s ✨");
      setKpiScore(prev => prev + 1);
      setIsPlaying(false);
    }, 4500);
  };

  const handleNodeClick = (node: string) => {
    setSelectedNode(node);
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
            <div className="lg:col-span-6 space-y-8 text-right">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block px-4 py-1 mb-6 border border-pulse-orange/30 rounded-full bg-pulse-orange/5 text-pulse-orange text-xs font-bold tracking-widest uppercase font-mono">
                  Interactive Flow Sync Reactor
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black mb-6 leading-tight text-snow">
                  لا تعمل بجهد أكبر. <br />
                  <span className="text-pulse-orange">اعمل بأذكى (وبآلية).</span>
                </h1>
                <p className="text-gray-medium text-base sm:text-lg lg:text-xl mb-10 leading-relaxed font-medium">
                  نحن نبني البنية التحتية لجيل الذكاء الاصطناعي — أتمتة مهامك، ذكاء عملياتك، ورفع كفاءة فريقك باستخدام مفاعلات أتمتة ذكية تفاعلية بالكامل.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/contact" className="btn-primary w-full sm:w-auto text-lg px-10 py-4 text-center">
                    ابدأ رحلة الأتمتة
                  </Link>
                  <Link href="/agma-method" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4 text-center">
                    اكتشف كيف نعمل
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Left Column: Interactive Flow Sync Reactor */}
            <div className="lg:col-span-6 w-full relative z-10">
              <div className="bg-gray-dark/15 border border-gray-dark/40 p-5 sm:p-8 rounded-3xl relative backdrop-blur-md overflow-hidden shadow-2xl ring-1 ring-white/5 group">
                {/* Abstract background glow */}
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-pulse-orange/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-10 left-1/4 w-64 h-64 bg-deep-navy/20 rounded-full blur-[80px] pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-dark/40">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-pulse-orange animate-pulse" />
                    <h3 className="text-sm font-bold text-snow">مفاعل أتمتة تدفق العمليات التفاعلي</h3>
                  </div>
                  <span className="text-[9px] font-mono text-gray-medium border border-gray-dark px-2 py-0.5 rounded bg-gray-dark/20 uppercase tracking-wider">
                    Flow Sync Reactor v1.2
                  </span>
                </div>

                {/* Nodes Display */}
                <div className="grid grid-cols-3 gap-3 relative mb-10 mt-12 py-4">
                  
                  {/* Connective Line SVG */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-0">
                    <svg className="w-full h-8 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Base line from Node 1 (16.66%) to Node 3 (83.33%) */}
                      <line x1="16.66%" y1="16" x2="83.33%" y2="16" className="stroke-gray-dark/30" strokeWidth="3" strokeDasharray="6 6" />
                      
                      {/* Active running step animations */}
                      {isPlaying && (
                        <motion.line 
                          x1="16.66%" y1="16" x2="83.33%" y2="16"
                          className="stroke-pulse-orange"
                          strokeWidth="3"
                          strokeDasharray="15 15"
                          animate={{ strokeDashoffset: [-120, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                      )}
                    </svg>
                  </div>

                  {/* Step 1: Client Data */}
                  <div className="flex flex-col items-center z-10">
                    <button 
                      type="button"
                      onClick={() => handleNodeClick('data')}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                        activeStep >= 1 ? 'bg-pulse-orange text-snow shadow-[0_0_25px_rgba(244,77,43,0.35)] border-2 border-snow' : 'bg-gray-dark/40 text-gray-medium hover:bg-gray-dark/60 border border-gray-dark/50'
                      }`}
                    >
                      <Users size={24} />
                      {activeStep === 1 && (
                        <span className="absolute inset-0 rounded-full border-4 border-pulse-orange animate-ping opacity-75" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-snow mt-3">بيانات العميل</span>
                    <span className="text-[9px] text-gray-medium mt-1">مدخلات المهام</span>
                  </div>

                  {/* Step 2: AI Bot Router */}
                  <div className="flex flex-col items-center z-10">
                    <button 
                      type="button"
                      onClick={() => handleNodeClick('ai')}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                        activeStep >= 2 ? 'bg-pulse-orange text-snow shadow-[0_0_35px_rgba(244,77,43,0.5)] border-2 border-snow animate-pulse' : 'bg-gray-dark/40 text-gray-medium hover:bg-gray-dark/60 border border-gray-dark/50'
                      }`}
                    >
                      <Bot size={24} className={activeStep === 2 ? 'animate-spin-slow' : ''} />
                      {activeStep === 2 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pulse-orange opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-pulse-orange"></span>
                        </span>
                      )}
                    </button>
                    <span className="text-xs font-bold text-snow mt-3">وكيل AI للفرز</span>
                    <span className="text-[9px] text-gray-medium mt-1">الذكاء والتنظيم</span>
                  </div>

                  {/* Step 3: Sales CRM Route */}
                  <div className="flex flex-col items-center z-10">
                    <button 
                      type="button"
                      onClick={() => handleNodeClick('sales')}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                        activeStep >= 3 ? 'bg-green-500 text-snow shadow-[0_0_25px_rgba(34,197,94,0.35)] border-2 border-snow' : 'bg-gray-dark/40 text-gray-medium hover:bg-gray-dark/60 border border-gray-dark/50'
                      }`}
                    >
                      <Zap size={24} />
                      {activeStep === 3 && (
                        <span className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-snow mt-3">توجيه المبيعات</span>
                    <span className="text-[9px] text-gray-medium mt-1">أتمتة فورية</span>
                  </div>

                </div>

                {/* Tactical Node Info Cards */}
                <AnimatePresence mode="wait">
                  {selectedNode && (
                    <motion.div
                      key={selectedNode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-pure-ink/90 border border-pulse-orange/30 rounded-2xl p-4 mb-6 text-right relative"
                    >
                      <button 
                        type="button"
                        onClick={() => setSelectedNode(null)}
                        className="absolute top-3 left-3 text-gray-medium hover:text-snow text-xs font-bold"
                      >
                        إغلاق ✕
                      </button>
                      <h4 className="text-xs font-bold text-pulse-orange uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span>💡 تفاصيل وحدة التدفق التفاعلي</span>
                      </h4>
                      {selectedNode === 'data' && (
                        <p className="text-xs text-gray-medium leading-relaxed font-semibold">
                          <strong className="text-snow">وحدة استقبال البيانات:</strong> يتم تجميع وقراءة استفسارات ومقترحات وبيانات العملاء تلقائياً من النماذج ومختلف القنوات والمواقع فور إرسالها.
                        </p>
                      )}
                      {selectedNode === 'ai' && (
                        <p className="text-xs text-gray-medium leading-relaxed font-semibold">
                          <strong className="text-snow">مستشعر الذكاء الاصطناعي الفوري:</strong> يُصنف ويحلل محتوى الاستفسار ونية المشتري بدقة متناهية واستخراج حجم العمل لتوجيه مناسب.
                        </p>
                      )}
                      {selectedNode === 'sales' && (
                        <p className="text-xs text-gray-medium leading-relaxed font-semibold">
                          <strong className="text-snow">التوصيل وبث الرد:</strong> يرسل آلياً وبشكل حاسب بيانات ومؤشرات العميل للـ CRM مع إجابة فورية مخصصة عبر واتساب والبريد.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live Output Logs Console */}
                <div className="bg-pure-ink border border-gray-dark/50 rounded-2xl p-4 h-36 flex flex-col justify-end overflow-hidden mb-6 relative">
                  <div className="absolute top-2 left-3 text-[8px] font-mono text-gray-medium select-none z-10 uppercase tracking-widest">
                    Flow Status / logs
                  </div>
                  <div className="space-y-1.5 text-right font-mono text-xs max-h-full overflow-y-auto">
                    {processLogs.length === 0 ? (
                      <div className="text-gray-medium/50 h-full flex items-center justify-center italic text-center text-[10px] leading-relaxed">
                        انقر على زر &quot;شغّل أتمتة حية&quot; أدناه لمشاهدة المفاعل وهو يعمل مباشرة ⚡
                      </div>
                    ) : (
                      processLogs.map((log, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-start gap-2 ${i === processLogs.length - 1 ? 'text-pulse-orange font-bold' : 'text-gray-light'}`}
                        >
                          <span className="text-pulse-orange font-bold font-sans">⚡</span>
                          <span className="font-semibold text-[11px] leading-relaxed">{log}</span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Live Real-time Dashboard KPIs inside the widget */}
                <div className="grid grid-cols-3 gap-2 border-t border-gray-dark/40 pt-6">
                  
                  <div className="bg-gray-dark/15 p-3 rounded-xl border border-gray-dark/30 text-center">
                    <div className="text-[8px] sm:text-[9px] text-gray-medium font-bold uppercase tracking-wider mb-1">سرعة الاستجابة</div>
                    <div className="text-[11px] sm:text-xs font-bold text-snow">
                      {speedMetric}
                    </div>
                  </div>

                  <div className="bg-gray-dark/15 p-3 rounded-xl border border-gray-dark/30 text-center">
                    <div className="text-[8px] sm:text-[9px] text-gray-medium font-bold uppercase tracking-wider mb-1">نسبة دقة الفرز</div>
                    <div className="text-[11px] sm:text-xs font-bold text-snow">
                      {accuracyMetric}
                    </div>
                  </div>

                  <div className="bg-gray-dark/15 p-3 rounded-xl border border-gray-dark/30 text-center">
                    <div className="text-[8px] sm:text-[9px] text-gray-medium font-bold uppercase tracking-wider mb-1">المهام المؤتمتة</div>
                    <div className="text-xs sm:text-sm font-extrabold text-pulse-orange">
                      {kpiScore}
                    </div>
                  </div>

                </div>

                {/* Run Automation triggers */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={runSimulation}
                    disabled={isPlaying}
                    className="flex-grow btn-primary py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                  >
                    <span>شغّل أتمتة حية</span>
                    <Sparkles size={16} className="group-hover/btn:rotate-12 transition-transform" />
                  </button>
                </div>

                {/* Phone hint trigger */}
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-gray-medium italic">
                    📱 انقر على أي أيقونة لاستكشاف كيف تعمل الأتمتة والذكاء الاصطناعي
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Efficiency Grid */}
      <section className="py-24 px-6 border-y border-gray-dark bg-gray-dark/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {efficiencyStats.map((stat, i) => (
              <div key={i} className="text-center space-y-4 p-8 border border-gray-dark/50 bg-gray-dark/10 group hover:border-pulse-orange/50 transition-colors">
                <stat.icon className="text-pulse-orange mx-auto mb-4" size={32} />
                <div className="text-4xl lg:text-5xl font-bold text-snow">{stat.value}</div>
                <div className="text-xs text-gray-medium font-bold uppercase tracking-widest leading-relaxed">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core AI Services */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-snow font-heading">
              خدمات جيل <span className="text-pulse-orange">الذكاء الاصطناعي</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {aiServices.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="geometric-card group bg-gray-dark/10 p-8 lg:p-12 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-pulse-orange/10 rounded-sm flex items-center justify-center text-pulse-orange transition-colors group-hover:bg-pulse-orange group-hover:text-snow">
                    <service.icon size={28} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest font-mono">{service.subtitle}</span>
                    <h3 className="text-2xl lg:text-3xl font-bold text-snow font-heading">{service.title}</h3>
                  </div>
                  <p className="text-gray-medium text-lg leading-relaxed font-medium">
                    {service.desc}
                  </p>
                </div>
                <div className="pt-8 mt-8 border-t border-gray-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] text-gray-medium font-bold uppercase tracking-widest mb-1">الاستثمار المتوقع</span>
                    <span className="text-xl font-bold text-snow">{service.price}</span>
                  </div>
                  <Link href="/contact" className="text-pulse-orange text-sm font-bold flex items-center gap-2 group/link">
                    ناقش مشروعك <ChevronLeft size={16} className="group-hover/link:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Philosophy */}
      <section className="py-24 px-6 border-y border-gray-dark bg-deep-navy/10 relative overflow-hidden">
        <div className="grid-pattern opacity-[0.02]" />
        <div className="container mx-auto relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-6xl font-bold text-snow">
              الـ AI هو محركك، <br />
              <span className="text-pulse-orange">والأتمتة هي الطريق.</span>
            </h2>
            <p className="text-gray-medium text-xl leading-relaxed font-medium">
              نحن لا نبيع أدوات، نحن نبني منظومات ذكية. فرق العمل اليوم تغرق في المهام اليدوية التي يسهل على الآلة القيام بها بشكل أدق وأسرع. مهمتنا في AGMA هي تحرير فريقك من &quot;التنفيذ الممل&quot; ليتفرغوا لـ &quot;التفكير الإبداعي&quot;.
            </p>
            <div className="flex flex-wrap justify-center gap-4 py-8">
               {['OpenAI', 'Anthropic', 'Google Cloud', 'Zapier', 'Make', 'Pinecone', 'LangChain'].map((tech) => (
                 <span key={tech} className="px-4 py-2 border border-gray-dark bg-gray-dark/5 text-gray-light text-xs font-bold uppercase tracking-widest">{tech}</span>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integration Process */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-snow leading-tight font-heading">
                كيف ندمج الـ AI <br />
                <span className="text-pulse-orange">في بيئة عملك؟</span>
              </h2>
              <div className="space-y-6">
                {[
                  { title: 'تحليل الفجوات', desc: 'تحديد العمليات المهدرة للوقت والمهام القابلة للأتمتة.' },
                  { title: 'تصميم البنية', desc: 'اختيار النماذج والأدوات الأمثل (GPT, Claude, Gemini...).' },
                  { title: 'التطوير والاختبار', desc: 'بناء الوكلاء والربط البرمجي وضمان دمج البيانات.' },
                  { title: 'التدريب والتشغيل', desc: 'تدريب فريقك على التعامل مع المنظومة الجديدة ورفع الكفاءة.' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 p-6 border border-gray-dark bg-gray-dark/5 group hover:border-pulse-orange/30 transition-colors">
                    <div className="text-2xl font-bold text-pulse-orange font-mono">0{i+1}</div>
                    <div className="space-y-2">
                       <h4 className="text-snow font-bold text-lg">{step.title}</h4>
                       <p className="text-gray-medium text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
                <div className="aspect-square bg-gray-dark/20 border border-gray-dark relative flex items-center justify-center p-12">
                   <div className="grid-pattern opacity-[0.05]" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-3/4 h-3/4 border border-pulse-orange/20 rounded-full animate-spin-slow opacity-30" />
                   </div>
                   <div className="space-y-6 text-center z-10">
                      <div className="w-20 h-20 bg-pulse-orange rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(244,77,43,0.3)] group-hover:scale-110 transition-transform">
                         <Zap className="text-snow" size={32} />
                      </div>
                      <h4 className="text-snow font-bold text-xl uppercase tracking-tighter">Hyper-Efficiency</h4>
                      <p className="text-gray-medium text-xs font-bold font-mono tracking-widest">Optimized for AI-First Era</p>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="border border-gray-dark p-12 lg:p-20 text-center relative overflow-hidden bg-gray-dark/5">
            <div className="grid-pattern opacity-[0.03]" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 text-snow leading-tight font-heading">
                مستقبل عملك يبدأ <br />
                <span className="text-pulse-orange">بأول عملية مؤتمتة.</span>
              </h2>
              <p className="text-gray-medium text-lg lg:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                دعنا نجلس لنحلل أين تضيع ساعات فريقك اليوم، ونبني لك البنية التحتية التي تضاعف إنتاجيتك دون الحاجة لمزيد من التوظيف.
              </p>
              <Link href="/contact" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-pulse-orange/20">
                اطلب استشارة أتمتة مجانية
              </Link>
              <div className="mt-8 flex justify-center gap-8 text-xs text-gray-medium font-bold uppercase tracking-widest">
                <Link href="/services/strategy-consulting" className="hover:text-snow">الاستشارات</Link>
                <Link href="/services/web-digital" className="hover:text-snow">الويب والمنتجات</Link>
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
            "serviceType": "AI & Workflow Automation",
            "provider": {
              "@type": "AdvertisingAgency",
              "name": "AGMA | وكالة جيل الذكاء الاصطناعي"
            },
            "description": "حلول أتمتة العمليات ودمج الذكاء الاصطناعي وكلاء الذكاء الاصطناعي المخصصة للشركات.",
            "areaServed": "SA",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "AI Services",
              "itemListElement": aiServices.map(s => ({
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
