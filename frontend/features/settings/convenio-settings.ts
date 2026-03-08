export type BusinessHoursDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type ServiceType = 'consultation' | 'exam' | 'return_visit';
export type ServiceModality = 'in_person' | 'telemedicine' | 'hybrid';
export type CommissionType = 'percentage' | 'fixed';

export interface BusinessHoursEntry {
  day: BusinessHoursDay;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
  break_start: string;
  break_end: string;
  slot_interval_minutes: number;
  max_daily_appointments: number;
}

export interface BookingSettings {
  public_booking_enabled: boolean;
  same_day_booking_enabled: boolean;
  auto_confirm_after_payment: boolean;
  allow_waitlist: boolean;
  max_advance_booking_days: number;
  minimum_notice_hours: number;
  appointment_buffer_minutes: number;
  clinic_timezone: string;
  service_mode: ServiceModality;
  public_contact_phone: string;
  public_whatsapp: string;
  public_email: string;
  location_notes: string;
  arrival_instructions: string;
  parking_instructions: string;
  business_hours: BusinessHoursEntry[];
}

export interface BookableService {
  id: string;
  name: string;
  service_type: ServiceType;
  modality: ServiceModality;
  duration_minutes: number;
  price: string;
  professional_percentage: number;
  convenio_percentage: number;
  commission_type: CommissionType;
  commission_value: string;
  category: string;
  notes: string;
  preparation: string;
  app_booking_enabled: boolean;
  is_active: boolean;
}

