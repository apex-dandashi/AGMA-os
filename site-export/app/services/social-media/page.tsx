import { Metadata } from 'next';
import SocialMediaClient from './SocialMediaClient';

export const metadata: Metadata = {
  title: 'إدارة السوشال ميديا والمجتمعات | AGMA',
  description: 'إدارة منصاتك باستراتيجية واضحة، محتوى يتحدث بصوتك، وحضور يبني ولاءً حقيقياً لا مجرد أرقام متابعي صامتة.',
};

export default function SocialMediaPage() {
  return <SocialMediaClient />;
}
