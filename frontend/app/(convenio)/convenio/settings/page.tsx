import type { Metadata } from 'next';
import { SettingsPageContent } from '@/features/settings';

export const metadata: Metadata = { title: 'Configurações — Abase Saúde' };
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return <SettingsPageContent />;
}
