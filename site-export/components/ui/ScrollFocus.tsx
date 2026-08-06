'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function ScrollFocus({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // تأثير التكبير: يبدأ من 0.95 عند الأطراف ويصل لـ 1.05 في المنتصف
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.95, 0.98, 1.05, 0.98, 0.95]);
  
  // تأثير الشفافية والإضاءة
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.6, 0.8, 1, 0.8, 0.6]);
  const glow = useTransform(
    scrollYProgress, 
    [0.3, 0.5, 0.7], 
    ["0px 0px 0px rgba(244,77,43,0)", "0px 0px 40px rgba(244,77,43,0.15)", "0px 0px 0px rgba(244,77,43,0)"]
  );

  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });
  const springOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={containerRef}
      style={{
        scale: springScale,
        opacity: springOpacity,
        boxShadow: glow,
      }}
      className={`h-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
