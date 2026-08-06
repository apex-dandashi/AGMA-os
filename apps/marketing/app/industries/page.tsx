import React from 'react';
import { Metadata } from 'next';
import IndustriesClient from './IndustriesClient';

export const metadata: Metadata = {
  title: 'القطاعات التي نخدمها | AGMA - حلول تسويقية متخصصة',
  description: 'من الجهات الحكومية إلى العقار والتقنية — نخدم القطاعات الأكثر طموحاً في السعودية عبر بناء منظومات نمو تناسب طبيعة كل جمهور وقناة.',
};

export default function Page() {
  return <IndustriesClient />;
}
