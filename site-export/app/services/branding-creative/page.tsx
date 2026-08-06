import { Metadata } from 'next';
import BrandingCreativeClient from './BrandingCreativeClient';

export const metadata: Metadata = {
  title: 'الهوية والتصميم الإبداعي | AGMA',
  description: 'هويات بصرية، أنظمة علامة، تصميمات وموشن جرافيك تعبّر عن جوهرك، وتميزك في السوق، وتمنح علامتك حضوراً ثابتاً على كل نقطة تواصل.',
};

export default function BrandingCreativePage() {
  return <BrandingCreativeClient />;
}
