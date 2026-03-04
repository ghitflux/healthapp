import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';

const OwnerFinancialPageContent = dynamicImport(
  () => import('@/features/owner').then((module) => module.OwnerFinancialPageContent),
  {
    loading: () => <div className="h-80 animate-pulse rounded-md border bg-muted/40" />,
  }
);

export const metadata: Metadata = { title: 'Financeiro Global — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function OwnerFinancialPage() {
  return <OwnerFinancialPageContent />;
}
