/**
 * @file components/patterns/skeleton-table.tsx
 * @description Molécula — Skeleton loading para tabelas de dados.
 */

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface SkeletonTableProps {
  /** Número de colunas */
  columns?: number;
  /** Número de linhas de skeleton */
  rows?: number;
  /** Larguras relativas das colunas (ex: [2, 1, 1, 1]) */
  columnWidths?: number[];
  className?: string;
}

export function SkeletonTable({
  columns = 4,
  rows = 5,
  columnWidths,
  className,
}: SkeletonTableProps) {
  const widths = columnWidths ?? Array(columns).fill(1);
  const totalWeight = widths.reduce((a, b) => a + b, 0);

  const getWidth = (weight: number) => {
    const pct = Math.round((weight / totalWeight) * 100);
    return `${pct}%`;
  };

  return (
    <div className={cn('rounded-md border bg-card shadow-xs', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {widths.map((w, i) => (
              <TableHead key={i} style={{ width: getWidth(w) }}>
                <Skeleton className="h-4 w-3/4" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row}>
              {widths.map((w, col) => (
                <TableCell key={col}>
                  <Skeleton
                    className="h-4"
                    style={{ width: col === 0 ? '80%' : '60%' }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
