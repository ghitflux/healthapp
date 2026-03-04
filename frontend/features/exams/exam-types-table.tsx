'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { CurrencyText } from '@/components/ds/currency-text';
import { DateTimeText } from '@/components/ds/datetime-text';
import { MoreHorizontalIcon, EditIcon, TrashIcon } from '@/lib/icons';
import type { ExamType } from '@api/types/ExamType';

interface ExamTypesTableProps {
  examTypes: ExamType[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (et: ExamType) => void;
  onDelete: (et: ExamType) => void;
  onCreate: () => void;
}

export function ExamTypesTable({
  examTypes,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onCreate,
}: ExamTypesTableProps) {
  if (isLoading) return <SkeletonTable rows={6} columns={6} />;

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar tipos de exame"
        message="Não foi possível carregar os dados. Tente novamente."
        onRetry={onRetry}
      />
    );
  }

  if (examTypes.length === 0) {
    return (
      <EmptyStateBlock
        title="Nenhum tipo de exame cadastrado"
        description="Cadastre o primeiro tipo de exame do convênio."
        action={{ label: 'Novo Tipo de Exame', onClick: onCreate }}
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {examTypes.map((et) => (
            <TableRow key={et.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{et.name}</p>
                  {et.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {et.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{et.duration_minutes ?? '—'} min</TableCell>
              <TableCell>
                <CurrencyText value={parseFloat(et.price)} />
              </TableCell>
              <TableCell>
                <Badge variant={et.is_active ? 'default' : 'secondary'}>
                  {et.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <DateTimeText value={et.updated_at} variant="date" className="text-sm text-muted-foreground" />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(et)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(et)}
                      className="text-destructive focus:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
