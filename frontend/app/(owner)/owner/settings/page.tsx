import type { Metadata } from 'next';
import { OwnerSettingsPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Configurações Globais — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function OwnerSettingsPage() {
  return <OwnerSettingsPageContent />;
}
