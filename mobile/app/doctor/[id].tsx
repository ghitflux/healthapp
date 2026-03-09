import { Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import type { Doctor } from '@api/types/Doctor';
import { useGetDoctorById } from '@api/hooks/useDoctors';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { RatingDisplay } from '@/components/domain/rating-display';
import { ChevronLeftIcon } from '@/lib/icons';
import { formatCurrency } from '@/lib/formatters';
import { unwrapEnvelope } from '@/lib/api-envelope';

export default function DoctorDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const query = useGetDoctorById(params.id ?? '', {
    query: { enabled: Boolean(params.id) },
  });
  const doctor = unwrapEnvelope<Doctor>(query.data);

  if (query.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenWrapper>
      <View className="gap-4">
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.back()}
          leftIcon={<ChevronLeftIcon color="#2563EB" size={18} />}
        />

        <Text className="text-3xl font-bold text-foreground">Detalhes do medico</Text>

        <Card className="gap-4">
          <View className="flex-row items-center gap-4">
            <Avatar name={doctor?.user_name} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-xl font-semibold text-foreground">{doctor?.user_name ?? 'Medico'}</Text>
              <Text className="text-sm text-muted">{doctor?.specialty ?? '-'}</Text>
              <RatingDisplay rating={doctor?.rating} totalRatings={doctor?.total_ratings} />
            </View>
          </View>

          <Text className="text-sm leading-6 text-muted">
            {doctor?.bio?.trim() || 'Perfil resumido disponivel. Conteudo completo do profissional entra no refinamento da Semana 10.'}
          </Text>

          <Text className="text-base font-semibold text-primary-700">
            {doctor?.consultation_price ? formatCurrency(doctor.consultation_price) : 'Valor indisponivel'}
          </Text>

          <Button label="Escolher horario" onPress={() => router.push('/booking/select-time')} />
        </Card>
      </View>
    </ScreenWrapper>
  );
}
