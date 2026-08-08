import { Metadata } from 'next';
import FeedbackClient from './FeedbackClient';

export const metadata: Metadata = {
  title: 'قيّم تجربتك | AGMA',
  description: 'تقييم سريع لا يستغرق دقيقة — رأيك يحسّن طريقة عملنا مباشرة.',
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
