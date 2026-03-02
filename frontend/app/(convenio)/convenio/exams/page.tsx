import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Exames — HealthApp' };

export default function ExamsPage() {
  return <PagePlaceholder title="Tipos de Exame" description="Gerencie os tipos de exame e preços" />;
}
