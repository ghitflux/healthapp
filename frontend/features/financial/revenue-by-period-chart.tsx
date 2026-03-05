'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { asNumber } from '@/hooks/owner/utils';
import { formatCurrency } from '@/lib/formatters';

interface RevenueByPeriodChartProps {
  data: Array<{ [key: string]: unknown }>;
  isLoading: boolean;
}

function normalizeRows(data: Array<{ [key: string]: unknown }>) {
  return data.map((item) => ({
    period: typeof item.period === 'string' ? item.period.slice(0, 10) : '',
    revenue: asNumber(item.total ?? item.revenue),
    count: asNumber(item.count),
  }));
}

export function RevenueByPeriodChart({ data, isLoading }: RevenueByPeriodChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[320px] w-full rounded-xl" />;
  }

  const rows = normalizeRows(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receita por periodo</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyStateBlock
            title="Sem dados no periodo"
            description="Ajuste as datas para visualizar a evolucao da receita."
          />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="revenue"
                tickFormatter={(value) => `R$ ${(Number(value) / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'Receita' ? formatCurrency(value) : `${value} transacoes`
                }
              />
              <Legend />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Receita"
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="count"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Transacoes"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
