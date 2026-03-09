# HealthApp — Prompt de Execucao Semana 10: Busca de Medicos, Perfil e Selecao de Horario

> **Objetivo:** Implementar as telas de busca avancada, detalhe de clinica, perfil do medico e selecao de horario no app mobile do paciente.
>
> **Pre-requisitos:** Semana 9 completa — Expo Router, NativeWind, Axios + SecureStore, Auth stack, Tab navigator, Home, Agendamentos, Prontuario e Perfil implementados e funcionais.
>
> **Referencia visual:** Mockups mobile fornecidos pelo designer (Busca avancada, Detalhe clinica, Perfil medico, Selecao horario).

---

## 1. Contexto e Objetivo

### 1.1 O que a Semana 10 entrega

A Semana 10 transforma a Home (lista basica de clinicas da Semana 9) em uma experiencia de busca completa e implementa o fluxo que leva o paciente da descoberta ate a selecao de horario:

1. **Busca avancada de medicos** — filtros por especialidade, localizacao, preco, tipo (convenio/particular), busca textual com debounce
2. **Detalhe da clinica** — perfil completo com lista de medicos, especialidades, endereco e mapa
3. **Perfil do medico** — bio, avaliacoes, especialidades, preco, CRM, botao "Agendar"
4. **Selecao de horario** — calendario horizontal com datas disponiveis + grid de slots livres

### 1.2 Fluxo do paciente nesta semana

```
Home (busca rapida)
  │
  ├── Toque no card clinica → Detalhe da Clinica → Medico da clinica → Perfil Medico
  │
  ├── Toque no chip especialidade → Busca filtrada → Perfil Medico
  │
  └── Busca textual → Resultados → Perfil Medico
                                        │
                                        └── Botao "Agendar Consulta" → Selecao de Horario
                                                                          │
                                                                          └── Confirmar data/hora → booking/confirm (Semana 11)
```

### 1.3 Decisoes arquiteturais

- **Busca textual:** Usa `useListDoctors({ search: debouncedQuery })` que aciona `pg_trgm` no backend
- **Filtros combinaveis:** Query params passados via Expo Router search params
- **Calendario de datas:** Usa `useGetDoctorAvailableDates(id, { start_date, end_date })` para marcar datas com slots
- **Grid de slots:** Usa `useGetDoctorSlots(id, { date })` para listar horarios livres de um dia
- **Navegacao:** Telas fora dos tabs (`/doctor/[id]`, `/clinic/[id]`) usam `Stack.Screen` com `presentation: 'card'`

---

## 2. Tipos e Hooks da API Disponiveis

### 2.1 Types (de `@api/types`)

| Type | Campos principais | Uso |
|---|---|---|
| `DoctorList` | `id`, `user_name`, `avatar_url`, `specialty`, `convenio_name`, `consultation_price`, `rating`, `total_ratings`, `is_available`, `next_available_date`, `next_available_time` | Card de medico em listas |
| `Doctor` | Todos de DoctorList + `user`, `user_email`, `convenio`, `crm`, `crm_state`, `subspecialties`, `bio`, `consultation_duration` | Perfil completo do medico |
| `ConvenioList` | `id`, `name`, `logo_url`, `contact_email`, `subscription_plan`, `is_active` | Card de clinica resumido |
| `Convenio` | Todos de ConvenioList + `cnpj`, `description`, `contact_phone`, `address` (JSON: `{street, city, state, zip, lat, lng}`), `settings` | Detalhe da clinica |
| `AvailableSlot` | `time` (string HH:MM), `duration_minutes`, `is_available` | Grid de horarios |
| `AppointmentCreateRequest` | `doctor`, `appointment_type`, `exam_type?`, `scheduled_date`, `scheduled_time`, `notes?` | Criar agendamento (Semana 11) |
| `AppointmentTypeEnum` | `consultation`, `exam`, `return_visit` | Tipo de agendamento |

### 2.2 Hooks (de `@api/hooks`)

| Hook | Metodo | Parametros | Retorno | Uso |
|---|---|---|---|---|
| `useListDoctors` | GET | `{ search?, specialty?, convenio?, is_available?, page?, page_size? }` | `PaginatedDoctorListList` | Busca e listagem |
| `useGetDoctorById` | GET | `id: string` | `Doctor` | Perfil completo |
| `useGetDoctorSlots` | GET | `id: string, { date: string }` | `AvailableSlot[]` | Slots de um dia |
| `useGetDoctorAvailableDates` | GET | `id: string, { start_date: string, end_date: string }` | `string[]` (datas ISO) | Datas com vagas |
| `useListConvenios` | GET | `{ search?, is_active?, page?, page_size? }` | `PaginatedConvenioListList` | Listar clinicas |
| `useGetConvenioById` | GET | `id: string` | `Convenio` | Detalhe clinica |

### 2.3 Padrao de resposta da API

```typescript
// Resposta paginada
const { data } = useListDoctors({ page: 1, page_size: 20 });
const doctors = data?.data;          // DoctorList[]
const total = data?.meta?.total;     // number
const totalPages = data?.meta?.total_pages;

// Resposta simples
const { data } = useGetDoctorById(doctorId);
const doctor = data?.data;           // Doctor

// Resposta de slots
const { data } = useGetDoctorSlots(doctorId, { date: '2026-03-15' });
const slots = data?.data;            // AvailableSlot[]
```

---

## 3. Estrutura de Arquivos — Semana 10

