import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';

const OwnerUsersPageContent = dynamicImport(
  () => import('@/features/owner').then((module) => module.OwnerUsersPageContent),
  {
    loading: () => <div className="h-80 animate-pulse rounded-md border bg-muted/40" />,
  }
);

export const metadata: Metadata = { title: 'Usuários — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function UsersPage() {
  return <OwnerUsersPageContent />;
}
