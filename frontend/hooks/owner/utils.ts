import type { RoleEnum } from '@api/types/RoleEnum';

export type OwnerPeriod = '7d' | '30d' | '90d' | 'custom';

export interface DateWindow {
  start: Date;
  end: Date;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

type SeriesCollection = Record<string, SeriesPoint[]>;
type MergedSeriesPoint = Record<string, string | number>;

interface ApiEnvelope<T> {
  data?: T;
}

export function unwrapEnvelope<T>(payload: T | ApiEnvelope<T> | undefined | null): T | undefined {
  if (!payload) return undefined;
  if (typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function asInteger(value: unknown): number {
  return Math.trunc(asNumber(value));
}

export function asDate(value: unknown): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDateWindow(
  period: OwnerPeriod,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): DateWindow {
  const end = new Date(now);
  const start = new Date(now);

  if (period === 'custom' && customStart && customEnd) {
    const parsedStart = asDate(customStart);
    const parsedEnd = asDate(customEnd);
    if (parsedStart && parsedEnd) {
      return {
        start: parsedStart,
        end: parsedEnd,
      };
    }
  }

  const daysByPeriod: Record<Exclude<OwnerPeriod, 'custom'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const days = period === 'custom' ? 30 : daysByPeriod[period];
  start.setDate(start.getDate() - (days - 1));

  return { start, end };
}

export function isDateInRange(date: Date | null, window: DateWindow): boolean {
  if (!date) return false;
  return date >= window.start && date <= window.end;
}

export function toSeriesPoints(
  rows: Array<Record<string, unknown>> | undefined,
  valueKey: string,
  fallbackValueKey?: string
): SeriesPoint[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => {
      const date = typeof item.date === 'string' ? item.date : '';
      const value = asNumber(item[valueKey] ?? (fallbackValueKey ? item[fallbackValueKey] : undefined));
      return {
        date,
        value,
      };
    })
    .filter((item) => item.date.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function sumSeries(points: SeriesPoint[]): number {
  return points.reduce((acc, item) => acc + item.value, 0);
}

export function mergeSeriesByDate(seriesCollection: SeriesCollection): MergedSeriesPoint[] {
  const byDate = new Map<string, MergedSeriesPoint>();
  const seriesKeys = Object.keys(seriesCollection);

  for (const [key, points] of Object.entries(seriesCollection)) {
    for (const point of points) {
      const row = byDate.get(point.date) ?? { date: point.date };
      row[key] = point.value;
      byDate.set(point.date, row);
    }
  }

  const sortedRows = Array.from(byDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  return sortedRows.map((row) => {
    for (const key of seriesKeys) {
      if (typeof row[key] !== 'number') {
        row[key] = 0;
      }
    }
    return row;
  });
}

export function mapRoleLabel(role: RoleEnum | string | undefined): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'convenio_admin':
      return 'Admin Convênio';
    case 'doctor':
      return 'Médico';
    case 'patient':
      return 'Paciente';
    default:
      return 'Desconhecido';
  }
}

export function mapAuditActionLabel(action: string): string {
  switch (action) {
    case 'create':
    case '0':
      return 'Criação';
    case 'update':
    case '1':
      return 'Atualização';
    case 'delete':
    case '2':
      return 'Exclusão';
    case 'access':
    case '3':
      return 'Acesso';
    default:
      return action;
  }
}

export function normalizeActionFilter(value: string): 'create' | 'update' | 'delete' | 'access' | '' {
  if (value === 'create' || value === 'update' || value === 'delete' || value === 'access') {
    return value;
  }
  return '';
}
