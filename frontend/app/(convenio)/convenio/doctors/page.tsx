import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Médicos — HealthApp' };

export default function DoctorsPage() {
  return <PagePlaceholder title="Médicos" description="Gerencie os médicos do seu convênio" />;
}
