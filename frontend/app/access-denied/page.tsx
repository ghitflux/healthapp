'use client';

import Link from 'next/link';
import { ShieldIcon } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/auth';

export default function AccessDeniedPage() {
  const fallbackPath = authService.getRedirectPath();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <section className="w-full rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-100">
          <ShieldIcon className="h-7 w-7 text-warning-700" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Acesso negado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você não possui permissão para acessar esta área. Se acredita que isso é um erro,
          contate o administrador da plataforma.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link href={fallbackPath}>Ir para meu painel</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
