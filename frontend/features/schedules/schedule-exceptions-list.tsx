'use client';

/**
 * @file features/schedules/schedule-exceptions-list.tsx
 * @description Tabela de exceções de agenda com loading, empty e error states.
 */

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { TrashIcon, CalendarXIcon, PlusIcon } from '@/lib/icons';
import type { ScheduleException } from '@api/types/ScheduleException';

interface ScheduleExceptionsListProps {
  exceptions: ScheduleException[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDelete: (exception: ScheduleException) => void;
  onAdd: () => void;
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function ScheduleExceptionsList({
  exceptions,
  isLoading,
  isError,
  onRetry,
  onDelete,
  onAdd,
}: ScheduleExceptionsListProps) {
  if (isLoading) {
    return (
      <SkeletonTable
        rows={4}
        columns={6}
        columnWidths={[2, 2, 1, 1, 2, 1]}
      />
    );
  }

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar exceções"
        message="Não foi possível carregar as exceções de agenda. Tente novamente."
        onRetry={onRetry}
      />
    );
  }

  if (exceptions.length === 0) {
    return (
      <EmptyStateBlock
        icon={CalendarXIcon}
        title="Nenhuma exceção cadastrada"
        description="Adicione bloqueios, férias ou feriados na agenda deste médico."
        action={{ label: 'Nova Exceção', onClick: onAdd }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Table header actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {exceptions.length} exceç{exceptions.length === 1 ? 'ão' : 'ões'}
        </span>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Nova Exceção
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="hidden md:table-cell">Dia Inteiro</TableHead>
              <TableHead className="hidden sm:table-cell">Disponível</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {exceptions.map((exc) => (
              <TableRow key={exc.id}>
                <TableCell className="font-medium">
                  {formatDate(exc.date)}
                </TableCell>

                <TableCell className="text-muted-foreground text-sm">
                  {exc.is_full_day ? (
                    <span className="italic">Dia inteiro</span>
                  ) : exc.start_time && exc.end_time ? (
                    `${exc.start_time} – ${exc.end_time}`
                  ) : exc.start_time ? (
                    `A partir de ${exc.start_time}`
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {exc.is_full_day ? (
                    <Badge variant="secondary">Sim</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Não</span>
                  )}
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  {exc.is_available ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      Disponível
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Bloqueado</Badge>
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                  {exc.reason || <span className="opacity-40">—</span>}
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(exc)}
                    aria-label="Excluir exceção"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
