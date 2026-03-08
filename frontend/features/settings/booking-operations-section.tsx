'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { PatchedConvenioRequest } from '@api/types/PatchedConvenioRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IntegerInput } from '@/components/ui/integer-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { LoaderIcon, SaveIcon } from '@/lib/icons';
import { maskPhoneInput } from '@/lib/input-masks';
import {
  normalizeBookingSettings,
  sanitizeBookingSettings,
  SERVICE_MODALITY_OPTIONS,
  SLOT_INTERVAL_OPTIONS,
  TIMEZONE_OPTIONS,
  type BookingSettings,
} from './convenio-settings';

interface BookingOperationsSectionProps {
  settings: Record<string, unknown>;
  onSave: (data: Partial<PatchedConvenioRequest>) => Promise<void>;
  isSubmitting: boolean;
}

export function BookingOperationsSection({
  settings,
  onSave,
  isSubmitting,
}: BookingOperationsSectionProps) {
  const [values, setValues] = useState<BookingSettings>(() => normalizeBookingSettings(settings));

  useEffect(() => {
    setValues(normalizeBookingSettings(settings));
  }, [settings]);

  function updateField<K extends keyof BookingSettings>(field: K, value: BookingSettings[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateBusinessHour(
    day: BookingSettings['business_hours'][number]['day'],
    field: keyof BookingSettings['business_hours'][number],
    value: string | number | boolean
  ) {
    setValues((current) => ({
      ...current,
      business_hours: current.business_hours.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSave({
      settings: {
        ...settings,
        booking: sanitizeBookingSettings(values),
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agendamento no app</CardTitle>
        <CardDescription>
          Defina regras operacionais, contatos públicos e os horários que alimentam o fluxo de
          agendamento do aplicativo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Time zone da clínica</Label>
              <Select
                value={values.clinic_timezone}
                onValueChange={(value) => updateField('clinic_timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modalidade principal</Label>
              <Select
                value={values.service_mode}
                onValueChange={(value) =>
                  updateField('service_mode', value as BookingSettings['service_mode'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_MODALITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance-days">Antecedência máxima (dias)</Label>
              <IntegerInput
                id="advance-days"
                value={values.max_advance_booking_days}
                onValueChange={(value) => updateField('max_advance_booking_days', value ?? 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notice-hours">Aviso mínimo (horas)</Label>
              <IntegerInput
                id="notice-hours"
                value={values.minimum_notice_hours}
                onValueChange={(value) => updateField('minimum_notice_hours', value ?? 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buffer-minutes">Buffer entre atendimentos (min)</Label>
              <IntegerInput
                id="buffer-minutes"
                value={values.appointment_buffer_minutes}
                onValueChange={(value) => updateField('appointment_buffer_minutes', value ?? 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-phone">Telefone público</Label>
              <Input
                id="public-phone"
                value={maskPhoneInput(values.public_contact_phone)}
                onChange={(event) =>
                  updateField('public_contact_phone', maskPhoneInput(event.target.value))
                }
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-whatsapp">WhatsApp público</Label>
              <Input
                id="public-whatsapp"
                value={maskPhoneInput(values.public_whatsapp)}
                onChange={(event) =>
                  updateField('public_whatsapp', maskPhoneInput(event.target.value))
                }
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-email">E-mail público</Label>
              <Input
                id="public-email"
                type="email"
                value={values.public_email}
                onChange={(event) => updateField('public_email', event.target.value)}
                placeholder="agenda@clínica.com.br"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">Agendamento público</p>
                <p className="text-xs text-muted-foreground">Exibe a clínica para o app.</p>
              </div>
              <Switch
                checked={values.public_booking_enabled}
                onCheckedChange={(checked) => updateField('public_booking_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">Mesmo dia</p>
                <p className="text-xs text-muted-foreground">Permite encaixes hoje.</p>
              </div>
              <Switch
                checked={values.same_day_booking_enabled}
                onCheckedChange={(checked) => updateField('same_day_booking_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">Confirmação automática</p>
                <p className="text-xs text-muted-foreground">Confirma após pagamento.</p>
              </div>
              <Switch
                checked={values.auto_confirm_after_payment}
                onCheckedChange={(checked) => updateField('auto_confirm_after_payment', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">Lista de espera</p>
                <p className="text-xs text-muted-foreground">Habilita remarcação rápida.</p>
              </div>
              <Switch
                checked={values.allow_waitlist}
                onCheckedChange={(checked) => updateField('allow_waitlist', checked)}
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-2 xl:col-span-1">
              <Label htmlFor="location-notes">Orientações de localização</Label>
              <Textarea
                id="location-notes"
                rows={4}
                value={values.location_notes}
                onChange={(event) => updateField('location_notes', event.target.value)}
                placeholder="Referências de acesso, torre, andar ou recepção."
              />
            </div>

            <div className="space-y-2 xl:col-span-1">
              <Label htmlFor="arrival-instructions">Instruções de chegada</Label>
              <Textarea
                id="arrival-instructions"
                rows={4}
                value={values.arrival_instructions}
                onChange={(event) => updateField('arrival_instructions', event.target.value)}
                placeholder="Documentos necessários, tempo de antecedência, check-in."
              />
            </div>

            <div className="space-y-2 xl:col-span-1">
              <Label htmlFor="parking-instructions">Estacionamento e apoio</Label>
              <Textarea
                id="parking-instructions"
                rows={4}
                value={values.parking_instructions}
                onChange={(event) => updateField('parking_instructions', event.target.value)}
                placeholder="Valet, estacionamento, acessibilidade e observações."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Horários operacionais</h3>
              <p className="text-xs text-muted-foreground">
                Estes horários são usados pelo aplicativo para montar os blocos disponíveis.
              </p>
            </div>

            <div className="space-y-3">
              {values.business_hours.map((entry) => (
                <div
                  key={entry.day}
                  className="rounded-xl border bg-background/90 p-4 shadow-xs"
                >
                  <div className="grid gap-4 xl:grid-cols-[220px_repeat(6,minmax(0,1fr))] xl:items-end">
                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{entry.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.enabled ? 'Dia liberado no app' : 'Dia indisponível'}
                        </p>
                      </div>
                      <Switch
                        checked={entry.enabled}
                        onCheckedChange={(checked) =>
                          updateBusinessHour(entry.day, 'enabled', checked)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${entry.day}-open`}>Abre</Label>
                      <TimePicker
                        id={`${entry.day}-open`}
                        value={entry.open}
                        disabled={!entry.enabled}
                        onChange={(value) => updateBusinessHour(entry.day, 'open', value ?? '')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${entry.day}-close`}>Fecha</Label>
                      <TimePicker
                        id={`${entry.day}-close`}
                        value={entry.close}
                        disabled={!entry.enabled}
                        onChange={(value) => updateBusinessHour(entry.day, 'close', value ?? '')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${entry.day}-break-start`}>Intervalo início</Label>
                      <TimePicker
                        id={`${entry.day}-break-start`}
                        value={entry.break_start}
                        disabled={!entry.enabled}
                        onChange={(value) =>
                          updateBusinessHour(entry.day, 'break_start', value ?? '')
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${entry.day}-break-end`}>Intervalo fim</Label>
                      <TimePicker
                        id={`${entry.day}-break-end`}
                        value={entry.break_end}
                        disabled={!entry.enabled}
                        onChange={(value) =>
                          updateBusinessHour(entry.day, 'break_end', value ?? '')
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Intervalo dos slots</Label>
                      <Select
                        value={String(entry.slot_interval_minutes)}
                        onValueChange={(value) =>
                          updateBusinessHour(entry.day, 'slot_interval_minutes', Number(value))
                        }
                        disabled={!entry.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {SLOT_INTERVAL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${entry.day}-limit`}>Limite diário</Label>
                      <IntegerInput
                        id={`${entry.day}-limit`}
                        value={entry.max_daily_appointments}
                        disabled={!entry.enabled}
                        onValueChange={(value) =>
                          updateBusinessHour(entry.day, 'max_daily_appointments', value ?? 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-2 h-4 w-4" />
              )}
              Salvar operação do app
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
