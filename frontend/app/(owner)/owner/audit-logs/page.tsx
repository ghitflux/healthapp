import type { Metadata } from 'next';
import { OwnerAuditLogsPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Auditoria — Abase Saúde Owner' };
export const dynamic = 'force-dynamic';

export default function AuditLogsPage() {
  return <OwnerAuditLogsPageContent />;
}
