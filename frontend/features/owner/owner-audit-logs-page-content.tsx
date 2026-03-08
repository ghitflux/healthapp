'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CrudTableTemplate } from '@/components/templates/crud-table-template';
import { DataTableToolbar } from '@/components/patterns/data-table-toolbar';
import { DatePicker } from '@/components/ui/date-picker';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { exportRowsToCsv, printRowsAsPdf } from '@/lib/export-utils';
import { formatDateTime } from '@/lib/formatters';
import { DownloadIcon } from '@/lib/icons';
import { useOwnerAuditLogsList } from '@/hooks/owner';
import { mapAuditActionLabel } from '@/hooks/owner/utils';

function summarizeChanges(changes: unknown): string {
  if (!changes || typeof changes !== 'object') {
    return 'Sem detalhamento';
  }

  const entries = Object.entries(changes as Record<string, unknown>);
  if (entries.length === 0) return 'Sem alterações detalhadas';

  const preview = entries
    .slice(0, 2)
    .map(([field, value]) => {
      if (Array.isArray(value) && value.length === 2) {
        return `${field}: ${String(value[0])} -> ${String(value[1])}`;
      }
      return `${field}: ${String(value)}`;
    })
    .join(' | ');

  if (entries.length > 2) {
    return `${preview} | +${entries.length - 2} alterações`;
  }

  return preview;
}

export function OwnerAuditLogsPageContent() {
  const list = useOwnerAuditLogsList();

  const columns = [
    { key: 'timestamp', label: 'Timestamp', nowrap: true },
    { key: 'actor', label: 'Ator' },
    { key: 'action', label: 'Ação' },
    { key: 'entity', label: 'Entidade' },
    { key: 'summary', label: 'Resumo' },
  ];

  const rows = useMemo(
    () =>
      list.logs.map((log) => ({
        timestamp: log.timestamp ? formatDateTime(log.timestamp) : '—',
        actor: log.actor_email || 'Sistema',
        action: mapAuditActionLabel(String(log.action)),
        entity: log.model_name,
        summary: summarizeChanges(log.changes),
      })),
    [list.logs]
  );

  return (
    <CrudTableTemplate
      title="Logs de Auditoria"
      description="Rastreamento de ações administrativas e operacionais (LGPD)."
      toolbar={
        <DataTableToolbar
          searchValue={list.search}
          onSearch={list.handleSearch}
          searchPlaceholder="Buscar por ator, entidade ou objeto..."
          actions={
            <>
              <Select value={list.action || 'all'} onValueChange={(value) => list.handleAction(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="create">Criação</SelectItem>
                  <SelectItem value="update">Atualização</SelectItem>
                  <SelectItem value="delete">Exclusão</SelectItem>
                  <SelectItem value="access">Acesso</SelectItem>
                </SelectContent>
              </Select>

              <input
                type="text"
                value={list.modelName}
                onChange={(event) => list.handleModel(event.target.value)}
                className="h-9 w-36 rounded-md border border-input bg-background px-2 text-sm shadow-xs"
                placeholder="Entidade"
                aria-label="Filtro por entidade"
              />

              <input
                type="text"
                value={list.user}
                onChange={(event) => list.handleUser(event.target.value)}
                className="h-9 w-44 rounded-md border border-input bg-background px-2 text-sm shadow-xs"
                placeholder="UUID do ator"
                aria-label="Filtro por usuário"
              />

              <DatePicker
                className="w-[160px]"
                value={list.dateFrom}
                onChange={(value) => list.handleDateFrom(value ?? '')}
                aria-label="Data inicial"
              />

              <DatePicker
                className="w-[160px]"
                value={list.dateTo}
                min={list.dateFrom || undefined}
                onChange={(value) => list.handleDateTo(value ?? '')}
                aria-label="Data final"
              />

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => exportRowsToCsv('owner_audit_logs', columns, rows)}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                CSV
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  printRowsAsPdf(
                    'owner_audit_logs',
                    'Relatório de Auditoria',
                    'Exportação filtrada da visualização atual.',
                    columns,
                    rows
                  )
                }
              >
                PDF
              </Button>
            </>
          }
        />
      }
      table={
        list.isLoading ? (
          <SkeletonTable rows={8} columns={5} />
        ) : list.isError ? (
          <ErrorStateBlock
            title="Erro ao carregar logs"
            message="Não foi possível carregar os logs de auditoria."
            onRetry={() => void list.refetch()}
          />
        ) : list.logs.length === 0 ? (
          <EmptyStateBlock
            title="Nenhum log encontrado"
            description="Ajuste os filtros para localizar registros de auditoria."
          />
        ) : (
          <div className="rounded-md border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Ator</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Resumo da mudança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {log.timestamp ? formatDateTime(log.timestamp) : '—'}
                    </TableCell>
                    <TableCell>{log.actor_email || 'Sistema'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{mapAuditActionLabel(String(log.action))}</Badge>
                    </TableCell>
                    <TableCell>{log.model_name}</TableCell>
                    <TableCell className="max-w-md text-xs text-muted-foreground">
                      {summarizeChanges(log.changes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      }
      pagination={
        list.totalPages > 1 ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => list.setPage(Math.max(1, list.page - 1))}
                  aria-disabled={list.page <= 1}
                  className={list.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 py-2 text-sm">
                  Página {list.page} de {list.totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => list.setPage(Math.min(list.totalPages, list.page + 1))}
                  aria-disabled={list.page >= list.totalPages}
                  className={list.page >= list.totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : undefined
      }
    />
  );
}
