'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export default function Tilt({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['15deg', '-15deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-15deg', '15deg']);

  useEffect(() => {
    let isDesktop = true;
    if (typeof window !== 'undefined') {
      isDesktop = !window.matchMedia('(hover: none)').matches;
    }

    if (!isDesktop) {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        // Beta: front-to-back tilt (-180 to 180)
        // Gamma: left-to-right tilt (-90 to 90)
        const beta = e.beta || 0;
        const gamma = e.gamma || 0;

        // Roughly normalize for a natural tilt feel
        // Beta often rests around 45deg when holding a phone
        const normalizedY = (beta - 45) / 45; 
        const normalizedX = gamma / 45;

        // Clamp values
        const clampedY = Math.max(-0.5, Math.min(0.5, normalizedY));
        const clampedX = Math.max(-0.5, Math.min(0.5, normalizedX));

        x.set(clampedX);
        y.set(clampedY);
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [x, y]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      <div
        style={{
          transform: 'translateZ(20px)',
          transformStyle: 'preserve-3d',
        }}
        className="h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  );
}
