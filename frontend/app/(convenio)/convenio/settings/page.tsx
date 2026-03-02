import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/feedback/page-placeholder';

export const metadata: Metadata = { title: 'Configurações — HealthApp' };

export default function SettingsPage() {
  return <PagePlaceholder title="Configurações" description="Configurações do convênio" />;
}