```
mobile/
├── app/
│   ├── doctor/
│   │   └── [id].tsx                 # Perfil completo do medico (IMPLEMENTAR)
│   │
│   ├── clinic/
│   │   └── [id].tsx                 # Detalhe da clinica (IMPLEMENTAR)
│   │
│   ├── search/
│   │   └── index.tsx                # Busca avancada full-screen (IMPLEMENTAR)
│   │
│   └── booking/
│       ├── _layout.tsx              # Stack navigator booking (placeholder Sem 9)
│       └── select-time.tsx          # Selecao de horario (IMPLEMENTAR)
│
├── src/
│   ├── components/
│   │   ├── domain/
│   │   │   ├── doctor-card.tsx      # Card de medico para listas (IMPLEMENTAR)
│   │   │   ├── doctor-mini-card.tsx # Card mini para clinica (ja criado Sem 9)
│   │   │   ├── slot-grid.tsx        # Grid de horarios disponiveis (IMPLEMENTAR)
│   │   │   ├── date-selector.tsx    # Calendario horizontal de datas (IMPLEMENTAR)
│   │   │   ├── search-filters.tsx   # Painel de filtros avancados (IMPLEMENTAR)
│   │   │   ├── filter-chip.tsx      # Chip de filtro individual (IMPLEMENTAR)
│   │   │   └── doctor-reviews.tsx   # Lista de avaliacoes (IMPLEMENTAR)
│   │   │
│   │   ├── layout/
│   │   │   └── search-header.tsx    # Header da busca com back + input (IMPLEMENTAR)
│   │   │
│   │   └── feedback/
│   │       └── (ja criados na Sem 9: empty-state, error-state, loading-screen)
│   │
│   ├── hooks/
│   │   ├── use-doctors.ts           # Wrapper sobre useListDoctors com filtros (IMPLEMENTAR)
│   │   ├── use-doctor-profile.ts    # Wrapper sobre useGetDoctorById (IMPLEMENTAR)
│   │   ├── use-doctor-slots.ts      # Wrapper sobre useGetDoctorSlots + available-dates (IMPLEMENTAR)
│   │   └── use-clinic.ts            # Wrapper sobre useGetConvenioById + doctors (IMPLEMENTAR)
│   │
│   └── lib/
│       └── (ja criados na Sem 9: formatters, constants, icons, storage)
```

---

## 4. Implementacao Passo a Passo

### ETAPA 1: Hooks Customizados (1h)

#### 4.1 src/hooks/use-doctors.ts — Busca com filtros combinaveis

```typescript
import { useListDoctors } from '@api/hooks/useDoctors';
import { useState, useMemo, useCallback } from 'react';

interface DoctorFilters {
  search?: string;
  specialty?: string;
  convenio?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;
}

export function useDoctorsSearch(initialFilters?: DoctorFilters) {
  const [filters, setFilters] = useState<DoctorFilters>(initialFilters ?? {});
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => ({
    search: filters.search || undefined,
    specialty: filters.specialty || undefined,
    convenio: filters.convenio || undefined,
    is_available: filters.onlyAvailable ? true : undefined,
    page,
    page_size: 20,
  }), [filters, page]);

  const query = useListDoctors(queryParams);

  const doctors = query.data?.data ?? [];
  const meta = query.data?.meta;
  const hasMore = meta ? page < (meta.total_pages ?? 1) : false;

  const loadMore = useCallback(() => {
    if (hasMore && !query.isFetching) {
      setPage((p) => p + 1);
    }
  }, [hasMore, query.isFetching]);

  const updateFilter = useCallback((key: keyof DoctorFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset paginacao ao mudar filtro
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  return {
    doctors,
    meta,
    filters,
    hasMore,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    loadMore,
    updateFilter,
    clearFilters,
    setFilters,
  };
}
```

#### 4.2 src/hooks/use-doctor-profile.ts — Perfil completo

```typescript
import { useGetDoctorById } from '@api/hooks/useDoctors';

export function useDoctorProfile(doctorId: string) {
  const query = useGetDoctorById(doctorId, {
    query: { enabled: !!doctorId },
  });

  return {
    doctor: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
```

#### 4.3 src/hooks/use-doctor-slots.ts — Datas e slots

```typescript
import { useGetDoctorSlots } from '@api/hooks/useDoctors';
import { useGetDoctorAvailableDates } from '@api/hooks/useDoctors';
import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';

export function useDoctorSlots(doctorId: string) {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(today, 'yyyy-MM-dd')
  );

  // Buscar datas com vagas nos proximos 30 dias
  const datesQuery = useGetDoctorAvailableDates(
    doctorId,
    {
      start_date: format(today, 'yyyy-MM-dd'),
      end_date: format(addDays(today, 30), 'yyyy-MM-dd'),
    },
    { query: { enabled: !!doctorId } }
  );

  // Buscar slots do dia selecionado
  const slotsQuery = useGetDoctorSlots(
    doctorId,
    { date: selectedDate },
    { query: { enabled: !!doctorId && !!selectedDate } }
  );

  const availableDates = datesQuery.data?.data ?? [];
  const slots = slotsQuery.data?.data ?? [];
  const availableSlots = slots.filter((s) => s.is_available);

  return {
    selectedDate,
    setSelectedDate,
    availableDates,
    slots,
    availableSlots,
    isLoadingDates: datesQuery.isLoading,
    isLoadingSlots: slotsQuery.isLoading,
    isError: datesQuery.isError || slotsQuery.isError,
    refetch: () => {
      datesQuery.refetch();
      slotsQuery.refetch();
    },
  };
}
```

#### 4.4 src/hooks/use-clinic.ts — Detalhe clinica + medicos

```typescript
import { useGetConvenioById } from '@api/hooks/useConvenio';
import { useListDoctors } from '@api/hooks/useDoctors';

export function useClinic(convenioId: string) {
  const convenioQuery = useGetConvenioById(convenioId, {
    query: { enabled: !!convenioId },
  });

  const doctorsQuery = useListDoctors(
    { convenio: convenioId, is_available: true, page_size: 50 },
    { query: { enabled: !!convenioId } }
  );

  return {
    clinic: convenioQuery.data?.data ?? null,
    doctors: doctorsQuery.data?.data ?? [],
    isLoading: convenioQuery.isLoading || doctorsQuery.isLoading,
    isError: convenioQuery.isError || doctorsQuery.isError,
    refetch: () => {
      convenioQuery.refetch();
      doctorsQuery.refetch();
    },
  };
}
```

---

### ETAPA 2: Componentes de Dominio (3h)

#### 4.5 src/components/domain/doctor-card.tsx — Card de medico

**Referencia visual:** Card de medico presente nos mockups de busca

