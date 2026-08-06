import React from 'react';
import { Metadata } from 'next';
import WebDigitalClient from './WebDigitalClient';

export const metadata: Metadata = {
  title: 'تصميم وتطوير المواقع الرقمية | AGMA وبناء المنتجات التي تبيع',
  description: 'نحن لا نبني بروشورات رقمية، نحن نبني أصولاً تجارية تبيع وتحول الزوار إلى عملاء. مواقع سريعة، متاجر متكاملة، وصفحات هبوط عالية التحويل.',
};

export default function Page() {
  return <WebDigitalClient />;
}
