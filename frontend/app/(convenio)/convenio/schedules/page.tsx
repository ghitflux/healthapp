import type { Metadata } from 'next';
import { SchedulesPageContent } from '@/features/schedules';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Agendas — Abase Saúde' };

export default function SchedulesPage() {
  return <SchedulesPageContent />;
}