**Elementos:**
- Avatar com foto ou iniciais (circulo)
- Nome: "Dr. Joao Silva" (bold)
- Especialidade: "Cardiologia" (texto cinza)
- Clinica: "Clinica Sao Paulo" (texto cinza menor)
- Rating: estrela amarela + "4.8 (127)"
- Preco: "R$ 150,00" (azul, bold, alinhado direita)
- Proximo horario: "Proximo: 15 Mar, 14:30" (texto verde se disponivel)
- Badge "Disponivel" (verde) ou "Indisponivel" (cinza)
- Toque navega para `/doctor/{id}`

```typescript
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { DoctorList } from '@api/types';
import { StarIcon, ClockIcon } from '@/lib/icons';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface DoctorCardProps {
  doctor: DoctorList;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const handlePress = () => {
    router.push(`/doctor/${doctor.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3"
    >
      <View className="flex-row">
        {/* Avatar */}
        <Avatar
          source={doctor.avatar_url}
          fallback={doctor.user_name}
          size={56}
        />

        {/* Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {doctor.user_name}
            </Text>
            {doctor.consultation_price && (
              <Text className="text-base font-bold text-primary-600">
                {formatCurrency(Number(doctor.consultation_price))}
              </Text>
            )}
          </View>

          <Text className="text-sm text-gray-500 mt-0.5">
            {doctor.specialty}
          </Text>

          <Text className="text-xs text-gray-400 mt-0.5">
            {doctor.convenio_name}
          </Text>

          {/* Rating + Disponibilidade */}
          <View className="flex-row items-center mt-2 justify-between">
            <View className="flex-row items-center">
              <StarIcon size={14} color="#EAB308" fill="#EAB308" />
              <Text className="text-sm font-medium text-gray-700 ml-1">
                {doctor.rating ?? '0.0'}
              </Text>
              <Text className="text-xs text-gray-400 ml-1">
                ({doctor.total_ratings ?? 0})
              </Text>
            </View>

            {doctor.next_available_date ? (
              <View className="flex-row items-center">
                <ClockIcon size={12} color="#16A34A" />
                <Text className="text-xs text-green-600 ml-1">
                  Proximo: {formatDate(doctor.next_available_date)}
                  {doctor.next_available_time ? `, ${doctor.next_available_time.slice(0, 5)}` : ''}
                </Text>
              </View>
            ) : (
              <Badge variant="muted" label="Sem vagas" />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
```

#### 4.6 src/components/domain/filter-chip.tsx — Chip de filtro

```typescript
import { Pressable, Text } from 'react-native';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 border ${
        isActive
          ? 'bg-primary-600 border-primary-600'
          : 'bg-white border-gray-200'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
```

#### 4.7 src/components/domain/search-filters.tsx — Painel de filtros

```typescript
import { View, ScrollView, Text } from 'react-native';
import { FilterChip } from './filter-chip';
import { SPECIALTIES } from '@/lib/constants';

interface SearchFiltersProps {
  selectedSpecialty: string | undefined;
  onSpecialtyChange: (specialty: string | undefined) => void;
  onlyAvailable: boolean;
  onAvailableToggle: () => void;
}

export function SearchFilters({
  selectedSpecialty,
  onSpecialtyChange,
  onlyAvailable,
  onAvailableToggle,
}: SearchFiltersProps) {
  return (
    <View>
      {/* Filtro de disponibilidade */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2"
      >
        <FilterChip
          label="Disponiveis"
          isActive={onlyAvailable}
          onPress={onAvailableToggle}
        />
        <FilterChip
          label="Todas especialidades"
          isActive={!selectedSpecialty}
          onPress={() => onSpecialtyChange(undefined)}
        />
      </ScrollView>

      {/* Chips de especialidade */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-3"
      >
        {SPECIALTIES.map((spec) => (
          <FilterChip
            key={spec}
            label={spec}
            isActive={selectedSpecialty === spec}
            onPress={() =>
              onSpecialtyChange(selectedSpecialty === spec ? undefined : spec)
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}
```

#### 4.8 src/components/domain/date-selector.tsx — Calendario horizontal

```typescript
import { View, Text, Pressable, FlatList } from 'react-native';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

interface DateSelectorProps {
  availableDates: string[];       // ISO dates com slots disponiveis
  selectedDate: string;           // ISO date selecionada
  onDateSelect: (date: string) => void;
  daysToShow?: number;
}

export function DateSelector({
  availableDates,
  selectedDate,
  onDateSelect,
  daysToShow = 30,
}: DateSelectorProps) {
  const today = useMemo(() => new Date(), []);

  const dates = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) => {
      const date = addDays(today, i);
      const iso = format(date, 'yyyy-MM-dd');
      const hasSlots = availableDates.includes(iso);
      const isSelected = iso === selectedDate;
      return { date, iso, hasSlots, isSelected };
    });
  }, [today, daysToShow, availableDates, selectedDate]);

  return (
    <FlatList
      data={dates}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.iso}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => item.hasSlots && onDateSelect(item.iso)}
          className={`items-center justify-center w-16 h-20 rounded-xl mr-2 ${
            item.isSelected
              ? 'bg-primary-600'
              : item.hasSlots
              ? 'bg-white border border-gray-200'
              : 'bg-gray-50'
          }`}
          disabled={!item.hasSlots}
        >
          <Text
            className={`text-xs font-medium ${
              item.isSelected
                ? 'text-blue-100'
                : item.hasSlots
                ? 'text-gray-500'
                : 'text-gray-300'
            }`}
          >
            {format(item.date, 'EEE', { locale: ptBR }).toUpperCase()}
          </Text>
          <Text
            className={`text-lg font-bold mt-1 ${
              item.isSelected
                ? 'text-white'
                : item.hasSlots
                ? 'text-gray-900'
                : 'text-gray-300'
            }`}
          >
            {format(item.date, 'dd')}
          </Text>
          <Text
            className={`text-xs ${
              item.isSelected
                ? 'text-blue-100'
                : item.hasSlots
                ? 'text-gray-500'
                : 'text-gray-300'
            }`}
          >
            {format(item.date, 'MMM', { locale: ptBR })}
          </Text>
          {item.hasSlots && !item.isSelected && (
            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
          )}
        </Pressable>
      )}
    />
  );
}
```

#### 4.9 src/components/domain/slot-grid.tsx — Grid de horarios

```typescript
import { View, Text, Pressable } from 'react-native';
import type { AvailableSlot } from '@api/types';
import { ClockIcon } from '@/lib/icons';

interface SlotGridProps {
  slots: AvailableSlot[];
  selectedTime: string | null;
  onSlotSelect: (time: string) => void;
  isLoading?: boolean;
}

export function SlotGrid({
  slots,
  selectedTime,
  onSlotSelect,
  isLoading,
}: SlotGridProps) {
  const availableSlots = slots.filter((s) => s.is_available);

  if (isLoading) {
    return (
      <View className="flex-row flex-wrap px-4 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`skeleton-${i}`}
            className="w-[23%] h-12 bg-gray-100 rounded-lg m-[1%] animate-pulse"
          />
        ))}
      </View>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <View className="items-center py-8 px-4">
        <ClockIcon size={32} color="#9CA3AF" />
        <Text className="text-gray-500 text-sm mt-2 text-center">
          Nenhum horario disponivel nesta data.
          {'\n'}Selecione outra data acima.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap px-4 py-2">
      {availableSlots.map((slot) => {
        const isSelected = selectedTime === slot.time;
        return (
          <Pressable
            key={slot.time}
            onPress={() => onSlotSelect(slot.time)}
            className={`w-[23%] h-12 items-center justify-center rounded-lg m-[1%] border ${
              isSelected
                ? 'bg-primary-600 border-primary-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected ? 'text-white' : 'text-gray-700'
              }`}
            >
              {slot.time.slice(0, 5)}
            </Text>
            <Text
              className={`text-xs ${
                isSelected ? 'text-blue-200' : 'text-gray-400'
              }`}
            >
              {slot.duration_minutes}min
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

#### 4.10 src/components/domain/doctor-reviews.tsx — Avaliacoes

```typescript
import { View, Text, FlatList } from 'react-native';
import { StarIcon, UserIcon } from '@/lib/icons';
import { formatDate } from '@/lib/formatters';

interface Review {
  id: string;
  patient_name: string;
  score: number;
  comment: string;
  created_at: string;
  is_anonymous: boolean;
}

interface DoctorReviewsProps {
  reviews: Review[];
  averageRating: string;
  totalRatings: number;
}

export function DoctorReviews({ reviews, averageRating, totalRatings }: DoctorReviewsProps) {
  return (
    <View className="mt-4">
      {/* Resumo */}
      <View className="flex-row items-center px-4 mb-4">
        <View className="items-center mr-6">
          <Text className="text-3xl font-bold text-gray-900">{averageRating}</Text>
          <View className="flex-row mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                size={14}
                color="#EAB308"
                fill={star <= Math.round(Number(averageRating)) ? '#EAB308' : 'none'}
              />
            ))}
          </View>
          <Text className="text-xs text-gray-500 mt-1">{totalRatings} avaliacoes</Text>
        </View>
      </View>

      {/* Lista de avaliacoes */}
      {reviews.map((review) => (
        <View key={review.id} className="px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <UserIcon size={16} color="#9CA3AF" />
              <Text className="text-sm font-medium text-gray-700 ml-2">
                {review.is_anonymous ? 'Anonimo' : review.patient_name}
              </Text>
            </View>
            <View className="flex-row items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  size={12}
                  color="#EAB308"
                  fill={star <= review.score ? '#EAB308' : 'none'}
                />
              ))}
            </View>
          </View>
          {review.comment ? (
            <Text className="text-sm text-gray-600 mt-1">{review.comment}</Text>
          ) : null}
          <Text className="text-xs text-gray-400 mt-1">{formatDate(review.created_at)}</Text>
        </View>
      ))}
    </View>
  );
}
```

---

### ETAPA 3: Tela de Busca Avancada (2h)

#### 4.11 app/search/index.tsx — Busca full-screen

**Referencia visual:** Tela de busca com campo no topo, filtros horizontais e lista de resultados

**Elementos:**
1. **Header:** Seta voltar + Input de busca full-width com icone lupa
2. **Filtros:** Chips de especialidade (scroll horizontal) + toggle "Disponiveis"
3. **Contador de resultados:** "23 medicos encontrados"
4. **Lista de medicos (FlatList):** Cards de medico com DoctorCard
5. **Empty state:** Quando busca nao retorna resultados
6. **Loading:** Skeleton cards durante fetch

**Navegacao:**
- Acessada de: Home (toque na barra de busca ou chip de especialidade)
- Navega para: `/doctor/{id}` (toque no card)

**Query params recebidos:**
- `?search=cardiologia` — Texto pre-preenchido
- `?specialty=Cardiologia` — Filtro pre-selecionado

```typescript
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
import { useDoctorsSearch } from '@/hooks/use-doctors';
import { DoctorCard } from '@/components/domain/doctor-card';
import { SearchFilters } from '@/components/domain/search-filters';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { SearchIcon, ChevronLeftIcon, XIcon } from '@/lib/icons';
import { useDebounce } from '@/hooks/use-debounce';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ search?: string; specialty?: string }>();
  const [searchText, setSearchText] = useState(params.search ?? '');
  const debouncedSearch = useDebounce(searchText, 300);

  const {
    doctors,
    meta,
    filters,
    hasMore,
    isLoading,
    isFetching,
    updateFilter,
    clearFilters,
    loadMore,
    refetch,
  } = useDoctorsSearch({
    search: debouncedSearch || undefined,
    specialty: params.specialty ?? undefined,
  });

  // Sincronizar debounced search com filtros
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Atualizar filtro quando debounce mudar
  // (useEffect no hook interno ja reagira ao debouncedSearch)

  return (
    <ScreenWrapper>
      {/* Header com busca */}
      <View className="flex-row items-center px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeftIcon size={24} color="#374151" />
        </Pressable>

        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="Buscar medico, especialidade..."
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholderTextColor="#9CA3AF"
            autoFocus
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <XIcon size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filtros */}
      <SearchFilters
        selectedSpecialty={filters.specialty}
        onSpecialtyChange={(spec) => updateFilter('specialty', spec)}
        onlyAvailable={!!filters.onlyAvailable}
        onAvailableToggle={() =>
          updateFilter('onlyAvailable', !filters.onlyAvailable)
        }
      />

      {/* Contador */}
      {meta?.total !== undefined && (
        <Text className="px-4 py-2 text-sm text-gray-500">
          {meta.total} medico{meta.total !== 1 ? 's' : ''} encontrado{meta.total !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Lista */}
      {isLoading ? (
        <LoadingScreen />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="Nenhum medico encontrado"
          description="Tente ajustar os filtros ou buscar por outro termo."
          actionLabel="Limpar filtros"
          onAction={clearFilters}
        />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DoctorCard doctor={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onRefresh={refetch}
          refreshing={isFetching && !isLoading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}
```

**Hook auxiliar — use-debounce.ts:**

```typescript
// src/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

### ETAPA 4: Tela Detalhe da Clinica (2h)

#### 4.12 app/clinic/[id].tsx — Perfil da clinica

**Referencia visual:** Tela de detalhe da clinica com header, info e lista de medicos

**Elementos:**
1. **Header:** Seta voltar + "Detalhes da Clinica"
2. **Banner/Logo:** Avatar grande da clinica (ou iniciais coloridas)
3. **Nome:** "Clinica Sao Paulo" (bold, grande)
4. **Info rows (com icones):**
   - Endereco: icone pin + "Av. Paulista, 1000 - Bela Vista, SP"
   - Telefone: icone phone + "(11) 3333-4444"
   - Email: icone mail + "contato@clinicasp.com.br"
5. **Descricao:** Texto livre da clinica
6. **Secao "Nossos Medicos":**
   - Lista vertical de DoctorCard (medicos da clinica)
   - Ordenados por rating decrescente
7. **Secao "Especialidades Disponiveis":**
   - Chips com as especialidades unicas dos medicos da clinica

```typescript
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useClinic } from '@/hooks/use-clinic';
import { DoctorCard } from '@/components/domain/doctor-card';
import { SpecialtyChip } from '@/components/domain/specialty-chip';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { SectionHeader } from '@/components/layout/section-header';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ErrorState } from '@/components/feedback/error-state';
import { Avatar } from '@/components/ui/avatar';
import {
  ChevronLeftIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
} from '@/lib/icons';
import { formatPhone } from '@/lib/formatters';
import { useMemo } from 'react';

export default function ClinicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clinic, doctors, isLoading, isError, refetch } = useClinic(id);

  // Extrair especialidades unicas dos medicos
  const specialties = useMemo(() => {
    const specs = new Set(doctors.map((d) => d.specialty));
    return Array.from(specs).sort();
  }, [doctors]);

  if (isLoading) return <LoadingScreen />;
  if (isError || !clinic) {
    return <ErrorState message="Erro ao carregar clinica." onRetry={refetch} />;
  }

  const address = clinic.address as {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;

  const addressText = address
    ? [address.street, address.city, address.state].filter(Boolean).join(', ')
    : null;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeftIcon size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">
          Detalhes da Clinica
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Perfil da clinica */}
        <View className="items-center pt-6 pb-4 bg-white">
          <Avatar
            source={clinic.logo_url}
            fallback={clinic.name}
            size={80}
          />
          <Text className="text-xl font-bold text-gray-900 mt-3">
            {clinic.name}
          </Text>
        </View>

        {/* Info rows */}
        <View className="bg-white px-4 pb-4">
          {addressText && (
            <Pressable
              className="flex-row items-center py-2"
              onPress={() => {
                if (address?.street) {
                  Linking.openURL(
                    `https://maps.google.com/?q=${encodeURIComponent(addressText)}`
                  );
                }
              }}
            >
              <MapPinIcon size={18} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-3 flex-1">
                {addressText}
              </Text>
            </Pressable>
          )}

          {clinic.contact_phone && (
            <Pressable
              className="flex-row items-center py-2"
              onPress={() => Linking.openURL(`tel:${clinic.contact_phone}`)}
            >
              <PhoneIcon size={18} color="#6B7280" />
              <Text className="text-sm text-primary-600 ml-3">
                {formatPhone(clinic.contact_phone)}
              </Text>
            </Pressable>
          )}

          {clinic.contact_email && (
            <Pressable
              className="flex-row items-center py-2"
              onPress={() =>
                Linking.openURL(`mailto:${clinic.contact_email}`)
              }
            >
              <MailIcon size={18} color="#6B7280" />
              <Text className="text-sm text-primary-600 ml-3">
                {clinic.contact_email}
              </Text>
            </Pressable>
          )}

          {clinic.description && (
            <Text className="text-sm text-gray-600 mt-3 leading-5">
              {clinic.description}
            </Text>
          )}
        </View>

        {/* Especialidades */}
        {specialties.length > 0 && (
          <View className="mt-3 bg-white py-4">
            <SectionHeader title="Especialidades Disponiveis" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 mt-2"
            >
              {specialties.map((spec) => (
                <SpecialtyChip key={spec} label={spec} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Medicos */}
        <View className="mt-3 bg-white py-4">
          <SectionHeader
            title="Nossos Medicos"
            subtitle={`${doctors.length} medico${doctors.length !== 1 ? 's' : ''}`}
          />
          <View className="px-4 mt-2">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </ScreenWrapper>
  );
}
```

---

### ETAPA 5: Tela Perfil do Medico (2h)

#### 4.13 app/doctor/[id].tsx — Perfil completo + agendar

**Referencia visual:** Mockup de perfil do medico

**Elementos:**
1. **Header:** Seta voltar + "Perfil do Medico"
2. **Avatar grande** com foto ou iniciais
3. **Nome:** "Dr. Joao Silva" (bold, grande)
4. **Especialidade:** "Cardiologia" (texto cinza)
5. **CRM:** "CRM 12345/SP"
6. **Clinica:** "Clinica Sao Paulo" (link para /clinic/{id})
7. **Rating:** Estrelas + nota + total
8. **Info cards (row):**
   - Duracao: "30 min" (icone relogio)
   - Preco: "R$ 150" (icone moeda)
   - Avaliacoes: "127" (icone estrela)
9. **Bio:** Texto descritivo do medico
10. **Subspecialidades:** Chips
11. **Avaliacoes recentes:** Lista com DoctorReviews
12. **Botao fixo inferior:** "Agendar Consulta" (azul, full-width)
    - Navega para `/booking/select-time?doctorId={id}`

```typescript
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDoctorProfile } from '@/hooks/use-doctor-profile';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ErrorState } from '@/components/feedback/error-state';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SpecialtyChip } from '@/components/domain/specialty-chip';
import { DoctorReviews } from '@/components/domain/doctor-reviews';
import {
  ChevronLeftIcon,
  ClockIcon,
  DollarSignIcon,
  StarIcon,
  MapPinIcon,
  ShieldIcon,
} from '@/lib/icons';
import { formatCurrency } from '@/lib/formatters';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { doctor, isLoading, isError, refetch } = useDoctorProfile(id);

  if (isLoading) return <LoadingScreen />;
  if (isError || !doctor) {
    return <ErrorState message="Erro ao carregar perfil." onRetry={refetch} />;
  }

  const handleBooking = () => {
    router.push(`/booking/select-time?doctorId=${doctor.id}`);
  };

  const handleClinicPress = () => {
    router.push(`/clinic/${doctor.convenio}`);
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeftIcon size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">
          Perfil do Medico
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="items-center pt-6 pb-4 bg-white">
          <Avatar
            source={doctor.user_name ? undefined : undefined}
            fallback={doctor.user_name}
            size={96}
          />
          <Text className="text-xl font-bold text-gray-900 mt-3">
            {doctor.user_name}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">{doctor.specialty}</Text>

          {/* CRM */}
          <View className="flex-row items-center mt-2">
            <ShieldIcon size={14} color="#6B7280" />
            <Text className="text-xs text-gray-500 ml-1">
              CRM {doctor.crm}/{doctor.crm_state}
            </Text>
          </View>

          {/* Clinica (link) */}
          <Pressable onPress={handleClinicPress} className="flex-row items-center mt-2">
            <MapPinIcon size={14} color="#2563EB" />
            <Text className="text-sm text-primary-600 ml-1">
              {doctor.convenio_name}
            </Text>
          </Pressable>

          {/* Rating */}
          <View className="flex-row items-center mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                size={18}
                color="#EAB308"
                fill={star <= Math.round(Number(doctor.rating)) ? '#EAB308' : 'none'}
              />
            ))}
            <Text className="text-sm font-medium text-gray-700 ml-2">
              {doctor.rating}
            </Text>
            <Text className="text-xs text-gray-400 ml-1">
              ({doctor.total_ratings} avaliacoes)
            </Text>
          </View>
        </View>

        {/* Info cards */}
        <View className="flex-row px-4 py-4 bg-white justify-around">
          <View className="items-center">
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
              <ClockIcon size={20} color="#2563EB" />
            </View>
            <Text className="text-sm font-semibold text-gray-900 mt-2">
              {doctor.consultation_duration ?? 30} min
            </Text>
            <Text className="text-xs text-gray-500">Duracao</Text>
          </View>

          <View className="items-center">
            <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center">
              <DollarSignIcon size={20} color="#16A34A" />
            </View>
            <Text className="text-sm font-semibold text-gray-900 mt-2">
              {doctor.consultation_price
                ? formatCurrency(Number(doctor.consultation_price))
                : 'A consultar'}
            </Text>
            <Text className="text-xs text-gray-500">Consulta</Text>
          </View>

          <View className="items-center">
            <View className="w-12 h-12 rounded-full bg-yellow-50 items-center justify-center">
              <StarIcon size={20} color="#EAB308" />
            </View>
            <Text className="text-sm font-semibold text-gray-900 mt-2">
              {doctor.total_ratings}
            </Text>
            <Text className="text-xs text-gray-500">Avaliacoes</Text>
          </View>
        </View>

        {/* Bio */}
        {doctor.bio && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Sobre</Text>
            <Text className="text-sm text-gray-600 leading-5">{doctor.bio}</Text>
          </View>
        )}

        {/* Subspecialidades */}
        {doctor.subspecialties && doctor.subspecialties.length > 0 && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              Especialidades
            </Text>
            <View className="flex-row flex-wrap">
              <SpecialtyChip label={doctor.specialty} isActive />
              {doctor.subspecialties.map((sub) => (
                <SpecialtyChip key={sub} label={sub} />
              ))}
            </View>
          </View>
        )}

        {/* Placeholder para avaliacoes — dados reais dependem de endpoint de ratings */}
        <View className="bg-white mt-3 py-4">
          <Text className="text-sm font-semibold text-gray-900 px-4 mb-2">
            Avaliacoes
          </Text>
          <DoctorReviews
            reviews={[]}
            averageRating={doctor.rating}
            totalRatings={doctor.total_ratings}
          />
        </View>

        {/* Spacer para botao fixo */}
        <View className="h-24" />
      </ScrollView>

      {/* Botao fixo inferior */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        <Button
          label="Agendar Consulta"
          onPress={handleBooking}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </ScreenWrapper>
  );
}
```

---

### ETAPA 6: Tela Selecao de Horario (3h)

#### 4.14 app/booking/select-time.tsx — Selecao de data e hora

**Referencia visual:** Tela de selecao de horario com calendario horizontal e grid de slots

**Elementos:**
1. **Header:** Seta voltar + "Selecionar Horario"
2. **Card do medico mini:** Avatar + nome + especialidade + clinica (resumo)
3. **Calendario horizontal:** Datas dos proximos 30 dias, marcando em verde as que tem vagas
4. **Data selecionada:** "Sabado, 15 de Marco de 2026" (texto destacado)
5. **Grid de horarios:** Botoes com horarios disponiveis (ex: 08:00, 08:30, 09:00...)
6. **Slots indisponiveis:** Nao exibidos (filtrados)
7. **Botao fixo inferior:** "Confirmar Horario" (azul, desabilitado ate selecionar slot)
   - Navega para `/booking/confirm?doctorId={id}&date={date}&time={time}`

```typescript
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDoctorProfile } from '@/hooks/use-doctor-profile';
import { useDoctorSlots } from '@/hooks/use-doctor-slots';
import { DateSelector } from '@/components/domain/date-selector';
import { SlotGrid } from '@/components/domain/slot-grid';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ErrorState } from '@/components/feedback/error-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, MapPinIcon } from '@/lib/icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export default function SelectTimeScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const { doctor, isLoading: loadingDoctor } = useDoctorProfile(doctorId);
  const {
    selectedDate,
    setSelectedDate,
    availableDates,
    slots,
    availableSlots,
    isLoadingDates,
    isLoadingSlots,
  } = useDoctorSlots(doctorId);

  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Reset time quando muda data
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleConfirm = () => {
    if (!selectedTime || !selectedDate) return;
    router.push(
      `/booking/confirm?doctorId=${doctorId}&date=${selectedDate}&time=${selectedTime}`
    );
  };

  if (loadingDoctor) return <LoadingScreen />;
  if (!doctor) {
    return <ErrorState message="Medico nao encontrado." onRetry={() => router.back()} />;
  }

  const formattedDate = selectedDate
    ? format(parseISO(selectedDate), "EEEE, dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : '';

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeftIcon size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">
          Selecionar Horario
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Card medico mini */}
        <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
          <Avatar fallback={doctor.user_name} size={48} />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {doctor.user_name}
            </Text>
            <Text className="text-sm text-gray-500">{doctor.specialty}</Text>
            <View className="flex-row items-center mt-0.5">
              <MapPinIcon size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-400 ml-1">
                {doctor.convenio_name}
              </Text>
            </View>
          </View>
        </View>

        {/* Calendario horizontal */}
        <View className="bg-white mt-3">
          <Text className="text-sm font-semibold text-gray-900 px-4 pt-4">
            Selecione uma data
          </Text>
          {isLoadingDates ? (
            <View className="h-20 items-center justify-center">
              <Text className="text-sm text-gray-400">Carregando datas...</Text>
            </View>
          ) : (
            <DateSelector
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          )}
          {selectedDate && (
            <Text className="text-xs text-gray-500 px-4 pb-3 capitalize">
              {formattedDate}
            </Text>
          )}
        </View>

        {/* Grid de horarios */}
        <View className="bg-white mt-3 pb-4">
          <Text className="text-sm font-semibold text-gray-900 px-4 pt-4 mb-2">
            Horarios disponiveis
          </Text>
          <SlotGrid
            slots={slots}
            selectedTime={selectedTime}
            onSlotSelect={setSelectedTime}
            isLoading={isLoadingSlots}
          />
          {availableSlots.length > 0 && (
            <Text className="text-xs text-gray-400 px-4 mt-2">
              {availableSlots.length} horario{availableSlots.length !== 1 ? 's' : ''} disponive{availableSlots.length !== 1 ? 'is' : 'l'}
            </Text>
          )}
        </View>

        {/* Spacer */}
        <View className="h-24" />
      </ScrollView>

      {/* Botao fixo inferior */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        <Button
          label="Confirmar Horario"
          onPress={handleConfirm}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedTime}
        />
      </View>
    </ScreenWrapper>
  );
}
```

---

### ETAPA 7: Atualizar Home para Navegar (1h)

#### 4.15 Ajustar app/(tabs)/index.tsx — Home

A Home da Semana 9 ja tem barra de busca e lista de clinicas. Nesta semana, conectar:

1. **Toque na barra de busca:** Navega para `/search`
2. **Toque em chip de especialidade:** Navega para `/search?specialty=Cardiologia`
3. **Toque no card de clinica:** Navega para `/clinic/{id}`
4. **Toque no botao "Ver clinica":** Navega para `/clinic/{id}`

```typescript
// Dentro da Home, substituir a barra de busca por:
<Pressable
  onPress={() => router.push('/search')}
  className="mx-4 mt-3 flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
