/**
 * @file components/ds/index.ts
 * @description Barrel export do Design System — Domain Atoms & Wrappers.
 * Importar via: import { StatusPill, CurrencyText } from '@/components/ds'
 */

export { StatusPill } from './status-pill';
export type { StatusPillProps, AppointmentStatus, PaymentStatus } from './status-pill';

export { CurrencyText } from './currency-text';
export type { CurrencyTextProps } from './currency-text';

export { DateTimeText } from './datetime-text';
export type { DateTimeTextProps } from './datetime-text';

export { RatingStars } from './rating-stars';
export type { RatingStarsProps } from './rating-stars';

export { CounterBadge } from './counter-badge';
export type { CounterBadgeProps } from './counter-badge';

export { PaymentMethodBadge } from './payment-method-badge';
export type { PaymentMethodBadgeProps, PaymentMethod } from './payment-method-badge';

export { SlotBadge } from './slot-badge';
export type { SlotBadgeProps, SlotAvailability } from './slot-badge';

export { TrendChip } from './trend-chip';
export type { TrendChipProps } from './trend-chip';

export { PermissionTag } from './permission-tag';
export type { PermissionTagProps, UserRole } from './permission-tag';
