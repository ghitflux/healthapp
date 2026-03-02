import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Auditoria — HealthApp Owner' };

export default function AuditLogsPage() {
  return <PagePlaceholder title="Logs de Auditoria" description="Histórico de ações na plataforma (LGPD)" />;
}
