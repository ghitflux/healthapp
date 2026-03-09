import type { Metadata } from 'next';
import { ExamsPageContent } from '@/features/exams';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tipos de Exame — Abase Saúde' };

export default function ExamsPage() {
  return <ExamsPageContent />;
}
