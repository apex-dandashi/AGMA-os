'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Magnetic from './ui/Magnetic';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'من نحن', href: '/about' },
    { name: 'منهجيتنا', href: '/agma-method' },
    { name: 'آلية العمل', href: '/process' },
    { name: 'خدماتنا', href: '/services' },
    { name: 'القطاعات', href: '/industries' },
    { name: 'التسعير', href: '/pricing' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A0A0A]/80 backdrop-blur-md border-b border-snow/5 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Magnetic>
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.svg" 
              alt="AGMA Logo" 
              width={240} 
              height={80} 
              className="h-16 w-auto object-contain"
              style={{ width: 'auto' }}
              priority
            />
          </Link>
        </Magnetic>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Magnetic key={link.href}>
              <Link 
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${link.name === 'الرئيسية' ? 'text-pulse-orange' : 'text-gray-light hover:text-snow'}`}
              >
                {link.name}
              </Link>
            </Magnetic>
          ))}
          <Magnetic>
            <Link 
              href="/contact" 
              className="btn-outline flex items-center justify-center text-sm py-2 px-6"
            >
              احجز مكالمة استراتيجية
            </Link>
          </Magnetic>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-snow"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#0A0A0A] border-b border-snow/5 px-6 py-8 flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-lg text-gray-light hover:text-pulse-orange"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/contact" 
              className="btn-primary text-center"
              onClick={() => setIsOpen(false)}
            >
              احجز مكالمة استراتيجية
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
