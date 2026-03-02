/**
 * @file components/ds/slot-badge.tsx
 * @description Atom de domínio — Badge para disponibilidade de horários médicos.
 */

import { cn } from '@/lib/utils';
import { CircleIcon, CheckCircleIcon, AlertCircleIcon, StarIcon } from '@/lib/icons';

export type SlotAvailability = 'available' | 'popular' | 'last_spots' | 'unavailable';

const SLOT_CONFIG: Record<
  SlotAvailability,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  available: {
    label: 'Disponível',
    icon: CheckCircleIcon,
    className: 'bg-success-50 text-success-700 border border-success-100',
  },
  popular: {
    label: 'Popular',
    icon: StarIcon,
    className: 'bg-warning-50 text-warning-700 border border-warning-100',
  },
  last_spots: {
    label: 'Últimas vagas',
    icon: AlertCircleIcon,
    className: 'bg-[#fff7ed] text-[#9a3412] border border-[#fed7aa]',
  },
  unavailable: {
    label: 'Indisponível',
    icon: CircleIcon,
    className: 'bg-neutral-100 text-neutral-500 border border-neutral-200',
  },
};

export interface SlotBadgeProps {
  availability: SlotAvailability;
  className?: string;
}

export function SlotBadge({ availability, className }: SlotBadgeProps) {
  const config = SLOT_CONFIG[availability];
  if (!config) return null;

  const { label, icon: Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
