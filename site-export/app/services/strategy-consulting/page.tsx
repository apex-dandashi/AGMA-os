import React from 'react';
import { Metadata } from 'next';
import StrategyClient from './StrategyClient';

export const metadata: Metadata = {
  title: 'الاستراتيجية والاستشارات التسويقية | AGMA - الخطة قبل الإنفاق',
  description: 'قبل أن تنفق على التسويق، ابنِ الخطة. استراتيجيات تسويقية، تحول رقمي، دمج AI، وأبحاث سوق تساعدك على اتخاذ قرارات أوضح قبل إطلاق الميزانيات.',
};

export default function Page() {
  return <StrategyClient />;
}
