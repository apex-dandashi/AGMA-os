'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Briefcase, 
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
  Globe,
  Palette,
  BarChart,
  Megaphone,
  Search,
  Cpu,
  Clock,
  Lightbulb,
  Code
} from 'lucide-react';
import Magnetic from './ui/Magnetic';
import Tilt from './ui/Tilt';

const services = [
  { 
    id: 'ai', 
    title: 'الذكاء الاصطناعي', 
    icon: Cpu, 
    desc: 'أتمتة العمليات ودمج الحلول الذكية',
    subServices: ['أتمتة العمليات (RPA)', 'روبوتات المحادثة الذكية', 'تحليل البيانات المتقدم', 'توقعات الذكاء الاصطناعي']
  },
  { 
    id: 'marketing', 
    title: 'التسويق الأدائي', 
    icon: Target, 
    desc: 'حملات مبنية على النتائج والتحويل',
    subServices: ['إعلانات Google & Meta', 'التسويق عبر المؤثرين', 'إعادة الاستهداف الذكي', 'تحسين معدل التحويل (CRO)']
  },
  { 
    id: 'seo', 
    title: 'السيو والمحتوى', 
    icon: Search, 
    desc: 'تحسين المحركات وإثراء علامة المحتوى',
    subServices: ['سيو تقني والروابط', 'استراتيجية المحتوى', 'إدارة المدونات المعرفية', 'السيو المحلي']
  },
  { 
    id: 'social', 
    title: 'السوشال ميديا', 
    icon: Megaphone, 
    desc: 'إدارة وتنشيط القنوات الاجتماعية',
    subServices: ['إدارة الحسابات', 'صناعة المحتوى الإبداعي', 'التفاعل المجتمعي', 'تحليل المنافسين']
  },
  { 
    id: 'identity', 
    title: 'الهوية والتصميم', 
    icon: Palette, 
    desc: 'بناء العلامة البصرية والقصة',
    subServices: ['تصميم الشعار والهوية', 'دليل العلامة التجارية', 'تصميم واجهة المستخدم UI', 'النمذجة ثلاثية الأبعاد']
  },
  { 
    id: 'web', 
    title: 'المنتجات الرقمية', 
    icon: Code, 
    desc: 'تطوير المواقع والبرمجيات المتطورة',
    subServices: ['تطوير متاجر سلة وزد', 'تطوير تطبيقات الويب', 'تحسين تجربة المستخدم UX', 'الصيانة والدعم الفني']
  },
  { 
    id: 'strategy', 
    title: 'الاستراتيجية والاستشارات', 
    icon: Lightbulb, 
    desc: 'خطط تسويقية، تحول رقمي، AI، وأبحاث سوق',
    subServices: ['الاستراتيجية التسويقية الشاملة', 'استشارات التحول الرقمي والـ AI', 'أبحاث السوق وتحليل المنافسين']
  },
  { 
    id: 'pr', 
    title: 'العلاقات العامة والإعلام', 
    icon: Globe, 
    desc: 'إدارة السمعة، الحضور الإعلامي، والفعاليات',
    subServices: ['العلاقات العامة وإدارة الإعلام', 'الشراء الإعلامي', 'تسويق الفعاليات والتفعيلات']
  },
  { 
    id: 'other', 
    title: 'أخرى', 
    icon: Sparkles, 
    desc: 'لديك احتياج مختلف أو مشروع خاص؟',
    subServices: []
  },
];

const budgets = [
  'أقل من 10k',
  '10k - 25k',
  '25k - 50k',
  '50k - 100k',
  'أكثر من 100k',
];

const urgencies = [
  'فوري - نحتاج للبدء الآن',
  'خلال هذا الشهر',
  'خلال 1-3 أشهر',
  'مرحلة التخطيط والبحث',
];

