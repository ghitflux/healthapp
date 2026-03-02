import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Convênios — HealthApp Owner' };

export default function ConveniosPage() {
  return <PagePlaceholder title="Convênios" description="Gerencie todos os convênios da plataforma" />;
}
