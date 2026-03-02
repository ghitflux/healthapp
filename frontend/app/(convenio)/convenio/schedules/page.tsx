import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Agendas — HealthApp' };

export default function SchedulesPage() {
  return <PagePlaceholder title="Agendas" description="Configure as agendas dos médicos" />;
}
