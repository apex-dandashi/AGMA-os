import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformExperience from '@/components/TransformExperience';

export const metadata: Metadata = {
  title: 'ماذا تريد أن تطوّر؟ | AGMA',
  description:
    'ثلاث إجابات سريعة ونريك أين فرص التحويل في علامتك أو موقعك أو تسويقك أو أعمالك — تجربة استشارية مصغرة من AGMA.',
};

export default function TransformPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-void text-snow">
      <Header />
      <div className="pt-24">
        <TransformExperience />
      </div>
      <Footer />
    </div>
  );
}
