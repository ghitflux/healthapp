/**
 * @file components/patterns/index.ts
 * @description Barrel export do Design System — Molecules (moléculas compartilhadas).
 */

export { KpiCard, KpiCardSkeleton, KpiGrid } from './kpi-card';
export type { KpiCardProps } from './kpi-card';

export { EmptyStateBlock } from './empty-state-block';
export type { EmptyStateBlockProps } from './empty-state-block';

export { ErrorStateBlock } from './error-state-block';
export type { ErrorStateBlockProps } from './error-state-block';

export { SkeletonTable } from './skeleton-table';
export type { SkeletonTableProps } from './skeleton-table';

export { SearchFieldDebounced } from './search-field-debounced';
export type { SearchFieldDebouncedProps } from './search-field-debounced';

export { FilterChipGroup } from './filter-chip-group';
export type { FilterChipGroupProps, FilterChipOption } from './filter-chip-group';

export { FormActionsBar } from './form-actions-bar';
export type { FormActionsBarProps } from './form-actions-bar';

export { DataTableToolbar } from './data-table-toolbar';
export type { DataTableToolbarProps } from './data-table-toolbar';

export { DateRangeFilter } from './date-range-filter';
export type { DateRangeFilterProps } from './date-range-filter';

export { ActionConfirmationDialog } from './action-confirmation-dialog';
export type { ActionConfirmationDialogProps } from './action-confirmation-dialog';

export { DetailInfoRow } from './detail-info-row';
export type { DetailInfoRowProps } from './detail-info-row';

export { TablePagination } from './table-pagination';
export type { TablePaginationProps } from './table-pagination';

export { PageBreadcrumb } from './page-breadcrumb';
export type { PageBreadcrumbProps, PageBreadcrumbItem } from './page-breadcrumb';
