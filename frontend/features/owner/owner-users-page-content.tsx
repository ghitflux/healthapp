'use client';

import { useState } from 'react';
import type { AdminUserList } from '@api/types/AdminUserList';
import type { RoleEnum } from '@api/types/RoleEnum';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { PermissionTag } from '@/components/ds/permission-tag';
import { exportRowsToCsv, printRowsAsPdf } from '@/lib/export-utils';
import { formatDateTime } from '@/lib/formatters';
import { DownloadIcon, MoreHorizontalIcon } from '@/lib/icons';
import { useOwnerUsersList } from '@/hooks/owner';
import { mapRoleLabel } from '@/hooks/owner/utils';

const ROLE_OPTIONS: Array<{ label: string; value: RoleEnum | 'all' }> = [
  { label: 'Todos os perfis', value: 'all' },
  { label: 'Owner', value: 'owner' },
  { label: 'Admin Convênio', value: 'convenio_admin' },
  { label: 'Médico', value: 'doctor' },
  { label: 'Paciente', value: 'patient' },
];

export function OwnerUsersPageContent() {
  const list = useOwnerUsersList();
  const [selectedUser, setSelectedUser] = useState<AdminUserList | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const columns = [
    { key: 'full_name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'role', label: 'Perfil' },
    { key: 'status', label: 'Status' },
    { key: 'date_joined', label: 'Cadastro' },
  ];

  const rows = list.users.map((user) => ({
    full_name: user.full_name,
    email: user.email,
    role: mapRoleLabel(user.role),
    status: user.is_active ? 'Ativo' : 'Inativo',
    date_joined: formatDateTime(user.date_joined),
  }));

  return (
    <>
      <CrudTableTemplate
        title="Usuários"
        description="Gestão global de usuários da plataforma"
        toolbar={
          <DataTableToolbar
            searchValue={list.search}
            onSearch={list.handleSearch}
            searchPlaceholder="Buscar por nome ou e-mail..."
            actions={
              <>
                <Select
                  value={list.role}
                  onValueChange={(value) => list.handleRole(value as RoleEnum | 'all')}
                >
                  <SelectTrigger className="w-48 h-9 text-sm">
                    <SelectValue placeholder="Perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={list.status} onValueChange={(value) => list.handleStatus(value as typeof list.status)}>
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={list.ordering} onValueChange={list.handleOrdering}>
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue placeholder="Ordenação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-date_joined">Mais recentes</SelectItem>
                    <SelectItem value="date_joined">Mais antigos</SelectItem>
                    <SelectItem value="full_name">Nome A-Z</SelectItem>
                    <SelectItem value="-full_name">Nome Z-A</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => exportRowsToCsv('owner_users', columns, rows)}
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
                      'owner_users',
                      'Relatório de Usuários',
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
            <SkeletonTable rows={8} columns={6} />
          ) : list.isError ? (
            <ErrorStateBlock
              title="Erro ao carregar usuários"
              message="Não foi possível carregar a listagem de usuários."
              onRetry={() => void list.refetch()}
            />
          ) : list.users.length === 0 ? (
            <EmptyStateBlock
              title="Nenhum usuário encontrado"
              description="Ajuste os filtros para localizar usuários cadastrados."
            />
          ) : (
            <div className="rounded-md border bg-card shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedUser(user);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <PermissionTag role={user.role ?? 'patient'} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(user.date_joined)}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Ações do usuário</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDetailOpen(true);
                              }}
                            >
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>Bloquear usuário (endpoint indisponível)</DropdownMenuItem>
                            <DropdownMenuItem disabled>Resetar senha (endpoint indisponível)</DropdownMenuItem>
                            <DropdownMenuItem disabled>Anonimizar LGPD (endpoint indisponível)</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Usuário</SheetTitle>
            <SheetDescription>
              Visualização administrativa de dados cadastrais e status de verificação.
            </SheetDescription>
          </SheetHeader>

          {!selectedUser ? null : (
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-md border bg-card p-4 text-sm shadow-xs">
                <div>
                  <p className="text-muted-foreground">Perfil</p>
                  <p className="font-medium">{mapRoleLabel(selectedUser.role)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedUser.is_active ? 'Ativo' : 'Inativo'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-mail verificado</p>
                  <p className="font-medium">{selectedUser.email_verified ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone verificado</p>
                  <p className="font-medium">{selectedUser.phone_verified ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Convênio</p>
                  <p className="font-medium">{selectedUser.convenio_name || 'Não vinculado'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de cadastro</p>
                  <p className="font-medium">{formatDateTime(selectedUser.date_joined)}</p>
                </div>
              </div>

              <div className="rounded-md border border-warning-500/40 bg-warning-50 p-3 text-sm">
                <p className="font-medium text-warning-700">Escopo administrativo atual</p>
                <p className="text-warning-700/90">
                  As ações de bloqueio, reset de senha e anonimização LGPD ainda não possuem endpoint dedicado
                  no contrato atual. A visualização permanece somente informativa.
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
