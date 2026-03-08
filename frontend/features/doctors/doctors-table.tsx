'use client';

/**
 * @file features/doctors/doctors-table.tsx
 * @description Tabela de médicos com colunas, ações e skeleton de loading.
 */

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
import { RatingStars } from '@/components/ds/rating-stars';
import { CurrencyText } from '@/components/ds/currency-text';
import { DateTimeText } from '@/components/ds/datetime-text';
import { MoreHorizontalIcon, EditIcon, TrashIcon } from '@/lib/icons';
import type { DoctorList } from '@api/types/DoctorList';

interface DoctorsTableProps {
  doctors: DoctorList[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (doctor: DoctorList) => void;
  onDelete: (doctor: DoctorList) => void;
  onView: (doctor: DoctorList) => void;
  onCreate: () => void;
}

export function DoctorsTable({
  doctors,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onView,
  onCreate,
}: DoctorsTableProps) {
  if (isLoading) {
    return <SkeletonTable rows={8} columns={7} />;
  }

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar médicos"
        message="Não foi possível carregar a lista de médicos. Tente novamente."
        onRetry={onRetry}
      />
    );
  }

  if (doctors.length === 0) {
    return (
      <EmptyStateBlock
        title="Nenhum médico encontrado"
        description="Cadastre o primeiro médico vinculado a sua clínica."
        action={{ label: 'Novo Médico', onClick: onCreate }}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Especialidade</TableHead>
            <TableHead className="hidden lg:table-cell">Próximo horário</TableHead>
            <TableHead>Preço Consulta</TableHead>
            <TableHead className="hidden md:table-cell">Avaliação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doctor) => (
            <TableRow
              key={doctor.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(doctor)}
            >
              <TableCell className="font-medium">{doctor.user_name}</TableCell>
              <TableCell>{doctor.specialty}</TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {doctor.next_available_date ? (
                  <div className="space-y-0.5">
                    <DateTimeText value={doctor.next_available_date} variant="date" />
                    {doctor.next_available_time && (
                      <p className="text-xs text-muted-foreground">{doctor.next_available_time}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sem agenda</span>
                )}
              </TableCell>
              <TableCell>
                {doctor.consultation_price ? (
                  <CurrencyText value={parseFloat(doctor.consultation_price)} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1.5">
                  <RatingStars value={parseFloat(doctor.rating ?? '0')} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    ({doctor.total_ratings})
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={doctor.is_available ? 'default' : 'secondary'}>
                  {doctor.is_available ? 'Disponível' : 'Indisponível'}
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(doctor)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(doctor)}
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
