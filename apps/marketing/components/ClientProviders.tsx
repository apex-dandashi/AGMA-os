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
    <MotionConfig reducedMotion="user">
      <AICursor />
      <CookieConsent />
      <RevealGuard />
      <SmoothScroll>
        {children}
      </SmoothScroll>
    </MotionConfig>
  );
}
