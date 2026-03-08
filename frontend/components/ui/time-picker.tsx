'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClockIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface TimePickerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  minuteStep?: number;
}

function normalizeTimeValue(value?: string | null) {
  if (!value) return '';

  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return '';

  return `${match[1]}:${match[2]}`;
}

function getRoundedCurrentTime(minuteStep: number) {
  const now = new Date();
  const minutes = Math.round(now.getMinutes() / minuteStep) * minuteStep;
  const nextHour = minutes >= 60 ? (now.getHours() + 1) % 24 : now.getHours();
  const hours = String(nextHour).padStart(2, '0');
  const normalizedMinutes = minutes >= 60 ? 0 : minutes;

  return `${hours}:${String(normalizedMinutes).padStart(2, '0')}`;
}

export const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Selecione o horário',
      minuteStep = 5,
      className,
      disabled,
      ...buttonProps
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const normalizedValue = React.useMemo(() => normalizeTimeValue(value), [value]);
    const [draftValue, setDraftValue] = React.useState(normalizedValue || getRoundedCurrentTime(minuteStep));

    React.useEffect(() => {
      if (open) {
        setDraftValue(normalizedValue || getRoundedCurrentTime(minuteStep));
      }
    }, [minuteStep, normalizedValue, open]);

    const [draftHour = '08', draftMinute = '00'] = draftValue.split(':');

    const hourOptions = React.useMemo(
      () =>
        Array.from({ length: 24 }, (_, index) => {
          const option = String(index).padStart(2, '0');
          return { value: option, label: option };
        }),
      []
    );

    const minuteOptions = React.useMemo(() => {
      const values: Array<{ value: string; label: string }> = [];

      for (let minute = 0; minute < 60; minute += minuteStep) {
        const option = String(minute).padStart(2, '0');
        values.push({ value: option, label: option });
      }

      return values;
    }, [minuteStep]);

    function updateDraft(nextHour: string, nextMinute: string) {
      setDraftValue(`${nextHour}:${nextMinute}`);
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-between gap-3 px-3 text-left font-normal',
              !normalizedValue && 'text-muted-foreground',
              className
            )}
            {...buttonProps}
          >
            <span className="truncate">{normalizedValue || placeholder}</span>
            <ClockIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 space-y-4" align="start">
          <PopoverHeader className="border-b pb-3">
            <PopoverTitle>Escolha o horário</PopoverTitle>
          </PopoverHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Hora
              </span>
              <Select value={draftHour} onValueChange={(nextHour) => updateDraft(nextHour, draftMinute)}>
                <SelectTrigger>
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Minuto
              </span>
              <Select
                value={draftMinute}
                onValueChange={(nextMinute) => updateDraft(draftHour, nextMinute)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Minuto" />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Limpar
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDraftValue(getRoundedCurrentTime(minuteStep))}
              >
                Agora
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onChange(draftValue);
                  setOpen(false);
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

TimePicker.displayName = 'TimePicker';
