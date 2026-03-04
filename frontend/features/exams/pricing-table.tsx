'use client';

/**
 * @file features/exams/pricing-table.tsx
 * @description Tabela consolidada de preços: consultas + exames.
 * Histórico de sessão local (sem endpoint dedicado no backend ainda).
 */

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { CurrencyText } from '@/components/ds/currency-text';
import { DateTimeText } from '@/components/ds/datetime-text';
import { EditIcon, LoaderIcon } from '@/lib/icons';
import type { DoctorList } from '@api/types/DoctorList';
import type { ExamType } from '@api/types/ExamType';

type PriceCategory = 'all' | 'consultation' | 'exam';

interface PriceHistoryEntry {
  id: string;
  name: string;
  category: 'consultation' | 'exam';
  oldPrice: number;
  newPrice: number;
  changedAt: string;
}

interface EditPriceState {
  id: string;
  name: string;
  category: 'consultation' | 'exam';
  currentPrice: string;
}

interface PricingTableProps {
  doctors: DoctorList[];
  examTypes: ExamType[];
  isLoadingDoctors: boolean;
  isLoadingExams: boolean;
  onPatchDoctor: (id: string, price: string) => Promise<void>;
  onPatchExamType: (id: string, price: string) => Promise<void>;
}

export function PricingTable({
  doctors,
  examTypes,
  isLoadingDoctors,
  isLoadingExams,
  onPatchDoctor,
  onPatchExamType,
}: PricingTableProps) {
  const [category, setCategory] = useState<PriceCategory>('all');
  const [editState, setEditState] = useState<EditPriceState | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Histórico de sessão local (persiste até recarregar a página)
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);

  const isLoading = isLoadingDoctors || isLoadingExams;

  if (isLoading) return <SkeletonTable rows={8} columns={5} />;

  // Build unified rows
  const consultationRows = (category === 'all' || category === 'consultation')
    ? doctors.map((d) => ({
        id: d.id,
        name: d.user_name,
        detail: d.specialty,
        category: 'consultation' as const,
        price: d.consultation_price ?? '0.00',
        isActive: d.is_available ?? true,
        updatedAt: undefined as string | undefined,
      }))
    : [];

  const examRows = (category === 'all' || category === 'exam')
    ? examTypes.map((e) => ({
        id: e.id,
        name: e.name,
        detail: `${e.duration_minutes ?? '?'} min`,
        category: 'exam' as const,
        price: e.price,
        isActive: e.is_active ?? true,
        updatedAt: e.updated_at,
      }))
    : [];

  const rows = [...consultationRows, ...examRows];

  function openEdit(row: typeof rows[0]) {
    setEditState({ id: row.id, name: row.name, category: row.category, currentPrice: row.price });
    setEditValue(row.price);
  }

  async function handleEditSubmit() {
    if (!editState || !editValue) return;
    const newPrice = parseFloat(editValue);
    if (isNaN(newPrice) || newPrice < 0) return;

    setIsSubmitting(true);
    try {
      const oldPrice = parseFloat(editState.currentPrice);
      if (editState.category === 'consultation') {
        await onPatchDoctor(editState.id, newPrice.toFixed(2));
      } else {
        await onPatchExamType(editState.id, newPrice.toFixed(2));
      }
      // Registrar no histórico de sessão
      setHistory((prev) => [
        {
          id: editState.id,
          name: editState.name,
          category: editState.category,
          oldPrice,
          newPrice,
          changedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setEditState(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={category} onValueChange={(v) => setCategory(v as PriceCategory)}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="consultation">Consultas</SelectItem>
            <SelectItem value="exam">Exames</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{rows.length} itens</span>
      </div>

      {/* Pricing table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead>Preço Atual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={`${row.category}-${row.id}`}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {row.category === 'consultation' ? 'Consulta' : 'Exame'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.detail}</TableCell>
                  <TableCell>
                    <CurrencyText value={parseFloat(row.price)} className="font-semibold" />
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? 'default' : 'secondary'}>
                      {row.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.updatedAt ? (
                      <DateTimeText value={row.updatedAt} variant="date" className="text-xs text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                      <EditIcon className="h-4 w-4" />
                      <span className="sr-only">Editar preço</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Session history */}
      {history.length > 0 && (
        <div className="rounded-md border">
          <div className="px-4 py-2.5 border-b bg-muted/30">
            <p className="text-sm font-medium">Histórico de Alterações (sessão atual)</p>
            <p className="text-xs text-muted-foreground">
              Histórico persistente depende de endpoint futuro no backend.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Anterior</TableHead>
                <TableHead>Novo</TableHead>
                <TableHead>Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{h.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {h.category === 'consultation' ? 'Consulta' : 'Exame'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CurrencyText value={h.oldPrice} className="text-muted-foreground line-through text-sm" />
                  </TableCell>
                  <TableCell>
                    <CurrencyText value={h.newPrice} className="text-sm font-medium" />
                  </TableCell>
                  <TableCell>
                    <DateTimeText value={h.changedAt} variant="relative" className="text-xs text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit price dialog */}
      <Dialog open={!!editState} onOpenChange={(v) => !v && setEditState(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Preço</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {editState?.category === 'consultation' ? 'Consulta' : 'Exame'}:{' '}
              <strong>{editState?.name}</strong>
            </p>
            <div>
              <label className="text-sm font-medium">Novo Preço (R$)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="mt-1"
                aria-label="Novo preço"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditState(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting && <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
