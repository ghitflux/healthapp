import type { Metadata } from 'next';
import { OwnerConveniosPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Convênios — Abase Saúde Owner' };
export const dynamic = 'force-dynamic';

export default function ConveniosPage() {
  return <OwnerConveniosPageContent />;
}
