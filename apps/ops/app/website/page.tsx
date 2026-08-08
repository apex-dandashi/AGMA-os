import AppShell from '../../components/AppShell';
import WebsiteManager from '../../components/WebsiteManager';
import { CampaignToolsBlock, SiteMonitoringBlock } from '../../components/SiteToolsPanel';

export const metadata = { title: 'الموقع والمراقبة' };

export default function Page() {
  return (
    <AppShell>
      <SiteMonitoringBlock />
      <CampaignToolsBlock />
      <WebsiteManager />
    </AppShell>
  );
}
