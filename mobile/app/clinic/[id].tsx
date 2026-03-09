import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DoctorCard } from '@/components/domain/doctor-card';
import { SpecialtyChip } from '@/components/domain/specialty-chip';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { SectionHeader } from '@/components/layout/section-header';
import { useClinic } from '@/hooks/use-clinic';
import { formatPhone } from '@/lib/formatters';
import { ChevronLeftIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/lib/icons';

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function buildAddressLabel(address: Record<string, string | number | null | undefined> | undefined) {
  if (!address) return null;

  const line = [address.street, address.number, address.neighborhood].filter(Boolean).join(', ');
  const city = [address.city, address.state, address.zip].filter(Boolean).join(' - ');
  return [line, city].filter(Boolean).join(' | ');
}

export default function ClinicDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const clinicId = normalizeParam(params.id);
  const { clinic, doctors, isLoading, isError, refetch } = useClinic(clinicId);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !clinic) {
    return (
      <ScreenWrapper>
        <ErrorState
          description="Nao foi possivel carregar os detalhes da clinica."
          onRetry={() => {
            void refetch();
          }}
        />
      </ScreenWrapper>
    );
  }

  const address = clinic.address as Record<string, string | number | null | undefined> | undefined;
  const addressLabel = buildAddressLabel(address);
  const specialties = Array.from(new Set(doctors.map((doctor) => doctor.specialty))).sort();

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
          <Text className="text-lg font-semibold text-foreground">Detalhes da clinica</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <View className="items-center gap-3 rounded-[28px] border border-border bg-white px-5 py-6">
              <Avatar name={clinic.name} size="xl" uri={clinic.logo_url} />
              <Text className="text-center text-2xl font-semibold text-foreground">{clinic.name}</Text>
              <Badge
                label={clinic.is_active === false ? 'Cadastro em analise' : 'Clinica ativa'}
                className={clinic.is_active === false ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}
                textClassName={clinic.is_active === false ? 'text-amber-700' : 'text-emerald-700'}
              />
              {clinic.description ? (
                <Text className="text-center text-sm leading-6 text-muted">{clinic.description}</Text>
              ) : null}
            </View>

            <View className="gap-3 rounded-[28px] border border-border bg-white p-5">
              <SectionHeader title="Contato e local" subtitle="Atalhos para telefone, email e mapa." />

              {addressLabel ? (
                <Pressable
                  className="flex-row items-start gap-3 rounded-2xl bg-background px-4 py-4"
                  onPress={() => {
                    void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(addressLabel)}`);
                  }}
                >
                  <MapPinIcon color="#2563EB" size={18} />
                  <Text className="flex-1 text-sm leading-6 text-foreground">{addressLabel}</Text>
                </Pressable>
              ) : null}

              {clinic.contact_phone ? (
                <Pressable
                  className="flex-row items-center gap-3 rounded-2xl bg-background px-4 py-4"
                  onPress={() => {
                    void Linking.openURL(`tel:${clinic.contact_phone}`);
                  }}
                >
                  <PhoneIcon color="#2563EB" size={18} />
                  <Text className="text-sm text-foreground">{formatPhone(clinic.contact_phone)}</Text>
                </Pressable>
              ) : null}

              <Pressable
                className="flex-row items-center gap-3 rounded-2xl bg-background px-4 py-4"
                onPress={() => {
                  void Linking.openURL(`mailto:${clinic.contact_email}`);
                }}
              >
                <MailIcon color="#2563EB" size={18} />
                <Text className="text-sm text-foreground">{clinic.contact_email}</Text>
              </Pressable>
            </View>

            {specialties.length ? (
              <View className="gap-3 rounded-[28px] border border-border bg-white p-5">
                <SectionHeader title="Especialidades disponiveis" subtitle="Equipe organizada por area de atendimento." />
                <View className="flex-row flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <SpecialtyChip
                      key={specialty}
                      label={specialty}
                      onPress={() => router.push({ pathname: '/search', params: { specialty } })}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View className="gap-4">
              <SectionHeader
                title="Nossos medicos"
                subtitle={`${doctors.length} profissional${doctors.length === 1 ? '' : 'ais'} com agenda publica`}
              />

              {doctors.length ? (
                doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: doctor.id } })}
                  />
                ))
              ) : (
                <EmptyState
                  title="Agenda medica em atualizacao"
                  description="A clinica ainda nao publicou profissionais com agenda publica."
                />
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
