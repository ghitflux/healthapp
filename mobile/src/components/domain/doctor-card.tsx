import { Pressable, Text, View } from 'react-native';
import type { DoctorList } from '@api/types/DoctorList';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingDisplay } from '@/components/domain/rating-display';
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';
import { ClockIcon, MapPinIcon, StethoscopeIcon } from '@/lib/icons';

interface DoctorCardProps {
  doctor: DoctorList;
  onPress?: () => void;
  actionLabel?: string;
}

export function DoctorCard({ doctor, onPress, actionLabel = 'Ver medico' }: DoctorCardProps) {
  const nextSlotLabel = doctor.next_available_date
    ? `${formatDate(doctor.next_available_date)} as ${formatTime(doctor.next_available_time)}`
    : null;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="gap-4">
        <View className="flex-row items-start gap-3">
          <Avatar uri={doctor.avatar_url} name={doctor.user_name} />
          <View className="flex-1 gap-1">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-foreground">{doctor.user_name}</Text>
                <View className="flex-row items-center gap-2">
                  <StethoscopeIcon color="#64748B" size={14} />
                  <Text className="text-sm text-muted">{doctor.specialty}</Text>
                </View>
              </View>
              <Badge
                label={doctor.is_available ? 'Disponivel' : 'Agenda cheia'}
                className={doctor.is_available ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-100'}
                textClassName={doctor.is_available ? 'text-emerald-700' : 'text-slate-700'}
              />
            </View>

            <View className="flex-row items-center gap-2">
              <MapPinIcon color="#64748B" size={14} />
              <Text className="text-sm text-muted">{doctor.convenio_name}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <RatingDisplay rating={doctor.rating} totalRatings={doctor.total_ratings} />
          <Text className="text-sm font-semibold text-primary-700">
            {doctor.consultation_price ? formatCurrency(doctor.consultation_price) : 'A consultar'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2 rounded-2xl bg-primary-50 px-3 py-3">
          <ClockIcon color="#2563EB" size={16} />
          <Text className="flex-1 text-sm text-primary-700">
            {nextSlotLabel ? `Proximo horario: ${nextSlotLabel}` : 'Sem horario publico no momento'}
          </Text>
        </View>

        <Button className="mt-1" label={actionLabel} onPress={onPress} />
      </Card>
    </Pressable>
  );
}

export function DoctorCardSkeleton() {
  return (
    <Card className="gap-4">
      <View className="flex-row items-start gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </View>
      </View>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </Card>
  );
}
