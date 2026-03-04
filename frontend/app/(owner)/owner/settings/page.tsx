import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';

const OwnerSettingsPageContent = dynamicImport(
  () => import('@/features/owner').then((module) => module.OwnerSettingsPageContent),
  {
    loading: () => <div className="h-80 animate-pulse rounded-md border bg-muted/40" />,
  }
);

export const metadata: Metadata = { title: 'Configurações Globais — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function OwnerSettingsPage() {
  return <OwnerSettingsPageContent />;
}
