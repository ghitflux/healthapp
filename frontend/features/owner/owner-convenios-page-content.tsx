'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod/v4';
import { useGetAdminConvenioById } from '@api/hooks/useOwner';
import type { AdminConvenioList } from '@api/types/AdminConvenioList';
import type { AdminConvenioDetail } from '@api/types/AdminConvenioDetail';
import { createConvenioMutationRequestSchema } from '@api/zod/ownerSchemas/createConvenioSchema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { CrudTableTemplate } from '@/components/templates/crud-table-template';
import { DataTableToolbar } from '@/components/patterns/data-table-toolbar';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { exportRowsToCsv, printRowsAsPdf } from '@/lib/export-utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  CheckCircleIcon,
  DownloadIcon,
  LoaderIcon,
  MoreHorizontalIcon,
  BanIcon,
  PlusIcon,
  TrashIcon,
} from '@/lib/icons';
import { queryClient } from '@/lib/query-client';
import { useOwnerConveniosList, useOwnerMutations } from '@/hooks/owner';
import { asNumber } from '@/hooks/owner/utils';
import { maskCnpjInput, maskPhoneInput } from '@/lib/input-masks';

type CreateConvenioValues = z.infer<typeof createConvenioMutationRequestSchema>;

type ConvenioAction = 'approve' | 'suspend' | 'delete';

function parseConvenioDetail(payload: unknown): AdminConvenioDetail | null {
  if (!payload || typeof payload !== 'object') return null;
  const envelope = payload as { data?: AdminConvenioDetail };
  return envelope.data ?? (payload as AdminConvenioDetail);
}

function getStatusBadge(convenio: AdminConvenioList) {
  if (!convenio.is_active) {
    return <Badge variant="secondary">Suspenso</Badge>;
  }
  if (!convenio.is_approved) {
    return <Badge className="bg-warning-500 text-white">Pendente</Badge>;
  }
  return <Badge className="bg-success-600 text-white">Aprovado</Badge>;
}