type Option<T extends string> = {
  label: string;
  value: T;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asPositiveInteger(value: unknown, fallback: number): number {
  return Math.max(0, Math.trunc(asNumber(value, fallback)));
}

function createLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10_000)}`;
}

export const BRAZILIAN_STATE_OPTIONS: Array<Option<string>> = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' },
  { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' },
  { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export const WEEKDAY_OPTIONS: Array<Option<BusinessHoursDay>> = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terca-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sabado' },
  { value: 'sunday', label: 'Domingo' },
];

export const SERVICE_TYPE_OPTIONS: Array<Option<ServiceType>> = [
  { value: 'consultation', label: 'Consulta' },
  { value: 'exam', label: 'Exame' },
  { value: 'return_visit', label: 'Retorno' },
];

export const SERVICE_MODALITY_OPTIONS: Array<Option<ServiceModality>> = [
  { value: 'in_person', label: 'Presencial' },
  { value: 'telemedicine', label: 'Telemedicina' },
  { value: 'hybrid', label: 'Hibrido' },
];

export const COMMISSION_TYPE_OPTIONS: Array<Option<CommissionType>> = [
  { value: 'percentage', label: 'Percentual' },
  { value: 'fixed', label: 'Valor fixo' },
];

export const TIMEZONE_OPTIONS: Array<Option<string>> = [
  { value: 'America/Fortaleza', label: 'America/Fortaleza' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo' },
  { value: 'America/Manaus', label: 'America/Manaus' },
  { value: 'America/Recife', label: 'America/Recife' },
];

export const SLOT_INTERVAL_OPTIONS: Array<Option<string>> = [
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
];

export function toConvenioSettingsRecord(value: unknown): Record<string, unknown> {
  return asRecord(value);
}

export function createDefaultBusinessHours(): BusinessHoursEntry[] {
  return WEEKDAY_OPTIONS.map((day, index) => ({
    day: day.value,
    label: day.label,
    enabled: index < 5,
    open: '08:00',
    close: '18:00',
    break_start: '12:00',
    break_end: '13:00',
    slot_interval_minutes: 30,
    max_daily_appointments: 0,
  }));
}

export function normalizeBookingSettings(settings: Record<string, unknown>): BookingSettings {
  const booking = asRecord(settings.booking);
  const businessHoursPayload = Array.isArray(booking.business_hours) ? booking.business_hours : [];
  const businessHoursByDay = new Map<string, Record<string, unknown>>();

  businessHoursPayload.forEach((entry) => {
    const row = asRecord(entry);
    const day = asString(row.day);
    if (day) {
      businessHoursByDay.set(day, row);
    }
  });

  const business_hours = createDefaultBusinessHours().map((defaultEntry) => {
    const current = businessHoursByDay.get(defaultEntry.day) ?? {};

    return {
      ...defaultEntry,
      enabled: asBoolean(current.enabled, defaultEntry.enabled),
      open: asString(current.open, defaultEntry.open),
      close: asString(current.close, defaultEntry.close),
      break_start: asString(current.break_start, defaultEntry.break_start),
      break_end: asString(current.break_end, defaultEntry.break_end),
      slot_interval_minutes: asPositiveInteger(
        current.slot_interval_minutes,
        defaultEntry.slot_interval_minutes
      ),
      max_daily_appointments: asPositiveInteger(
        current.max_daily_appointments,
        defaultEntry.max_daily_appointments
      ),
    };
  });

  return {
    public_booking_enabled: asBoolean(booking.public_booking_enabled, true),
    same_day_booking_enabled: asBoolean(booking.same_day_booking_enabled, false),
    auto_confirm_after_payment: asBoolean(booking.auto_confirm_after_payment, true),
    allow_waitlist: asBoolean(booking.allow_waitlist, true),
    max_advance_booking_days: asPositiveInteger(booking.max_advance_booking_days, 45),
    minimum_notice_hours: asPositiveInteger(booking.minimum_notice_hours, 2),
    appointment_buffer_minutes: asPositiveInteger(booking.appointment_buffer_minutes, 10),
    clinic_timezone: asString(booking.clinic_timezone, 'America/Fortaleza'),
    service_mode: (asString(booking.service_mode, 'in_person') as ServiceModality),
    public_contact_phone: asString(booking.public_contact_phone),
    public_whatsapp: asString(booking.public_whatsapp),
    public_email: asString(booking.public_email),
    location_notes: asString(booking.location_notes),
    arrival_instructions: asString(booking.arrival_instructions),
    parking_instructions: asString(booking.parking_instructions),
    business_hours,
  };
}

export function createEmptyBookableService(
  serviceType: ServiceType = 'consultation'
): BookableService {
  return {
    id: createLocalId('service'),
    name: '',
    service_type: serviceType,
    modality: serviceType === 'consultation' ? 'in_person' : 'hybrid',
    duration_minutes: serviceType === 'exam' ? 40 : 30,
    price: '0.00',
    professional_percentage: 60,
    convenio_percentage: 40,
    commission_type: 'percentage',
    commission_value: '0.00',
    category: '',
    notes: '',
    preparation: '',
    app_booking_enabled: true,
    is_active: true,
  };
}

export function normalizeBookableServices(settings: Record<string, unknown>): BookableService[] {
  if (!Array.isArray(settings.bookable_services)) return [];

  return settings.bookable_services.map((entry, index) => {
    const service = asRecord(entry);
    const serviceType = asString(service.service_type, 'consultation') as ServiceType;

    return {
      id: asString(service.id, `service-${index + 1}`),
      name: asString(service.name, `Serviço ${index + 1}`),
      service_type: serviceType,
      modality: asString(service.modality, serviceType === 'exam' ? 'hybrid' : 'in_person') as ServiceModality,
      duration_minutes: asPositiveInteger(service.duration_minutes, serviceType === 'exam' ? 40 : 30),
      price: asString(service.price, '0.00'),
      professional_percentage: asNumber(service.professional_percentage, 60),
      convenio_percentage: asNumber(service.convenio_percentage, 40),
      commission_type: asString(service.commission_type, 'percentage') as CommissionType,
      commission_value: asString(service.commission_value, '0.00'),
      category: asString(service.category),
      notes: asString(service.notes),
      preparation: asString(service.preparation),
      app_booking_enabled: asBoolean(service.app_booking_enabled, true),
      is_active: asBoolean(service.is_active, true),
    };
  });
}

export function sanitizeBookingSettings(values: BookingSettings): Record<string, unknown> {
  return {
    public_booking_enabled: values.public_booking_enabled,
    same_day_booking_enabled: values.same_day_booking_enabled,
    auto_confirm_after_payment: values.auto_confirm_after_payment,
    allow_waitlist: values.allow_waitlist,
    max_advance_booking_days: values.max_advance_booking_days,
    minimum_notice_hours: values.minimum_notice_hours,
    appointment_buffer_minutes: values.appointment_buffer_minutes,
    clinic_timezone: values.clinic_timezone,
    service_mode: values.service_mode,
    public_contact_phone: values.public_contact_phone.trim(),
    public_whatsapp: values.public_whatsapp.trim(),
    public_email: values.public_email.trim(),
    location_notes: values.location_notes.trim(),
    arrival_instructions: values.arrival_instructions.trim(),
    parking_instructions: values.parking_instructions.trim(),
    business_hours: values.business_hours.map((entry) => ({
      day: entry.day,
      enabled: entry.enabled,
      open: entry.open,
      close: entry.close,
      break_start: entry.break_start,
      break_end: entry.break_end,
      slot_interval_minutes: entry.slot_interval_minutes,
      max_daily_appointments: entry.max_daily_appointments,
    })),
  };
}

export function sanitizeBookableServices(services: BookableService[]): Array<Record<string, unknown>> {
  return services.map((service) => ({
    id: service.id,
    name: service.name.trim(),
    service_type: service.service_type,
    modality: service.modality,
    duration_minutes: service.duration_minutes,
    price: service.price || '0.00',
    professional_percentage: service.professional_percentage,
    convenio_percentage: service.convenio_percentage,
    commission_type: service.commission_type,
    commission_value: service.commission_value || '0.00',
    category: service.category.trim(),
    notes: service.notes.trim(),
    preparation: service.preparation.trim(),
    app_booking_enabled: service.app_booking_enabled,
    is_active: service.is_active,
  }));
}
