import React from 'react';
import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'التسعير | AGMA - شفافية في القيمة',
  description: 'تسعير واضح ونطاق عمل مخصص. نؤمن أن كل مشروع يحتاج نطاقاً يناسب هدفه وحجمه. استكشف الأسعار الإرشادية لخدمات AI والتسويق والويب.',
};

export default function Page() {
  return <PricingClient />;
}
