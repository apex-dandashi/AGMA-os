'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/** ● أنظمة AGMA تعمل + «فريق الرياض متصل الآن» — تفاصيل الثقة الصغيرة (WOW-1). */
export default function LiveStatusDot() {
  const [riyadhOnline, setRiyadhOnline] = useState(false);

  useEffect(() => {
    // ساعات عمل الرياض: الأحد–الخميس ٩–١٨ بتوقيت السعودية
    const compute = () => {
      const now = new Date();
      const ksa = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
      const day = ksa.getDay(); // 0=الأحد في en-US getDay؟ 0=Sunday ✓
      const hour = ksa.getHours();
      setRiyadhOnline(day >= 0 && day <= 4 && hour >= 9 && hour < 18);
    };
    compute();
    const t = setInterval(compute, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
      <Link href="/live" className="group inline-flex items-center gap-2 text-gray-light transition-colors hover:text-snow">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" aria-hidden />
        أنظمة AGMA تعمل
        <span className="text-gray-medium transition-colors group-hover:text-pulse-orange">← شاهد البث</span>
      </Link>
      <span className="text-gray-medium">
        {riyadhOnline ? 'فريق الرياض متصل الآن' : 'فريق الرياض خارج ساعات العمل — نرد صباحاً'}
      </span>
    </div>
  );
}
