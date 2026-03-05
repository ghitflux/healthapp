import type { Metadata } from 'next';
import { FinancialPageContent } from '@/features/financial';

export const metadata: Metadata = { title: 'Financeiro — HealthApp' };
export const dynamic = 'force-dynamic';

export default function FinancialPage() {
  return <FinancialPageContent />;
}
