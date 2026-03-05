import type { Metadata } from 'next';
import { OwnerUsersPageContent } from '@/features/owner';

export const metadata: Metadata = { title: 'Usuários — HealthApp Owner' };
export const dynamic = 'force-dynamic';

export default function UsersPage() {
  return <OwnerUsersPageContent />;
}
