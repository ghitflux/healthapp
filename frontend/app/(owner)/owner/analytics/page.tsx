import type { Metadata } from 'next';
import { OwnerAnalyticsPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Analytics — Abase Saúde Owner' };
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return <OwnerAnalyticsPageContent />;
}
