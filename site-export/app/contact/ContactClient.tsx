'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MapPin, 
  Clock, 
  Phone, 
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import MultiStepLeadForm from '@/components/MultiStepLeadForm';

const processSteps = [
  { title: 'نراجع طلبك', desc: 'يقوم فريقنا الفني والاستراتيجي بمراجعة بياناتك بعمق.' },
  { title: 'نحدد أنسب مسار', desc: 'نختار الأدوات والخدمات التي تحقق هدفك بأعلى كفاءة.' },
  { title: 'نتواصل لتحديد مكالمة', desc: 'نتصل بك لترتيب جلسة استكشافية لفهم التحديات.' },
  { title: 'نرسل نطاق عمل', desc: 'نقدم لك عرضاً فنياً ومالياً مفصلاً وشفافاً.' },
  { title: 'نبدأ التنفيذ', desc: 'ننطلق في العمل بعد الاعتماد مباشرة ضمن جدول زمني واضح.' },
];

export default function ContactClient() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pulse-orange/10 border border-pulse-orange/20 text-pulse-orange text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
              <Sparkles size={12} /> لنصنع فارقاً حقيقياً
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold mb-8 leading-[0.95] text-snow max-w-5xl mx-auto tracking-tighter">
              نموك يبدأ <br className="hidden sm:block" />
              <span className="text-pulse-orange">بمحادثة ذكية.</span>
            </h1>
            <p className="text-gray-medium text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              أتمتة، تسويق، أو بناء هوية — نحن هنا لتحويل رؤيتك إلى نظام نمو متكامل وقابل للقياس.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Improved Multi-Step Form Section */}
      <section id="contact-form" className="pb-32 px-6 relative">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="geometric-card bg-gray-dark/5 p-8 lg:p-20 relative ring-1 ring-white/5"
            >
              <div className="grid-pattern opacity-[0.02]" />
              <MultiStepLeadForm />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 bg-pure-ink relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Info & Steps */}
            <div className="lg:col-span-5 space-y-16">
              <div className="space-y-8">
                 <h3 className="text-3xl font-bold text-snow">تواصل مباشر</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    <ContactItem icon={Mail} title="البريد الإلكتروني" value="hello@agma.com.sa" />
                    <ContactItem icon={Phone} title="الجوال" value="+966 58 119 5387" isLtr />
                    <ContactItem icon={MapPin} title="المقر الرئيسي" value="الرياض، المملكة العربية السعودية" />
                    <ContactItem icon={Clock} title="ساعات العمل" value="09:00 ص - 05:00 م" />
                 </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-16">
               <div className="space-y-8">
                  <h3 className="text-3xl font-bold text-snow">رحلة طلبك في AGMA</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {processSteps.map((step, i) => (
                       <div key={i} className="p-8 bg-gray-dark/5 border border-gray-dark/30 rounded-2xl group hover:border-pulse-orange/30 transition-all duration-500">
                          <span className="text-pulse-orange font-mono font-bold text-xs mb-4 block opacity-50">0{i+1}</span>
                          <h4 className="text-xl font-bold text-snow mb-2">{step.title}</h4>
                          <p className="text-gray-medium text-xs leading-relaxed font-medium">{step.desc}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ContactItem({ icon: Icon, title, value, isLtr = false }: any) {
  return (
    <div className="flex gap-4 group">
      <div className="w-12 h-12 bg-gray-dark/10 rounded-xl flex items-center justify-center text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow transition-all duration-500 shrink-0">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-medium text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-snow font-bold ${isLtr ? 'text-left' : ''}`} dir={isLtr ? 'ltr' : 'rtl'}>{value}</p>
      </div>
    </div>
  );
}

