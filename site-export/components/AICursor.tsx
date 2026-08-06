'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const AICursor = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 250 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsMounted(true);
      const mobileCheck = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
      setIsMobile(mobileCheck);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (isMobile || !isMounted) return;

    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) {
        setIsVisible(true);
        document.documentElement.classList.add('custom-cursor-active');
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isClickable = target.closest('a, button, [data-cursor="hover"], .btn-primary, .btn-secondary, .btn-outline');
      
      if (isClickable) {
        setIsHovering(true);
        const text = isClickable.getAttribute('data-cursor-text');
        setCursorText(text || '');
      } else {
        setIsHovering(false);
        setCursorText('');
      }
    };

    window.addEventListener('mousemove', moveMouse, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', moveMouse);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isMobile, isMounted, mouseX, mouseY]);

  if (!isMounted || isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999]">
      {/* Main Orange Dot */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-pulse-orange rounded-full shadow-[0_0_15px_rgba(244,77,43,0.6)]"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
      />
      
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border-2 border-pulse-orange/40 bg-pulse-orange/5"
        animate={{
          width: isHovering ? 90 : 36,
          height: isHovering ? 90 : 36,
          scale: isHovering ? 1.2 : 1,
        }}
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 0.8 : 0,
        }}
      >
        {isHovering && cursorText && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-snow uppercase tracking-widest text-center px-1"
          >
            {cursorText}
          </motion.span>
        )}
      </motion.div>
      
      {/* AI Atmosphere */}
      <motion.div
        className="fixed top-0 left-0 w-80 h-80 bg-pulse-orange/10 rounded-full blur-[100px] pointer-events-none"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 0.4 : 0,
        }}
      />
    </div>
  );
};

export default AICursor;
