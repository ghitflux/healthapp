'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { asNumber } from '@/hooks/owner/utils';

interface RevenueChartProps {
  data?: Array<Record<string, unknown>>;
  isLoading: boolean;
  title?: string;
}

export function RevenueChart({
  data,
  isLoading,
  title = 'Receita Mensal',
}: RevenueChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = Array.isArray(data)
    ? data
        .map((item) => ({
          date: typeof item.date === 'string' ? item.date : '',
          revenue: asNumber(item.revenue ?? item.total),
        }))
        .filter((item) => item.date.length > 0)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Receita']}
              contentStyle={{
                fontSize: '12px',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
