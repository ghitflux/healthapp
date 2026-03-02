import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Financeiro — HealthApp' };

export default function FinancialPage() {
  return <PagePlaceholder title="Financeiro" description="Relatórios e análises financeiras" />;
}
