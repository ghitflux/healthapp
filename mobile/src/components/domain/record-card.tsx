import { Text, View } from 'react-native';
import type { AppointmentList } from '@api/types/AppointmentList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyText } from '@/components/domain/currency-text';
import { PaymentMethodBadge } from '@/components/domain/payment-method-badge';
import { StatusBadge } from '@/components/domain/status-badge';
import { CalendarIcon } from '@/lib/icons';
import { formatDateTime } from '@/lib/formatters';

interface RecordCardProps {
  appointment: AppointmentList;
  onPress?: () => void;
}

export function RecordCard({ appointment, onPress }: RecordCardProps) {
  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-wrap gap-2">
          <StatusBadge type="payment" status="completed" />
          <PaymentMethodBadge method="pix" />
        </View>
        <CurrencyText value={appointment.price} className="text-sm font-semibold text-primary-700" />
      </View>

      <View className="gap-2">
        <Text className="text-base font-semibold text-foreground">{appointment.doctor_name}</Text>
        <Text className="text-sm text-muted">{appointment.doctor_specialty}</Text>
        <View className="flex-row items-center gap-2">
          <CalendarIcon size={14} color="#64748B" />
          <Text className="text-sm text-muted">
            {formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}
          </Text>
        </View>
      </View>

      <Button label="Ver detalhes" variant="outline" onPress={onPress} />
    </Card>
  );
}
