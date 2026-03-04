import type { Metadata } from 'next';
import { DoctorsPageContent } from '@/features/doctors';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Médicos — HealthApp' };

export default function DoctorsPage() {
  return <DoctorsPageContent />;
}