export default function MultiStepLeadForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const formTopRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    services: [] as string[],
    subServices: [] as string[],
    otherServiceText: '',
    budget: '',
    urgency: '',
    details: '',
    name: '',
    company: '',
    sector: '',
    jobTitle: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const scrollToTop = () => {
    if (formTopRef.current) {
      const yOffset = -120; // إزاحة لتجنب تغطية الشريط العلوي
      const y = formTopRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: string[] = [];
    if (currentStep === 1) {
      if (formData.services.length === 0) newErrors.push('يرجى اختيار خدمة واحدة على الأقل');
      if (formData.services.includes('other') && !formData.otherServiceText) newErrors.push('يرجى تحديد الخدمة المطلوبة');
    } else if (currentStep === 2) {
      if (!formData.budget) newErrors.push('يرجى اختيار الميزانية المتوقعة');
      if (!formData.urgency) newErrors.push('يرجى تحديد مدى الاستعجال');
      if (formData.details.length < 5) newErrors.push('يرجى كتابة تفاصيل المشكلة (5 أحرف على الأقل)');
    } else if (currentStep === 3) {
      if (!formData.name) newErrors.push('الاسم الكامل مطلوب');
      if (!formData.email) newErrors.push('البريد الإلكتروني مطلوب');
      if (!formData.phone) newErrors.push('رقم الجوال مطلوب');
      if (!formData.sector) newErrors.push('القطاع مطلوب');
      // Basic email regex
      if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.push('البريد الإلكتروني غير صالح');
    }
    setErrors(newErrors);
    
    if (newErrors.length > 0) {
        scrollToTop();
    }
    
    return newErrors.length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setErrors([]);
    setDirection(1);
    setStep(s => s + 1);
    setTimeout(scrollToTop, 100);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(s => s - 1);
    setTimeout(scrollToTop, 100);
  };

  const handleServiceToggle = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.services.includes(id);
      if (isSelected) {
        return {
          ...prev,
          services: prev.services.filter(s => s !== id),
          otherServiceText: id === 'other' ? '' : prev.otherServiceText,
          // Also remove associated subservices if the main service is deselected
          subServices: prev.subServices.filter(sub => {
            const parent = services.find(s => s.id === id);
            return !parent?.subServices.includes(sub);
          })
        };
      }
      return { ...prev, services: [...prev.services, id] };
    });
  };

  const handleSubServiceToggle = (sub: string) => {
    setFormData(prev => {
      const isSelected = prev.subServices.includes(sub);
      if (isSelected) {
        return { ...prev, subServices: prev.subServices.filter(s => s !== sub) };
      }
      return { ...prev, subServices: [...prev.subServices, sub] };
    });
  };

  const generateWhatsAppMessage = () => {
    const selectedServiceTitles = formData.services
      .map(id => id === 'other' ? `أخرى: ${formData.otherServiceText}` : services.find(s => s.id === id)?.title)
      .filter(Boolean);

    let message = `*طلب استشارة مشروع جديد - جيل الذكاء*\n\n`;
    message += `*الخدمات المطلوبة:*\n- ${selectedServiceTitles.join('\n- ')}\n\n`;
    
    if (formData.subServices.length > 0) {
      message += `*الخدمات الفرعية:*\n- ${formData.subServices.join('\n- ')}\n\n`;
    }

    message += `*الميزانية المتوقعة:* ${formData.budget}\n`;
    message += `*الأولوية:* ${formData.urgency}\n\n`;
    
    message += `*تفاصيل المشكلة/الهدف:*\n${formData.details}\n\n`;
    
    message += `*معلومات التواصل:*\n`;
    message += `الاسم: ${formData.name}\n`;
    message += `القطاع: ${formData.sector}\n`;
    message += `الشركة: ${formData.company}\n`;
    message += `المسمى الوظيفي: ${formData.jobTitle}\n`;
    message += `الهاتف: ${formData.phone}\n`;
    message += `البريد: ${formData.email}`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppSend = () => {
    const phoneNumber = '966581195387';
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    // Simulate API
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 space-y-8 bg-gray-dark/5 p-12 rounded-3xl border border-gray-dark/30"
      >
        <div className="w-24 h-24 bg-pulse-orange/20 rounded-full flex items-center justify-center mx-auto text-pulse-orange relative">
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
            >
                <CheckCircle2 size={56} />
            </motion.div>
            <div className="absolute inset-0 bg-pulse-orange/10 rounded-full animate-ping" />
        </div>
        <div className="space-y-4">
            <h2 className="text-4xl font-bold text-snow">وصلنا طلبك بنجاح!</h2>
            <p className="text-gray-medium text-lg max-w-md mx-auto leading-relaxed">
                يقوم فريقنا الآن بتحليل بياناتك لتجهيز تصور أولي قبل تواصلنا معك خلال 24 ساعة.
            </p>
        </div>
        <button 
          onClick={() => {
            setIsSuccess(false);
            setStep(1);
            setFormData({
                services: [], subServices: [], otherServiceText: '', budget: '', urgency: '', details: '', name: '',
                company: '', sector: '', jobTitle: '', email: '', phone: ''
            });
          }}
          className="text-pulse-orange font-bold text-sm hover:underline tracking-widest uppercase"
        >
          إرسال طلب جديد
        </button>
      </motion.div>
    );
  }

  return (
    <div ref={formTopRef} className="w-full max-w-5xl mx-auto scroll-mt-24">
      {/* Progress Bar */}
      <div className="mb-12 max-w-3xl mx-auto">
        <div className="flex justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${
                step >= s ? 'text-pulse-orange' : 'text-gray-medium'
              }`}
            >
              {s === 1 ? 'الخيار' : s === 2 ? 'التفاصيل' : 'التواصل'}
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-gray-dark/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-pulse-orange shadow-[0_0_15px_rgba(244,77,43,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>
      </div>

      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "backOut" }}
            className="w-full"
          >
            {step === 1 && (
              <div className="space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl lg:text-5xl font-bold text-snow">ما الذي نساعدك في بنائه؟</h2>
                  <p className="text-gray-medium font-medium text-lg">يمكنك اختيار أكثر من خدمة للحصول على حل متكامل.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                  {services.map((item) => (
                    <div key={item.id} className="flex flex-col gap-4 h-full">
                      <Tilt className="flex-grow">
                        <button
                          onClick={() => handleServiceToggle(item.id)}
                          className={`w-full h-full text-right p-6 rounded-2xl border transition-all duration-300 group flex flex-col ${
                            formData.services.includes(item.id)
                              ? 'bg-pulse-orange/10 border-pulse-orange shadow-[0_0_30px_rgba(244,77,43,0.1)]' 
                              : 'bg-gray-dark/10 border-gray-dark/30 hover:border-gray-dark hover:bg-gray-dark/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4 w-full">
                            <div className={`p-3 rounded-lg transition-colors ${
                               formData.services.includes(item.id) ? 'bg-pulse-orange text-snow' : 'bg-gray-dark/30 text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow'
                            }`}>
                              <item.icon size={24} />
                            </div>
                            {formData.services.includes(item.id) && (
                              <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className="text-pulse-orange"
                              >
                                <CheckCircle2 size={24} />
                              </motion.div>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-snow mb-2">{item.title}</h3>
                          <p className="text-gray-medium text-xs leading-relaxed font-medium flex-grow">{item.desc}</p>
                        </button>
                      </Tilt>
                      
                      {/* Sub-services selection */}
                      {formData.services.includes(item.id) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-pure-ink p-4 rounded-xl border border-pulse-orange/30 shadow-2xl relative z-20"
                        >
                          <span className="text-[10px] font-bold text-pulse-orange uppercase tracking-widest mb-3 block">الخدمات الفرعية</span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {item.subServices.map(sub => (
                              <button
                                key={sub}
                                onClick={() => handleSubServiceToggle(sub)}
                                className={`text-[11px] font-bold p-2.5 rounded-lg text-right flex items-center justify-between transition-all ${
                                  formData.subServices.includes(sub)
                                    ? 'bg-pulse-orange text-snow'
                                    : 'bg-gray-dark/20 text-gray-medium hover:bg-gray-dark/40 hover:text-snow'
                                }`}
                              >
                                {sub}
                                {formData.subServices.includes(sub) && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {formData.services.includes('other') && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="max-w-xl mx-auto w-full space-y-4 pt-6"
                    >
                      <label className="text-sm font-bold text-gray-medium uppercase tracking-widest flex items-center gap-3">
                        <Sparkles size={18} className="text-pulse-orange" /> وضح لنا الخدمة المطلوبة (أخرى)
                      </label>
                      <input 
                        type="text"
                        value={formData.otherServiceText}
                        onChange={(e) => setFormData({ ...formData, otherServiceText: e.target.value })}
                        placeholder="مثال: تصوير استراتيجي، إنتاج بودكاست، إلخ..."
                        className="w-full bg-gray-dark/10 border-2 border-pulse-orange/50 hover:border-pulse-orange rounded-xl py-4 px-6 text-snow transition-all duration-300 focus:outline-none focus:bg-gray-dark/20 focus:ring-4 focus:ring-pulse-orange/10 placeholder:text-gray-medium/30"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center flex-col items-center gap-6 pt-8">
                  <AnimatePresence>
                    {errors.length > 0 && step === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm font-bold"
                      >
                        {errors[0]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Magnetic>
                    <button 
                      onClick={nextStep}
                      className="btn-primary px-16 py-4 text-xl flex items-center gap-3"
                    >
                      التالي <ChevronLeft size={24} />
                    </button>
                  </Magnetic>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold text-snow">أخبرنا بالمزيد عن طموحك</h2>
                  <p className="text-gray-medium font-medium text-lg">بناءً على اختيارك لـ ({formData.services.length}) خدمات، أخبرنا بالاحتياج الفعلي.</p>
                </div>
                
                <div className="space-y-12">
                  <div className="space-y-6">
                    <label className="text-sm font-bold text-gray-medium uppercase tracking-widest flex items-center gap-3">
                      <DollarSignComponent /> ميزانية الاستثمار التسويقي المتوقعة لمشروعك
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {budgets.map((b) => (
                        <button
                          key={b}
                          onClick={() => setFormData({ ...formData, budget: b })}
                          className={`py-4 px-2 rounded-xl text-xs font-bold border transition-all ${
                            formData.budget === b
                              ? 'bg-pulse-orange border-pulse-orange text-snow shadow-lg shadow-pulse-orange/20'
                              : 'bg-gray-dark/10 border-gray-dark/30 text-gray-medium hover:border-gray-dark'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-sm font-bold text-gray-medium uppercase tracking-widest flex items-center gap-3">
                      <Clock size={18} className="text-pulse-orange" /> متى ترغب في بدء المشروع؟
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {urgencies.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setFormData({ ...formData, urgency: u })}
                          className={`py-4 px-2 rounded-xl text-xs font-bold border transition-all ${
                            formData.urgency === u
                              ? 'bg-pulse-orange border-pulse-orange text-snow shadow-lg shadow-pulse-orange/20'
                              : 'bg-gray-dark/10 border-gray-dark/30 text-gray-medium hover:border-gray-dark'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-sm font-bold text-gray-medium uppercase tracking-widest flex items-center gap-3 underline underline-offset-8 decoration-pulse-orange/30">
                      <MessageSquare size={18} className="text-pulse-orange" /> باختصار، ما هي المشكلة الأساسية التي تريد حلها؟
                    </label>
                    <div className="relative group">
                        <textarea 
                          value={formData.details}
                          onChange={(e) => {
                            setFormData({ ...formData, details: e.target.value });
                            if (errors.length > 0) setErrors([]);
                          }}
                          placeholder="مثال: نريد أتمتة عملية الرد على العملاء بشكل كامل مع دمج نظام CRM لتحسين المتابعة، ورفع الوعي بالعلامة التجارية في السوق السعودي..."
                          rows={8}
                          className={`w-full min-h-[300px] bg-gray-dark/10 border-2 rounded-2xl p-10 text-xl text-snow transition-all duration-300 resize-none leading-relaxed placeholder:text-gray-medium/30 focus:outline-none ${
                            errors.some(e => e.includes('تفاصيل')) 
                              ? 'border-red-500/50 bg-red-500/5' 
                              : 'border-gray-dark/50 group-hover:border-pulse-orange/30 focus:border-pulse-orange focus:bg-gray-dark/20 focus:ring-4 focus:ring-pulse-orange/10'
                          }`}
                        />
                        <div className="absolute bottom-6 left-6 text-[10px] font-mono text-pulse-orange/30">
                            SYSTEM_ACTIVE_DATA_STREAM
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8 pt-6">
                  <AnimatePresence>
                    {errors.length > 0 && step === 2 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-3 rounded-xl text-sm font-bold"
                      >
                        {errors[0]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-8 w-full">
                    <button onClick={prevStep} className="flex-1 py-4 text-gray-medium font-bold hover:text-snow transition-colors flex items-center justify-center gap-3 text-lg">
                      <ChevronRight size={24} /> السابق
                    </button>
                    <Magnetic className="flex-[3]">
                      <button 
                        onClick={nextStep}
                        className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3"
                      >
                        التالي <ChevronLeft size={24} />
                      </button>
                    </Magnetic>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-snow">كيف يمكننا الوصول إليك؟</h2>
                  <p className="text-gray-medium font-medium">سنتواصل معك لمناقشة التصور الاستراتيجي المبدئي.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    icon={User} 
                    label="الاسم الكامل" 
                    placeholder="عبدالله محمد" 
                    value={formData.name} 
                    onChange={(v: string) => setFormData({...formData, name: v})} 
                  />
                  <FormField 
                    icon={Building2} 
                    label="اسم الشركة / العلامة" 
                    placeholder="شركة المسار الرقمي" 
                    value={formData.company} 
                    onChange={(v: string) => setFormData({...formData, company: v})} 
                  />
                  <FormField 
                    icon={Target} 
                    label="القطاع" 
                    placeholder="مثال: التقنية، الأغذية، العقارات..." 
                    value={formData.sector} 
                    onChange={(v: string) => setFormData({...formData, sector: v})} 
                  />
                  <FormField 
                    icon={Briefcase} 
                    label="المسمى الوظيفي" 
                    placeholder="المدير التنفيذي" 
                    value={formData.jobTitle} 
                    onChange={(v: string) => setFormData({...formData, jobTitle: v})} 
                  />
                   <FormField 
                    icon={Phone} 
                    label="رقم الجوال" 
                    placeholder="+966 5..." 
                    value={formData.phone} 
                    dir="ltr"
                    onChange={(v: string) => setFormData({...formData, phone: v})} 
                  />
                </div>

                <FormField 
                  icon={Mail} 
                  label="البريد الإلكتروني" 
                  placeholder="name@company.com" 
                  type="email"
                  value={formData.email} 
                  onChange={(v: string) => setFormData({...formData, email: v})} 
                />

                <div className="flex flex-col gap-6 pt-10">
                  <AnimatePresence>
                    {errors.length > 0 && step === 3 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-3 rounded-xl text-center text-sm font-bold"
                      >
                        {errors[0]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={prevStep} className="flex-1 py-4 text-gray-medium font-bold hover:text-snow transition-colors flex items-center justify-center gap-2">
                      <ChevronRight size={20} /> السابق
                    </button>
                    <Magnetic className="flex-[2]">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden"
                      >
                        {isSubmitting ? (
                          <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              className="flex items-center gap-3"
                          >
                              <div className="w-5 h-5 border-2 border-snow/30 border-t-snow rounded-full animate-spin" />
                              جاري المعالجة...
                          </motion.div>
                        ) : (
                          <>
                              إطلاق المشروع <Sparkles size={20} />
                          </>
                        )}
                      </button>
                    </Magnetic>
                  </div>

                  <button 
                    type="button"
                    onClick={handleWhatsAppSend}
                    className="w-full py-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-500 font-bold flex items-center justify-center gap-3 transition-all group"
                  >
                    <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                    أرسل التفاصيل عبر واتساب مباشرة
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, placeholder, value, onChange, type = "text", dir = "rtl" }: {
    label: string, 
    icon: any, 
    placeholder: string, 
    value: string, 
    onChange: (v: string) => void, 
    type?: string, 
    dir?: string 
}) {
  return (
    <div className="space-y-3 group">
      <label className="text-xs font-bold text-gray-medium uppercase tracking-widest flex items-center gap-2 group-focus-within:text-pulse-orange transition-colors">
        <Icon size={14} className="group-focus-within:scale-110 transition-transform" /> {label}
      </label>
      <div className="relative">
        <input 
          required 
          type={type} 
          dir={dir}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-dark/10 border-2 border-gray-dark/50 hover:border-gray-dark rounded-xl py-4 px-5 text-snow transition-all duration-300 focus:outline-none focus:border-pulse-orange focus:bg-gray-dark/20 focus:ring-4 focus:ring-pulse-orange/10 placeholder:text-gray-medium/30" 
          placeholder={placeholder} 
        />
        <div className="absolute bottom-0 right-0 h-[2px] w-0 bg-pulse-orange transition-all duration-500 group-focus-within:w-full" />
      </div>
    </div>
  );
}

function DollarSignComponent() {
    return <span className="text-pulse-orange text-sm font-bold">﷼</span>;
}
