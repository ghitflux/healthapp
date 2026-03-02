import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Analytics — HealthApp Owner' };

export default function AnalyticsPage() {
  return <PagePlaceholder title="Analytics" description="Análises e tendências da plataforma" />;
}
