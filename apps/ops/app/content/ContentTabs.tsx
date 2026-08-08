'use client';

import { useState } from 'react';
import { Tabs } from '@agma/ui';
import ContentPanel from '../../components/ContentPanel';
import BlogAdmin from '../../components/BlogAdmin';

/** المحتوى بجناحيه: محتوى العملاء (اعتمادات) + مدونة الموقع (SEO اليومي). */
export default function ContentTabs() {
  const [tab, setTab] = useState('clients');
  return (
    <div className="space-y-4">
      <Tabs active={tab} onChange={setTab} tabs={[
        { key: 'clients', label: 'محتوى العملاء' },
        { key: 'blog', label: 'آخر الأخبار (الموقع)' },
      ]} />
      {tab === 'clients' ? <ContentPanel /> : <BlogAdmin />}
    </div>
  );
}
