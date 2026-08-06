import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-pure-ink border-t border-snow/5 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.svg" 
                alt="AGMA Logo" 
                width={120} 
                height={40} 
                className="h-10 w-auto object-contain"
                style={{ width: 'auto' }}
              />
            </Link>
            <p className="text-gray-medium text-sm leading-relaxed max-w-xs">
              وكالة جيل الذكاء الاصطناعي — من الرياض، قلب المملكة، للوطن والخليج. وكالتك الكاملة في عصر التحول الرقمي الفائق.
            </p>
          </div>

          <div>
            <h4 className="text-snow font-bold mb-6">روابط سريعة</h4>
            <ul className="space-y-4 text-sm text-gray-medium">
              <li><Link href="/about" className="hover:text-pulse-orange transition-colors">من نحن</Link></li>
              <li><Link href="/agma-method" className="hover:text-pulse-orange transition-colors">منهجيتنا</Link></li>
              <li><Link href="/process" className="hover:text-pulse-orange transition-colors">آلية العمل</Link></li>
              <li><Link href="/pricing" className="hover:text-pulse-orange transition-colors">التسعير</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-snow font-bold mb-6">خدماتنا الثمانية</h4>
            <ul className="space-y-3 text-sm text-gray-medium">
              <li><Link href="/services/strategy-consulting" className="hover:text-pulse-orange transition-colors">الاستشارات الاستراتيجية</Link></li>
              <li><Link href="/services/ai-automation" className="hover:text-pulse-orange transition-colors">الذكاء الاصطناعي والأتمتة</Link></li>
              <li><Link href="/services/web-digital" className="hover:text-pulse-orange transition-colors">تطوير الويب والمنصات الرقمية</Link></li>
              <li><Link href="/services/performance-marketing" className="hover:text-pulse-orange transition-colors">التسويق الأدائي والإعلانات</Link></li>
              <li><Link href="/services/social-media" className="hover:text-pulse-orange transition-colors">إدارة السوشال ميديا والمجتمعات</Link></li>
              <li><Link href="/services/seo-content" className="hover:text-pulse-orange transition-colors">السيو وصناعة المحتوى</Link></li>
              <li><Link href="/services/branding-creative" className="hover:text-pulse-orange transition-colors">الهوية والتصميم الإبداعي</Link></li>
              <li><Link href="/services/pr-media" className="hover:text-pulse-orange transition-colors">العلاقات العامة والإعلام</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-snow font-bold mb-6">تواصل معنا</h4>
            <ul className="space-y-4 text-sm text-gray-medium">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="text-pulse-orange shrink-0" />
                <span>الرياض، المملكة العربية السعودية</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-pulse-orange shrink-0" />
                <a href="mailto:hello@agma.com.sa" className="hover:text-snow transition-colors">hello@agma.com.sa</a>
              </li>
              <li className="flex items-center gap-3" dir="ltr">
                <Phone size={16} className="text-pulse-orange shrink-0" />
                <a href="tel:+966581195387" className="hover:text-snow transition-colors">+966 58 119 5387</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-dark text-[10px] text-gray-medium gap-8">
          <div className="flex flex-col gap-1 text-right md:text-left">
            <span className="text-snow font-bold tracking-widest uppercase">AGMA™ 2026</span>
            <span className="text-gray-medium">وكالة جيل الذكاء الاصطناعي — الرياض، المملكة العربية السعودية.</span>
          </div>
          
          <div className="flex flex-wrap gap-8 lg:gap-12 justify-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest mb-1 font-mono">نظام الوكالة</span>
              <span className="text-xs text-gray-light font-medium">AGMA Method™</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest mb-1 font-mono">أداء الحملات</span>
              <span className="text-xs text-gray-light font-medium">+312% عائد الاستثمار</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-pulse-orange font-bold uppercase tracking-widest mb-1 font-mono">أتمتة العمليات</span>
              <span className="text-xs text-gray-light font-medium">45,000 ساعة موفرة</span>
            </div>
          </div>

          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-snow transition-colors">سياسة الخصوصية</Link>
            <Link href="/terms" className="hover:text-snow transition-colors">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