>
  <SearchIcon size={18} color="#9CA3AF" />
  <Text className="text-sm text-gray-400 ml-2">
    Pesquise medico, especialidade ou exame
  </Text>
</Pressable>

// Chips de especialidade:
<Pressable onPress={() => router.push(`/search?specialty=${spec}`)}>
  <SpecialtyChip label={spec} />
</Pressable>

// Card de clinica:
<Pressable onPress={() => router.push(`/clinic/${clinic.id}`)}>
  <ClinicCard clinic={clinic} />
</Pressable>
```

---

### ETAPA 8: Registrar Novas Rotas no Root Layout (30min)

#### 4.16 Atualizar app/_layout.tsx

Adicionar a rota `/search` ao Stack principal:

```typescript
// Em app/_layout.tsx, dentro do <Stack>:
<Stack.Screen name="search" options={{ presentation: 'card', headerShown: false }} />
// clinic/[id] e doctor/[id] ja devem estar registrados da Semana 9
// booking ja deve estar registrado da Semana 9
```

---

## 5. Checklist de Validacao Semana 10

### 5.1 Hooks
- [ ] `use-doctors.ts` — Busca com filtros combinaveis funciona
- [ ] `use-doctor-profile.ts` — Perfil completo carrega
- [ ] `use-doctor-slots.ts` — Datas disponiveis e slots do dia carregam
- [ ] `use-clinic.ts` — Detalhe da clinica + lista de medicos carrega
- [ ] `use-debounce.ts` — Debounce de 300ms funciona na busca

### 5.2 Tela de Busca
- [ ] Busca textual com debounce funciona (pg_trgm no backend)
- [ ] Filtro por especialidade funciona (chips horizontais)
- [ ] Toggle "Disponiveis" filtra corretamente
- [ ] Contador de resultados exibe total correto
- [ ] Cards de medico exibem: nome, especialidade, clinica, rating, preco, proximo horario
- [ ] Toque no card navega para `/doctor/{id}`
- [ ] Pull-to-refresh recarrega resultados
- [ ] Scroll infinito carrega mais paginas
- [ ] Empty state quando nao ha resultados
- [ ] Skeleton loading durante carregamento

### 5.3 Tela Detalhe da Clinica
- [ ] Informacoes da clinica exibem: nome, endereco, telefone, email, descricao
- [ ] Toque no telefone abre discador
- [ ] Toque no email abre app de email
- [ ] Toque no endereco abre Google Maps
- [ ] Lista de especialidades da clinica (chips)
- [ ] Lista de medicos da clinica (DoctorCard)
- [ ] Toque no card do medico navega para `/doctor/{id}`

### 5.4 Tela Perfil do Medico
- [ ] Perfil completo: nome, especialidade, CRM, clinica, bio, preco, duracao, rating
- [ ] Toque na clinica navega para `/clinic/{id}`
- [ ] Subspecialidades exibidas como chips
- [ ] Secao de avaliacoes com nota media e estrelas
- [ ] Botao fixo "Agendar Consulta" navega para `/booking/select-time?doctorId={id}`

### 5.5 Tela Selecao de Horario
- [ ] Card mini do medico exibe no topo
- [ ] Calendario horizontal mostra 30 dias
- [ ] Datas com vagas marcadas com ponto verde
- [ ] Datas sem vagas desabilitadas (cinza)
- [ ] Toque em data carrega slots do dia
- [ ] Grid de horarios exibe slots disponiveis (4 por linha)
- [ ] Slots indisponiveis nao sao exibidos
- [ ] Toque em slot seleciona (azul)
- [ ] Botao "Confirmar Horario" desabilitado ate selecionar slot
- [ ] Botao navega para `/booking/confirm?doctorId={id}&date={date}&time={time}`
- [ ] Mudar data reseta selecao de horario
- [ ] Empty state quando dia nao tem horarios

### 5.6 Navegacao
- [ ] Home → Busca (toque na barra de busca)
- [ ] Home → Busca filtrada (toque no chip)
- [ ] Home → Clinica (toque no card)
- [ ] Clinica → Medico (toque no card)
- [ ] Busca → Medico (toque no card)
- [ ] Medico → Clinica (toque no nome)
- [ ] Medico → Selecao de Horario (botao "Agendar")
- [ ] Selecao de Horario → Confirmar (botao) [placeholder Semana 11]
- [ ] Seta voltar funciona em todas as telas

### 5.7 Quality Gates
- [ ] `npx expo start` — app inicia sem erros
- [ ] Navegacao entre todas as telas funciona
- [ ] TypeScript: 0 erros (`npx tsc --noEmit`)
- [ ] ESLint: 0 erros
- [ ] Nenhum warning de React key ou missing dependency

---

## 6. Regras de Implementacao (Reforco)

### 6.1 NUNCA fazer
- NUNCA criar types manuais para dados da API — usar `@api/types`
- NUNCA criar HTTP calls manuais — usar `@api/hooks` e `@api/clients`
- NUNCA usar ScrollView para listas longas — usar `FlatList`
- NUNCA usar `index` como key em listas — usar IDs estaveis
- NUNCA importar icones direto de `lucide-react-native` — usar `@/lib/icons`
- NUNCA hardcodar cores — usar classes NativeWind do tema

### 6.2 SEMPRE fazer
- SEMPRE usar `FlatList` para listas (performance)
- SEMPRE implementar skeleton loading
- SEMPRE implementar pull-to-refresh
- SEMPRE implementar empty state e error state
- SEMPRE usar debounce em inputs de busca (300ms)
- SEMPRE usar formatters de `@/lib/formatters` para datas, moeda, telefone
- SEMPRE resetar paginacao ao mudar filtros

### 6.3 Padrao de navegacao

```typescript
import { router } from 'expo-router';

