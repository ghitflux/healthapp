import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';

const OwnerAuditLogsPageContent = dynamicImport(
  () => import('@/features/owner').then((module) => module.OwnerAuditLogsPageContent),
  {
    loading: () => <div className="h-80 animate-pulse rounded-md border bg-muted/40" />,
  }
);

export const metadata: Metadata = { title: 'Auditoria — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function AuditLogsPage() {
  return <OwnerAuditLogsPageContent />;
}
