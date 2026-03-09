import { Text, View } from 'react-native';
import type { AppointmentList } from '@api/types/AppointmentList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountdownBadge } from '@/components/domain/countdown-badge';
import { CurrencyText } from '@/components/domain/currency-text';
import { StatusBadge } from '@/components/domain/status-badge';
import { CalendarIcon, ClockIcon, MoreVerticalIcon, StethoscopeIcon } from '@/lib/icons';
import { formatDate } from '@/lib/formatters';

interface AppointmentCardProps {
  appointment: AppointmentList;
  onViewDetails?: () => void;
  onSecondaryAction?: () => void;
}

export function AppointmentCard({
  appointment,
  onViewDetails,
  onSecondaryAction,
}: AppointmentCardProps) {
  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row flex-wrap gap-2">
          <StatusBadge type="appointment" status={appointment.status} />
          <StatusBadge type="payment" status={appointment.status === 'completed' ? 'completed' : 'pending'} />
        </View>
        <MoreVerticalIcon size={18} color="#64748B" />
      </View>

      <View className="gap-2">
        <Text className="text-base font-semibold text-foreground">{appointment.doctor_name}</Text>
        <View className="flex-row items-center gap-2">
          <StethoscopeIcon size={14} color="#64748B" />
          <Text className="text-sm text-muted">{appointment.doctor_specialty}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <CalendarIcon size={14} color="#64748B" />
          <Text className="text-sm text-muted">{formatDate(appointment.scheduled_date)}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <ClockIcon size={14} color="#64748B" />
          <Text className="text-sm text-muted">{appointment.scheduled_time.slice(0, 5)}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <CountdownBadge date={appointment.scheduled_date} time={appointment.scheduled_time} />
        <CurrencyText value={appointment.price} className="text-sm font-semibold text-primary-700" />
      </View>

      <View className="flex-row gap-3">
        <Button label="Ver detalhes" variant="outline" onPress={onViewDetails} />
        <Button label="Reagendar" variant="ghost" onPress={onSecondaryAction} />
      </View>
    </Card>
  );
}
