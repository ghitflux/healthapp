import type { Metadata } from 'next';
import { OwnerFinancialPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Financeiro Global — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function OwnerFinancialPage() {
  return <OwnerFinancialPageContent />;
}