export function OwnerConveniosPageContent() {
  const list = useOwnerConveniosList();
  const mutations = useOwnerMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<AdminConvenioList | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<AdminConvenioList | null>(null);
  const [actionType, setActionType] = useState<ConvenioAction | null>(null);

  const detailQuery = useGetAdminConvenioById(selectedConvenio?.id ?? '', {
    query: {
      client: queryClient,
      enabled: detailOpen && !!selectedConvenio,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  });

  const detail = useMemo(() => parseConvenioDetail(detailQuery.data), [detailQuery.data]);

  const createForm = useForm<CreateConvenioValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createConvenioMutationRequestSchema as any),
    defaultValues: {
      name: '',
      cnpj: '',
      contact_email: '',
      contact_phone: '',
      description: '',
      subscription_plan: '',
      is_active: true,
    },
  });

  async function handleCreateSubmit(values: CreateConvenioValues) {
    await mutations.createConvenio(values);
    setCreateOpen(false);
    createForm.reset();
  }

  async function handleConfirmAction() {
    if (!actionTarget || !actionType) return;

    if (actionType === 'approve') {
      await mutations.approveConvenio(actionTarget.id);
    }

    if (actionType === 'suspend') {
      await mutations.suspendConvenio(actionTarget.id);
    }

    if (actionType === 'delete') {
      await mutations.deleteConvenio(actionTarget.id);
    }

    setActionTarget(null);
    setActionType(null);
  }

  const exportingColumns = [
    { key: 'name', label: 'Nome' },
    { key: 'status', label: 'Status' },
    { key: 'plan', label: 'Plano' },
    { key: 'doctors_count', label: 'Médicos' },
    { key: 'created_at', label: 'Criado em' },
  ];

  const exportingRows = list.convenios.map((convenio) => ({
    name: convenio.name,
    status: !convenio.is_active ? 'Suspenso' : convenio.is_approved ? 'Aprovado' : 'Pendente',
    plan: convenio.subscription_plan ?? '—',
    doctors_count: convenio.doctors_count,
    created_at: formatDate(convenio.created_at),
  }));

  const actionDescriptionByType: Record<ConvenioAction, string> = {
    approve: 'Esta ação aprova o convênio e libera acesso operacional no painel.',
    suspend: 'Esta ação suspende o convênio e interrompe o uso operacional até nova intervenção administrativa.',
    delete: 'Esta ação remove o convênio. Este fluxo é irreversível e deve ser usado com extremo cuidado.',
  };

  const actionPending =
    mutations.isApprovingConvenio || mutations.isSuspendingConvenio || mutations.isDeletingConvenio;

  return (
    <>
      <CrudTableTemplate
        title="Convênios"
        description="Gestão operacional de convênios da plataforma"
        createLabel="Novo Convênio"
        onCreate={() => setCreateOpen(true)}
        toolbar={
          <DataTableToolbar
            searchValue={list.search}
            onSearch={list.handleSearch}
            searchPlaceholder="Buscar por nome do convênio..."
            actions={
              <>
                <Select value={list.status} onValueChange={(value) => list.handleStatus(value as typeof list.status)}>
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Suspensos</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={list.ordering} onValueChange={list.handleOrdering}>
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue placeholder="Ordenação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome A-Z</SelectItem>
                    <SelectItem value="-name">Nome Z-A</SelectItem>
                    <SelectItem value="-created_at">Mais recentes</SelectItem>
                    <SelectItem value="created_at">Mais antigos</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => exportRowsToCsv('owner_convenios', exportingColumns, exportingRows)}
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
                      'owner_convenios',
                      'Relatório de Convênios',
                      'Exportação filtrada da visualização atual.',
                      exportingColumns,
                      exportingRows
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
              title="Erro ao carregar convênios"
              message="Não foi possível carregar a lista de convênios."
              onRetry={() => void list.refetch()}
            />
          ) : list.convenios.length === 0 ? (
            <EmptyStateBlock
              title="Nenhum convênio encontrado"
              description="Ajuste os filtros ou crie um novo convênio para iniciar a gestão." 
              action={{ label: 'Novo Convênio', onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Médicos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.convenios.map((convenio) => (
                    <TableRow
                      key={convenio.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedConvenio(convenio);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{convenio.name}</TableCell>
                      <TableCell>{getStatusBadge(convenio)}</TableCell>
                      <TableCell>{convenio.subscription_plan ?? '—'}</TableCell>
                      <TableCell className="text-right">{convenio.doctors_count}</TableCell>
                      <TableCell>{formatDate(convenio.created_at)}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Ações do convênio</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedConvenio(convenio);
                                setDetailOpen(true);
                              }}
                            >
                              Ver detalhes
                            </DropdownMenuItem>

                            {!convenio.is_approved && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionType('approve');
                                  setActionTarget(convenio);
                                }}
                              >
                                <CheckCircleIcon className="mr-2 h-4 w-4" />
                                Aprovar
                              </DropdownMenuItem>
                            )}

                            {convenio.is_active ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionType('suspend');
                                  setActionTarget(convenio);
                                }}
                                className="text-warning-700"
                              >
                                <BanIcon className="mr-2 h-4 w-4" />
                                Suspender
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                Reativação indisponível no contrato atual
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => {
                                setActionType('delete');
                                setActionTarget(convenio);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Convênio</DialogTitle>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do convênio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          value={maskCnpjInput(field.value ?? '')}
                          onChange={(event) => field.onChange(maskCnpjInput(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail de contato</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@convenio.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          value={maskPhoneInput(field.value ?? '')}
                          onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="subscription_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano</FormLabel>
                    <FormControl>
                      <Input placeholder="basic / pro / enterprise" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Descrição operacional do convênio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutations.isCreatingConvenio}>
                  {mutations.isCreatingConvenio && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Criar convênio
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Convênio</SheetTitle>
            <SheetDescription>
              Dados cadastrais, status operacional e métricas de performance do convênio.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {!selectedConvenio ? null : detailQuery.isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            ) : detailQuery.isError ? (
              <ErrorStateBlock
                title="Erro ao carregar detalhes"
                message="Não foi possível carregar os detalhes deste convênio."
                onRetry={() => void detailQuery.refetch()}
              />
            ) : !detail ? (
              <EmptyStateBlock
                title="Detalhes indisponíveis"
                description="Nenhum dado detalhado retornado para este convênio."
              />
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{detail.name}</h3>
                  <p className="text-sm text-muted-foreground">CNPJ: {detail.cnpj}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-md border p-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{!detail.is_active ? 'Suspenso' : detail.is_approved ? 'Aprovado' : 'Pendente'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plano</p>
                    <p className="font-medium">{detail.subscription_plan ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contato</p>
                    <p className="font-medium">{detail.contact_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{detail.contact_phone}</p>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <p className="mb-2 text-sm font-medium">Métricas do mês</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Médicos</p>
                      <p className="font-semibold">{asNumber(detail.metrics?.doctors_count).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Agendamentos</p>
                      <p className="font-semibold">{asNumber(detail.metrics?.appointments_month).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Receita</p>
                      <p className="font-semibold">{formatCurrency(asNumber(detail.metrics?.revenue_month))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cancelamentos</p>
                      <p className="font-semibold">{asNumber(detail.metrics?.cancelled_month).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!actionTarget && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setActionTarget(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && 'Aprovar convênio'}
              {actionType === 'suspend' && 'Suspender convênio'}
              {actionType === 'delete' && 'Excluir convênio'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.name ? (
                <>
                  <strong>{actionTarget.name}</strong>
                  <br />
                </>
              ) : null}
              {actionType ? actionDescriptionByType[actionType] : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={actionPending}
              onClick={() => {
                setActionTarget(null);
                setActionType(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionPending}
              onClick={async (event) => {
                event.preventDefault();
                await handleConfirmAction();
              }}
              className={actionType === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {actionPending && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
