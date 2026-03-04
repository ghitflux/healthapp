import dynamicImport from 'next/dynamic';

const OwnerDashboardPageContent = dynamicImport(
  () => import('@/features/owner').then((module) => module.OwnerDashboardPageContent),
  {
    loading: () => <div className="h-80 animate-pulse rounded-md border bg-muted/40" />,
  }
);

export const dynamic = 'force-dynamic';

export default function OwnerDashboardPage() {
  return <OwnerDashboardPageContent />;
}
