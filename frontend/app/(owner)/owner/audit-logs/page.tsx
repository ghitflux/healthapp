import type { Metadata } from 'next';
import { OwnerAuditLogsPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Auditoria — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function AuditLogsPage() {
  return <OwnerAuditLogsPageContent />;
}
