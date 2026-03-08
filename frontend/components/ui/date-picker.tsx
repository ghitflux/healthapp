'use client';

import * as React from 'react';
import { format, isAfter, isBefore, isValid, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface DatePickerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  fromYear?: number;
  toYear?: number;
}

function parseDateValue(value?: string) {
  if (!value) return undefined;

  const parsed = parseISO(value.length === 10 ? `${value}T00:00:00` : value);
  return isValid(parsed) ? parsed : undefined;
}

function formatDateValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Selecione uma data',
      min,
      max,
      fromYear = 2015,
      toYear = new Date().getFullYear() + 10,
      className,
      disabled,
      ...buttonProps
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const selectedDate = React.useMemo(() => parseDateValue(value), [value]);
    const minDate = React.useMemo(() => parseDateValue(min), [min]);
    const maxDate = React.useMemo(() => parseDateValue(max), [max]);

    const isTodayUnavailable = React.useMemo(() => {
      const today = startOfDay(new Date());
      return (
        (minDate ? isBefore(today, startOfDay(minDate)) : false) ||
        (maxDate ? isAfter(today, startOfDay(maxDate)) : false)
      );
    }, [maxDate, minDate]);

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
              !selectedDate && 'text-muted-foreground',
              className
            )}
            {...buttonProps}
          >
            <span className="truncate">
              {selectedDate
                ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                : placeholder}
            </span>
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <PopoverHeader className="border-b px-4 py-3">
            <PopoverTitle>Escolha a data</PopoverTitle>
          </PopoverHeader>

          <Calendar
            mode="single"
            locale={ptBR}
            selected={selectedDate}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            onSelect={(date) => {
              onChange(date ? formatDateValue(date) : undefined);
              if (date) {
                setOpen(false);
              }
            }}
          />

          <div className="flex items-center justify-between border-t px-3 py-2">
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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isTodayUnavailable}
              onClick={() => {
                onChange(formatDateValue(new Date()));
                setOpen(false);
              }}
            >
              Hoje
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = 'DatePicker';
