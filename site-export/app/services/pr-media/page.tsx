import React from 'react';
import { Metadata } from 'next';
import PRMediaClient from './PRMediaClient';

export const metadata: Metadata = {
  title: 'العلاقات العامة والإعلام | AGMA - نوصل صوتك بدقة',
  description: 'علاقات عامة، حضور إعلامي، شراء إعلاني، وتفعيل للفعاليات — لنمنح علامتك صوتاً واضحاً في القنوات الصحيحة. نحن نبني الثقة ونحمي السمعة.',
};

export default function Page() {
  return <PRMediaClient />;
}
