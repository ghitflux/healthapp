import type { Metadata } from 'next';
import { AppointmentsPageContent } from '@/features/appointments';

export const metadata: Metadata = { title: 'Agendamentos — HealthApp' };
export const dynamic = 'force-dynamic';

export default function AppointmentsPage() {
  return <AppointmentsPageContent />;
}