// Navegar para tela
router.push('/doctor/123');
router.push('/search?specialty=Cardiologia');
router.push('/booking/select-time?doctorId=123');
router.push('/booking/confirm?doctorId=123&date=2026-03-15&time=14:30');

// Voltar
router.back();
```

---

## 7. Dependencias de Backend (ja implementadas)

| Endpoint | Status | Tela Mobile |
|---|---|---|
| GET `/api/v1/doctors/` | ✅ | Busca (listagem com filtros + search pg_trgm) |
| GET `/api/v1/doctors/{id}/` | ✅ | Perfil do medico |
| GET `/api/v1/doctors/{id}/slots/?date=YYYY-MM-DD` | ✅ | Grid de horarios |
| GET `/api/v1/doctors/{id}/available-dates/?start_date=...&end_date=...` | ✅ | Calendario horizontal |
| GET `/api/v1/convenios/` | ✅ | Home (lista clinicas) |
| GET `/api/v1/convenios/{id}/` | ✅ | Detalhe da clinica |

---

## 8. Proximas Semanas (Preview)

| Semana | Foco | Telas |
|---|---|---|
| **9** | Setup + Auth + Telas base | Login, Home, Agendamentos, Prontuario, Perfil |
| **10 (esta)** | Busca e Medicos | Busca avancada, Detalhe clinica, Perfil medico, Selecao horario |
| **11** | Booking + Pagamento | Confirmacao, Payment Sheet, PIX, Comprovante |
| **12** | Historico e Polish | Cancelamento, Avaliacao, Notificacoes, Dependentes |
| **13** | Polish e Build | Animacoes, offline, deep link, EAS Build production |

---

*Documento gerado em 2026-03-09. Baseado em: PLANO_COMPLETO.md, PROMPT_EXECUCAO_SEMANA9_MOBILE.md, DESIGN_SYSTEM_SHADCN_WEB_MOBILE.md, CHECKLIST_PROJETO_END_TO_END.md, tipos reais de shared/gen/, e estado atual do codigo.*
