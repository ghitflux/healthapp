import type { Metadata } from 'next';
import { OwnerConveniosPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Convênios — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function ConveniosPage() {
  return <OwnerConveniosPageContent />;
}
