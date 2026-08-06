import React from 'react';
import { Metadata } from 'next';
import ProcessClient from './ProcessClient';

export const metadata: Metadata = {
  title: 'كيف نبدأ العمل معك؟ نموذج التعاون | AGMA',
  description: 'منهجية تعاون واضحة من أول مكالمة استكشافية حتى التنفيذ والقياس. تعرف على مراحل العمل مع AGMA وماذا تتوقع منا للحصول على نتائج حقيقية.',
};

export default function Page() {
  return <ProcessClient />;
}
