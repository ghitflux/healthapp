import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Financeiro Global — HealthApp Owner' };

export default function OwnerFinancialPage() {
  return <PagePlaceholder title="Financeiro Global" description="Relatório financeiro global da plataforma" />;
}
