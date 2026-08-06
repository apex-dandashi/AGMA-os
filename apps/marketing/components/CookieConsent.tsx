'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, BarChart3, Target, Settings2, Check } from 'lucide-react';
import Link from 'next/link';
import Magnetic from './ui/Magnetic';

type ConsentSettings = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const DEFAULT_CONSENT: ConsentSettings = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const ALL_CONSENT: ConsentSettings = {
  essential: true,
  analytics: true,
  marketing: true,
  preferences: true,
};

// Tracking Script Loader Placeholders
const loadTrackingScripts = (consent: ConsentSettings) => {
  console.log('Loading scripts based on consent:', consent);
  
  // GA_MEASUREMENT_ID
  if (consent.analytics) {
    console.log('Initializing Google Analytics (GA_MEASUREMENT_ID)...');
    /* 
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID`;
    script.async = true;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
    */
  }

  // META_PIXEL_ID
  if (consent.marketing) {
    console.log('Initializing Meta Pixel (META_PIXEL_ID)...');
    /* 
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'META_PIXEL_ID');
    fbq('track', 'PageView');
    */

    // GOOGLE_ADS_ID
    console.log('Initializing Google Ads (GOOGLE_ADS_ID)...');
  }
};

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [consent, setConsent] = useState<ConsentSettings>(DEFAULT_CONSENT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
      
      try {
        const savedConsent = localStorage.getItem('agma-cookie-consent');
        if (!savedConsent) {
          setShowBanner(true);
        } else {
          const parsed = JSON.parse(savedConsent);
          setConsent(parsed);
          loadTrackingScripts(parsed);
        }
      } catch (e) {
        console.error('Error reading cookie consent:', e);
        setShowBanner(true);
      }
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const handleAcceptAll = () => {
    saveConsent(ALL_CONSENT);
  };

  const handleRejectAll = () => {
    saveConsent(DEFAULT_CONSENT);
  };

  const saveConsent = (settings: ConsentSettings) => {
    try {
      localStorage.setItem('agma-cookie-consent', JSON.stringify(settings));
      setConsent(settings);
      loadTrackingScripts(settings);
    } catch (e) {
      console.error('Error saving cookie consent:', e);
    }
    setShowBanner(false);
    setShowModal(false);
  };

  if (!mounted) return null;
  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Banner */}
      <AnimatePresence>
        {showBanner && !showModal && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
            dir="rtl"
          >
            <div className="container mx-auto max-w-6xl">
              <div className="bg-[#0A0A0A] border border-[#262626] p-6 rounded-2xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                {/* Scan Line Effect */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <motion.div 
                    animate={{ left: ['-100%', '200%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-0 bottom-0 w-[1px] bg-pulse-orange/20"
                  />
                </div>

                <div className="relative z-10 flex-1">
                  <p className="text-snow text-sm md:text-base leading-relaxed font-arabic">
                    نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح، قياس أداء الموقع، وتحسين حملاتنا التسويقية. 
                    يمكنك قبول جميع الملفات، رفض غير الضرورية، أو إدارة تفضيلاتك. لمعرفة المزيد، يرجى مراجعة{' '}
                    <Link href="/privacy-policy" className="text-pulse-orange hover:underline">سياسة الخصوصية</Link>{' '}
                    و{' '}
                    <Link href="/terms" className="text-pulse-orange hover:underline">الشروط والأحكام</Link>.
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 min-w-fit">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="text-gray-medium hover:text-snow text-sm font-bold transition-colors px-4 py-2 flex items-center gap-2"
                  >
                    <Settings2 size={16} />
                    إدارة التفضيلات
                  </button>
                  <button 
                    onClick={handleRejectAll}
                    className="btn-secondary text-sm px-6 py-2.5 whitespace-nowrap"
                  >
                    رفض غير الضرورية
                  </button>
                  <Magnetic>
                    <button 
                      onClick={handleAcceptAll}
                      className="btn-primary text-sm px-8 py-2.5 whitespace-nowrap shadow-lg shadow-pulse-orange/20"
                    >
                      قبول الكل
                    </button>
                  </Magnetic>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0A] border border-[#262626] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#262626] flex items-center justify-between">
                <h3 className="text-snow text-xl font-bold font-arabic flex items-center gap-3">
                  <Shield className="text-pulse-orange" />
                  إدارة تفضيلات ملفات تعريف الارتباط
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-medium hover:text-snow transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <p className="text-gray-medium text-sm leading-relaxed">
                  يمكنك اختيار أنواع ملفات تعريف الارتباط التي تسمح بها. بعض الملفات ضرورية لتشغيل الموقع ولا يمكن تعطيلها، بينما تساعدنا ملفات التحليلات والتسويق على تحسين الموقع وقياس أداء الحملات.
                </p>

                <div className="space-y-4">
                  {/* Essential */}
                  <div className="p-4 bg-white/5 border border-[#262626] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-pulse-orange/10 flex items-center justify-center text-pulse-orange">
                        <Shield size={20} />
                      </div>
                      <div>
                        <h4 className="text-snow font-bold text-sm">الضرورية</h4>
                        <p className="text-gray-medium text-xs">مطلوبة لتشغيل الموقع والنماذج والحماية الأساسية.</p>
                      </div>
                    </div>
                    <div className="text-pulse-orange text-xs font-bold bg-pulse-orange/10 px-3 py-1 rounded-full">دائمًا مفعّل</div>
                  </div>

                  {/* Analytics */}
                  <label className="p-4 bg-white/5 border border-[#262626] rounded-xl flex items-center justify-between hover:border-pulse-orange/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-pulse-orange/10 flex items-center justify-center text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow transition-colors">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <h4 className="text-snow font-bold text-sm">التحليلات</h4>
                        <p className="text-gray-medium text-xs">تساعدنا على فهم كيفية استخدام الزوار للموقع وتحسين الصفحات.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={consent.analytics}
                      onChange={(e) => setConsent({...consent, analytics: e.target.checked})}
                      className="w-6 h-6 rounded border-[#262626] bg-[#0A0A0A] text-pulse-orange focus:ring-pulse-orange transition-all cursor-pointer"
                    />
                  </label>

                  {/* Marketing */}
                  <label className="p-4 bg-white/5 border border-[#262626] rounded-xl flex items-center justify-between hover:border-pulse-orange/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-pulse-orange/10 flex items-center justify-center text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow transition-colors">
                        <Target size={20} />
                      </div>
                      <div>
                        <h4 className="text-snow font-bold text-sm">التسويق</h4>
                        <p className="text-gray-medium text-xs">تساعدنا على قياس أداء الإعلانات وتحسين الحملات وإظهار محتوى صلة.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={consent.marketing}
                      onChange={(e) => setConsent({...consent, marketing: e.target.checked})}
                      className="w-6 h-6 rounded border-[#262626] bg-[#0A0A0A] text-pulse-orange focus:ring-pulse-orange transition-all cursor-pointer"
                    />
                  </label>

                  {/* Preferences */}
                  <label className="p-4 bg-white/5 border border-[#262626] rounded-xl flex items-center justify-between hover:border-pulse-orange/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-pulse-orange/10 flex items-center justify-center text-pulse-orange group-hover:bg-pulse-orange group-hover:text-snow transition-colors">
                        <Settings2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-snow font-bold text-sm">التفضيلات</h4>
                        <p className="text-gray-medium text-xs">تساعد في حفظ بعض اختياراتك لتحسين تجربة التصفح.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={consent.preferences}
                      onChange={(e) => setConsent({...consent, preferences: e.target.checked})}
                      className="w-6 h-6 rounded border-[#262626] bg-[#0A0A0A] text-pulse-orange focus:ring-pulse-orange transition-all cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-[#262626] flex items-center justify-between gap-4">
                <button 
                  onClick={() => saveConsent(ALL_CONSENT)}
                  className="text-gray-medium hover:text-snow text-sm transition-colors"
                >
                  تفعيل كل شيء
                </button>
                <Magnetic>
                  <button 
                    onClick={() => saveConsent(consent)}
                    className="btn-primary text-sm px-10 py-3 flex items-center gap-2"
                  >
                    <Check size={18} />
                    حفظ التفضيلات
                  </button>
                </Magnetic>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
