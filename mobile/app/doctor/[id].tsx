import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DoctorReviews } from '@/components/domain/doctor-reviews';
import { SpecialtyChip } from '@/components/domain/specialty-chip';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { useDoctorProfile } from '@/hooks/use-doctor-profile';
import { formatCurrency } from '@/lib/formatters';
import { buildDoctorReviewSamples } from '@/lib/mock-data';
import {
  ChevronLeftIcon,
  ClockIcon,
  DollarSignIcon,
  MapPinIcon,
  ShieldIcon,
  StarIcon,
} from '@/lib/icons';
import { useBookingStore } from '@/stores/booking-store';

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function DoctorDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const doctorId = normalizeParam(params.id);
  const { doctor, isLoading, isError, refetch } = useDoctorProfile(doctorId);
  const syncDoctor = useBookingStore((state) => state.syncDoctor);

  useEffect(() => {
    if (doctor) {
      syncDoctor(doctor);
    }
  }, [doctor, syncDoctor]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !doctor) {
    return (
      <ScreenWrapper>
        <ErrorState
          description="Nao foi possivel carregar o perfil do medico."
          onRetry={() => {
            void refetch();
          }}
        />
      </ScreenWrapper>
    );
  }

  const reviews = buildDoctorReviewSamples(doctor.user_name, doctor.total_ratings);

  return (
    <ScreenWrapper className="bg-background" scroll={false}>
      <View className="flex-1">
        <View className="flex-row items-center gap-3 border-b border-border bg-white px-5 py-4">
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-background"
            onPress={() => router.back()}
          >
            <ChevronLeftIcon color="#0F172A" size={20} />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Perfil do medico</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <View className="items-center gap-3 rounded-[28px] border border-border bg-white px-5 py-6">
              <Avatar name={doctor.user_name} size="xl" />
              <Text className="text-center text-2xl font-semibold text-foreground">{doctor.user_name}</Text>
              <Text className="text-base text-muted">{doctor.specialty}</Text>

              <View className="flex-row items-center gap-2">
                <ShieldIcon color="#64748B" size={14} />
                <Text className="text-sm text-muted">
                  CRM {doctor.crm}/{doctor.crm_state}
                </Text>
              </View>

              <Pressable
                className="flex-row items-center gap-2"
                onPress={() => router.push({ pathname: '/clinic/[id]', params: { id: doctor.convenio } })}
              >
                <MapPinIcon color="#2563EB" size={14} />
                <Text className="text-sm font-medium text-primary-700">{doctor.convenio_name}</Text>
              </Pressable>

              <Badge
                label={doctor.is_available ? 'Agenda aberta' : 'Agenda limitada'}
                className={doctor.is_available ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-100'}
                textClassName={doctor.is_available ? 'text-emerald-700' : 'text-slate-700'}
              />
            </View>

            <View className="flex-row gap-3">
              <Card className="flex-1 items-center gap-2 px-3 py-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                  <ClockIcon color="#2563EB" size={20} />
                </View>
                <Text className="text-base font-semibold text-foreground">{doctor.consultation_duration ?? 30} min</Text>
                <Text className="text-xs text-muted">Duracao media</Text>
              </Card>

              <Card className="flex-1 items-center gap-2 px-3 py-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <DollarSignIcon color="#16A34A" size={20} />
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {doctor.consultation_price ? formatCurrency(doctor.consultation_price) : 'A combinar'}
                </Text>
                <Text className="text-xs text-muted">Consulta</Text>
              </Card>

              <Card className="flex-1 items-center gap-2 px-3 py-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                  <StarIcon color="#F59E0B" fill="#F59E0B" size={20} />
                </View>
                <Text className="text-base font-semibold text-foreground">{doctor.total_ratings}</Text>
                <Text className="text-xs text-muted">Avaliacoes</Text>
              </Card>
            </View>

            <Card className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Sobre</Text>
              <Text className="text-sm leading-7 text-muted">
                {doctor.bio?.trim() || 'Perfil profissional disponivel para o paciente com foco em agenda e atendimento.'}
              </Text>
            </Card>

            <Card className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Especialidades</Text>
              <View className="flex-row flex-wrap gap-2">
                <SpecialtyChip active label={doctor.specialty} />
                {doctor.subspecialties?.map((item) => <SpecialtyChip key={item} label={item} />)}
              </View>
            </Card>

            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Avaliacoes recentes</Text>
              <DoctorReviews reviews={reviews} averageRating={doctor.rating} totalRatings={doctor.total_ratings} />
            </View>
          </View>
        </ScrollView>

        <View className="border-t border-border bg-white px-5 pb-8 pt-4">
          <Button
            label="Agendar consulta"
            onPress={() => router.push({ pathname: '/booking/select-time', params: { doctorId: doctor.id } })}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
