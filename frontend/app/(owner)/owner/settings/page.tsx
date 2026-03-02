import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Configurações Globais — HealthApp Owner' };

export default function OwnerSettingsPage() {
  return <PagePlaceholder title="Configurações Globais" description="Configurações da plataforma HealthApp" />;
}
