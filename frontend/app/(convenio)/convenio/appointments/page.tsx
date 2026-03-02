import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Agendamentos — HealthApp' };

export default function AppointmentsPage() {
  return <PagePlaceholder title="Agendamentos" description="Visualize e gerencie todos os agendamentos" />;
}
