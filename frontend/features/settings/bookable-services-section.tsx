'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DecimalInput } from '@/components/ui/decimal-input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { Input } from '@/components/ui/input';
import { IntegerInput } from '@/components/ui/integer-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyText } from '@/components/ds/currency-text';
import { EditIcon, LoaderIcon, PlusIcon, SaveIcon, TrashIcon } from '@/lib/icons';
import {
  COMMISSION_TYPE_OPTIONS,
  createEmptyBookableService,
  sanitizeBookableServices,
  SERVICE_MODALITY_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  type BookableService,
} from './convenio-settings';

interface BookableServicesSectionProps {
  services: BookableService[];
  onSave: (services: BookableService[]) => Promise<void>;
  isSubmitting: boolean;
  title?: string;
  description?: string;
}

function getOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string,
  fallback: string
) {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value : 0}%`;
}

export function BookableServicesSection({
  services,
  onSave,
  isSubmitting,
  title = 'Serviços e comissões',
  description = 'Cadastre exames, consultas e retornos disponíveis no app sem depender de um médico específico.',
}: BookableServicesSectionProps) {
  const [draftServices, setDraftServices] = useState<BookableService[]>(services);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftService, setDraftService] = useState<BookableService>(createEmptyBookableService());
  const [draftError, setDraftError] = useState('');

  useEffect(() => {
    setDraftServices(services);
  }, [services]);

  const hasPendingChanges = useMemo(
    () =>
      JSON.stringify(sanitizeBookableServices(draftServices)) !==
      JSON.stringify(sanitizeBookableServices(services)),
    [draftServices, services]
  );

  function openCreate(serviceType?: BookableService['service_type']) {
    setDraftError('');
    setDraftService(createEmptyBookableService(serviceType));
    setDialogOpen(true);
  }

  function openEdit(service: BookableService) {
    setDraftError('');
    setDraftService(service);
    setDialogOpen(true);
  }

  function updateDraft<K extends keyof BookableService>(field: K, value: BookableService[K]) {
    setDraftService((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSaveDraft() {
    if (!draftService.name.trim()) {
      setDraftError('Informe o nome do serviço.');
      return;
    }

    setDraftServices((current) => {
      const exists = current.some((service) => service.id === draftService.id);
      if (exists) {
        return current.map((service) => (service.id === draftService.id ? draftService : service));
      }

      return [draftService, ...current];
    });

    setDialogOpen(false);
  }

  function handleRemove(id: string) {
    setDraftServices((current) => current.filter((service) => service.id !== id));
  }

  function handleReset() {
    setDraftServices(services);
  }

  async function handlePersist() {
    await onSave(draftServices);
  }

  return (
    <Card>
      <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => openCreate('consultation')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova consulta
          </Button>
          <Button type="button" variant="outline" onClick={() => openCreate('exam')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo exame
          </Button>
          <Button type="button" variant="outline" onClick={() => openCreate('return_visit')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo retorno
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {draftServices.length === 0 ? (
          <EmptyStateBlock
            title="Nenhum serviço cadastrado"
            description="Cadastre os serviços que poderão aparecer no aplicativo para o paciente."
            action={{ label: 'Criar primeiro serviço', onClick: () => openCreate('consultation') }}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Repasse</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draftServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="min-w-[220px]">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.category ? (
                          <p className="text-xs text-muted-foreground">{service.category}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getOptionLabel(SERVICE_TYPE_OPTIONS, service.service_type, 'Serviço')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getOptionLabel(SERVICE_MODALITY_OPTIONS, service.modality, 'Presencial')}
                    </TableCell>
                    <TableCell>{service.duration_minutes} min</TableCell>
                    <TableCell>
                      <CurrencyText value={Number.parseFloat(service.price || '0')} />
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>Profissional: {formatPercent(service.professional_percentage)}</div>
                      <div className="text-muted-foreground">
                        Clínica: {formatPercent(service.convenio_percentage)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.commission_type === 'fixed' ? (
                        <CurrencyText value={Number.parseFloat(service.commission_value || '0')} />
                      ) : (
                        <span>{formatPercent(Number.parseFloat(service.commission_value || '0'))}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.app_booking_enabled ? 'default' : 'secondary'}>
                        {service.app_booking_enabled ? 'Publicado' : 'Oculto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(service)}
                        >
                          <EditIcon className="h-4 w-4" />
                          <span className="sr-only">Editar serviço</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemove(service.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Remover serviço</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/15 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium">
              {hasPendingChanges ? 'Existem alterações pendentes.' : 'Catálogo sincronizado.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Os serviços salvos aqui podem alimentar preço, comissão e disponibilidade do app.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!hasPendingChanges}>
              Restaurar
            </Button>
            <Button type="button" onClick={handlePersist} disabled={isSubmitting || !hasPendingChanges}>
              {isSubmitting ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-2 h-4 w-4" />
              )}
              Salvar catálogo
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {draftServices.some((service) => service.id === draftService.id)
                ? 'Editar serviço'
                : 'Novo serviço'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service-name">Nome do serviço</Label>
              <Input
                id="service-name"
                value={draftService.name}
                onChange={(event) => updateDraft('name', event.target.value)}
                placeholder="Ex: Consulta clínica geral"
              />
              {draftError ? <p className="text-sm font-medium text-destructive">{draftError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={draftService.service_type}
                onValueChange={(value) =>
                  updateDraft('service_type', value as BookableService['service_type'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Select
                value={draftService.modality}
                onValueChange={(value) => updateDraft('modality', value as BookableService['modality'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_MODALITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-category">Categoria</Label>
              <Input
                id="service-category"
                value={draftService.category}
                onChange={(event) => updateDraft('category', event.target.value)}
                placeholder="Ex: Check-up, imagem, ortopedia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-duration">Duração (min)</Label>
              <IntegerInput
                id="service-duration"
                value={draftService.duration_minutes}
                onValueChange={(value) => updateDraft('duration_minutes', value ?? 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-price">Preço (R$)</Label>
              <DecimalInput
                id="service-price"
                value={draftService.price}
                onValueChange={(value) => updateDraft('price', value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-commission-value">Comissão</Label>
              <DecimalInput
                id="service-commission-value"
                value={draftService.commission_value}
                onValueChange={(value) => updateDraft('commission_value', value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de comissão</Label>
              <Select
                value={draftService.commission_type}
                onValueChange={(value) =>
                  updateDraft('commission_type', value as BookableService['commission_type'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COMMISSION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-professional-percentage">Repasse profissional (%)</Label>
              <DecimalInput
                id="service-professional-percentage"
                value={draftService.professional_percentage}
                onValueChange={(value) =>
                  updateDraft(
                    'professional_percentage',
                    value === '' ? 0 : Number.parseFloat(value)
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-clinic-percentage">Repasse clínica (%)</Label>
              <DecimalInput
                id="service-clinic-percentage"
                value={draftService.convenio_percentage}
                onValueChange={(value) =>
                  updateDraft('convenio_percentage', value === '' ? 0 : Number.parseFloat(value))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service-notes">Observações internas</Label>
              <Textarea
                id="service-notes"
                rows={3}
                value={draftService.notes}
                onChange={(event) => updateDraft('notes', event.target.value)}
                placeholder="Informações operacionais, observações de faturamento ou regras internas."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service-preparation">Instruções para o paciente</Label>
              <Textarea
                id="service-preparation"
                rows={3}
                value={draftService.preparation}
                onChange={(event) => updateDraft('preparation', event.target.value)}
                placeholder="Jejum, documentos, tempo de antecedência e preparo necessário."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">Disponível no app</p>
                <p className="text-xs text-muted-foreground">
                  Exibe este serviço para o paciente agendar.
                </p>
              </div>
              <Switch
                checked={draftService.app_booking_enabled}
                onCheckedChange={(checked) => updateDraft('app_booking_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">Serviço ativo</p>
                <p className="text-xs text-muted-foreground">
                  Mantém preço e comissão disponíveis para uso.
                </p>
              </div>
              <Switch
                checked={draftService.is_active}
                onCheckedChange={(checked) => updateDraft('is_active', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveDraft}>
              Salvar serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
