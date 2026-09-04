'use client';
import React, { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import AICursor from './AICursor';
import SmoothScroll from './SmoothScroll';
import CookieConsent from './CookieConsent';
import RevealGuard from './RevealGuard';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    // reducedMotion="user": من فعّل تقليل الحركة في جهازه يرى المحتوى ثابتاً
    // فوراً — إتاحة + مناعة إضافية ضد علوق العناصر المخفية.
    // transition الافتراضي (جولة Apple): نابض مخمَّد حرجياً (bounce 0) لكل
    // حركة لم تحدد نابضها — قابل للمقاطعة ويبدأ من القيمة الحالية لا الهدف.
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', bounce: 0, duration: 0.45 }}>
      <AICursor />
      <CookieConsent />
      <RevealGuard />
      <SmoothScroll>
        {children}
      </SmoothScroll>
    </MotionConfig>
  );
}
