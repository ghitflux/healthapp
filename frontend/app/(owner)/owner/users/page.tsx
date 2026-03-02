import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Usuários — HealthApp Owner' };

export default function UsersPage() {
  return <PagePlaceholder title="Usuários" description="Gerencie todos os usuários da plataforma" />;
}
