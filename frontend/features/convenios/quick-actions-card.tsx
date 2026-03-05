'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const today = format(new Date(), 'yyyy-MM-dd');

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acoes rapidas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button asChild className="justify-start">
          <Link href={`/convenio/appointments?from=${today}&to=${today}`}>
            Ver agendamentos de hoje
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/convenio/doctors">Novo medico</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/convenio/financial">Ver relatorio</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
