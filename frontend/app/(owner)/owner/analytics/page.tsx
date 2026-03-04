import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';

const OwnerAnalyticsPageContent = dynamicImport(
  () => import('@/features/owner').then((module) => module.OwnerAnalyticsPageContent),
  {
    loading: () => <div className="h-80 animate-pulse rounded-md border bg-muted/40" />,
  }
);

export const metadata: Metadata = { title: 'Analytics — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return <OwnerAnalyticsPageContent />;
}
