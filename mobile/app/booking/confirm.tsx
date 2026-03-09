import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DoctorMiniCard } from '@/components/domain/doctor-mini-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { useDoctorProfile } from '@/hooks/use-doctor-profile';
import { formatCurrency, formatLongDate, formatTime } from '@/lib/formatters';
import { ChevronLeftIcon, ClockIcon, CreditCardIcon, FileTextIcon } from '@/lib/icons';
import { useBookingStore } from '@/stores/booking-store';

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function BookingConfirmScreen() {
  const params = useLocalSearchParams<{ doctorId?: string | string[]; date?: string | string[]; time?: string | string[] }>();
  const doctorId = normalizeParam(params.doctorId);
  const date = normalizeParam(params.date);
  const time = normalizeParam(params.time);
  const { doctor, isLoading, isError, refetch } = useDoctorProfile(doctorId);
  const draft = useBookingStore((state) => state.draft);
  const syncDoctor = useBookingStore((state) => state.syncDoctor);
  const setNotes = useBookingStore((state) => state.setNotes);
  const setSchedule = useBookingStore((state) => state.setSchedule);
  const createMockAppointment = useBookingStore((state) => state.createMockAppointment);
  const [notes, setLocalNotes] = useState(draft.notes);

  useEffect(() => {
    if (date && time) {
      setSchedule(date, time);
    }
  }, [date, setSchedule, time]);

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
          description="Nao foi possivel montar o resumo do agendamento."
          onRetry={() => {
            void refetch();
          }}
        />
      </ScreenWrapper>
    );
  }

  if (!draft.date || !draft.time) {
    return (
      <ScreenWrapper>
        <EmptyState
          title="Horario nao selecionado"
          description="Escolha uma data e um slot antes de seguir para o pagamento."
          actionLabel="Selecionar horario"
          onAction={() => router.replace({ pathname: '/booking/select-time', params: { doctorId: doctor.id } })}
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
          <Text className="text-lg font-semibold text-foreground">Confirmar agendamento</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <DoctorMiniCard clinicName={doctor.convenio_name} doctorName={doctor.user_name} specialty={doctor.specialty} />

            <Card className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">Resumo</Text>
                <Badge label="Simulacao local" className="border-primary-200 bg-primary-50" textClassName="text-primary-700" />
              </View>

              <View className="flex-row items-center gap-3 rounded-2xl bg-background px-4 py-4">
                <ClockIcon color="#2563EB" size={18} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{formatLongDate(draft.date)}</Text>
                  <Text className="text-sm text-muted">Horario selecionado: {formatTime(draft.time)}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 rounded-2xl bg-background px-4 py-4">
                <CreditCardIcon color="#16A34A" size={18} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {draft.price ? formatCurrency(draft.price) : 'Valor a confirmar'}
                  </Text>
                  <Text className="text-sm text-muted">Consulta com duracao estimada de {draft.durationMinutes ?? 30} minutos</Text>
                </View>
              </View>
            </Card>

            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <FileTextIcon color="#2563EB" size={18} />
                <Text className="text-lg font-semibold text-foreground">Observacoes opcionais</Text>
              </View>

              <TextInput
                className="min-h-[120px] rounded-2xl border border-border bg-background px-4 py-4 text-base text-foreground"
                multiline
                onChangeText={setLocalNotes}
                placeholder="Adicione uma observacao para a clinica ou para o medico."
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
                value={notes}
              />
            </Card>

            <Card className="gap-3 bg-primary-50">
              <Text className="text-base font-semibold text-primary-700">Fluxo de pagamento mock</Text>
              <Text className="text-sm leading-6 text-primary-700">
                Esta etapa prepara um agendamento local de teste para voce simular o PIX sem criar um registro real no
                backend. O objetivo e validar UX e navegacao antes do Payment Sheet completo da Semana 11.
              </Text>
            </Card>

            <Button
              label="Continuar para pagamento"
              onPress={() => {
                setNotes(notes);
                const appointmentId = createMockAppointment();
                router.push({ pathname: '/booking/payment', params: { appointmentId } });
              }}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
