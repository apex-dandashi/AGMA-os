'use client';

import { useEffect } from 'react';

/**
 * شبكة أمان الظهور (تدقيق التحويل 2026-09-04): 25 مكوناً يعتمد على
 * framer-motion بحالة ابتدائية opacity:0 — أي تعثر JS أو جهاز بطيء أو
 * rAF موقوف يترك المحتوى (وأزرار البيع) غير مرئي. بعد مهلة سماح، أي
 * عنصر ما زال شفافاً بالكامل يُجبر على الظهور — الحركة زينة لا شرط رؤية.
 */
export default function RevealGuard() {
  useEffect(() => {
    const rescue = () => {
      document.querySelectorAll<HTMLElement>('main [style*="opacity"]').forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.filter = 'none'; /* الظهور المتجسّد يبدأ مضبّباً */
        }
      });
    };
    // إنقاذ مبكر لما فوق الطية، وثانٍ شامل بعد استقرار الأنيميشن
    const t1 = window.setTimeout(rescue, 2000);
    const t2 = window.setTimeout(rescue, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return null;
}
