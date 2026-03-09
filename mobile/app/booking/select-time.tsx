import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { DateSelector } from '@/components/domain/date-selector';
import { DoctorMiniCard } from '@/components/domain/doctor-mini-card';
import { SlotGrid } from '@/components/domain/slot-grid';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { useDoctorProfile } from '@/hooks/use-doctor-profile';
import { useDoctorSlots } from '@/hooks/use-doctor-slots';
import { formatLongDate } from '@/lib/formatters';
import { ChevronLeftIcon } from '@/lib/icons';
import { useBookingStore } from '@/stores/booking-store';

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function SelectTimeScreen() {
  const params = useLocalSearchParams<{ doctorId?: string | string[] }>();
  const doctorId = normalizeParam(params.doctorId);
  const { doctor, isLoading: isLoadingDoctor, isError: isDoctorError, refetch: refetchDoctor } = useDoctorProfile(doctorId);
  const { selectedDate, setSelectedDate, availableDates, slots, availableSlots, isLoadingDates, isLoadingSlots, isError, refetch } =
    useDoctorSlots(doctorId);
  const syncDoctor = useBookingStore((state) => state.syncDoctor);
  const setSchedule = useBookingStore((state) => state.setSchedule);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (doctor) {
      syncDoctor(doctor);
    }
  }, [doctor, syncDoctor]);

  if (isLoadingDoctor) {
    return <LoadingScreen />;
  }

  if (isDoctorError || !doctor) {
    return (
      <ScreenWrapper>
        <ErrorState
          description="Nao foi possivel carregar o medico para selecionar o horario."
          onRetry={() => {
            void refetchDoctor();
          }}
        />
      </ScreenWrapper>
    );
  }

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
          <Text className="text-lg font-semibold text-foreground">Selecionar horario</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <DoctorMiniCard clinicName={doctor.convenio_name} doctorName={doctor.user_name} specialty={doctor.specialty} />

            <View className="gap-3 rounded-[28px] border border-border bg-white py-5">
              <View className="px-5">
                <Text className="text-lg font-semibold text-foreground">Escolha uma data</Text>
                <Text className="text-sm text-muted">Os proximos 30 dias mostram apenas horarios publicados.</Text>
              </View>

              {isLoadingDates ? (
                <View className="px-5">
                  <Text className="text-sm text-muted">Carregando datas com agenda...</Text>
                </View>
              ) : availableDates.length ? (
                <>
                  <DateSelector
                    availableDates={availableDates}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    selectedDate={selectedDate}
                  />
                  <Text className="px-5 text-sm capitalize text-muted">{formatLongDate(selectedDate)}</Text>
                </>
              ) : (
                <View className="px-5">
                  <EmptyState
                    title="Agenda indisponivel"
                    description="Este medico ainda nao publicou datas abertas para o paciente."
                  />
                </View>
              )}
            </View>

            <View className="gap-3 rounded-[28px] border border-border bg-white py-5">
              <View className="px-5">
                <Text className="text-lg font-semibold text-foreground">Horarios livres</Text>
                <Text className="text-sm text-muted">Toque no slot desejado para continuar.</Text>
              </View>

              {isError ? (
                <View className="px-5">
                  <ErrorState
                    description="Nao foi possivel carregar os slots desta data."
                    onRetry={() => {
                      void refetch();
                    }}
                  />
                </View>
              ) : (
                <>
                  <SlotGrid isLoading={isLoadingSlots} onSelectTime={setSelectedTime} selectedTime={selectedTime} slots={slots} />
                  {availableSlots.length ? (
                    <Text className="px-5 text-sm text-muted">
                      {availableSlots.length} horario{availableSlots.length === 1 ? '' : 's'} livre
                      {availableSlots.length === 1 ? '' : 's'} nesta data.
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>
        </ScrollView>

        <View className="border-t border-border bg-white px-5 pb-8 pt-4">
          <Button
            disabled={!selectedTime}
            label="Confirmar horario"
            onPress={() => {
              if (!selectedTime) {
                return;
              }

              setSchedule(selectedDate, selectedTime);
              router.push({
                pathname: '/booking/confirm',
                params: { doctorId: doctor.id, date: selectedDate, time: selectedTime },
              });
            }}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
