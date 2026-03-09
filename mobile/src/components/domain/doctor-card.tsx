import { Text, View } from 'react-native';
import type { DoctorList } from '@api/types/DoctorList';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyText } from '@/components/domain/currency-text';
import { RatingDisplay } from '@/components/domain/rating-display';
import { MapPinIcon, StethoscopeIcon } from '@/lib/icons';
import { formatDateTime } from '@/lib/formatters';

interface DoctorCardProps {
  doctor: DoctorList;
  onPress?: () => void;
}

export function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  return (
    <Card className="gap-4">
      <View className="flex-row items-start gap-3">
        <Avatar uri={doctor.avatar_url} name={doctor.user_name} />
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">{doctor.user_name}</Text>
          <View className="flex-row items-center gap-2">
            <StethoscopeIcon size={14} color="#64748B" />
            <Text className="text-sm text-muted">{doctor.specialty}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MapPinIcon size={14} color="#64748B" />
            <Text className="text-sm text-muted">{doctor.convenio_name}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <RatingDisplay rating={doctor.rating} totalRatings={doctor.total_ratings} />
        <CurrencyText value={doctor.consultation_price} className="text-sm font-semibold text-primary-700" />
      </View>

      {doctor.next_available_date ? (
        <Text className="text-sm text-muted">
          Proximo horario: {formatDateTime(doctor.next_available_date, doctor.next_available_time)}
        </Text>
      ) : (
        <Text className="text-sm text-muted">Sem horario publico no momento</Text>
      )}

      <Button label="Ver medico" onPress={onPress} />
    </Card>
  );
}
