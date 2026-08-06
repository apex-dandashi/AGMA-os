'use client';
import React, { useState, useEffect } from 'react';
import AICursor from './AICursor';
import SmoothScroll from './SmoothScroll';
import CookieConsent from './CookieConsent';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <>
      <AICursor />
      <CookieConsent />
      <SmoothScroll>
        {children}
      </SmoothScroll>
    </>
  );
}
