/**
 * Arquivo de verificação de integração @api/*.
 * Importa types, hooks e clients gerados pelo Kubb para confirmar resolução de paths.
 * Este arquivo é somente para verificação de tipos — não é usado em produção.
 */

// Types gerados
import type { Appointment } from '@api/types/Appointment';
import type { AppointmentCancellationPolicy } from '@api/types/AppointmentCancellationPolicy';

// Verificação: tipos resolvem corretamente
type _AppointmentCheck = Appointment;
type _PolicyCheck = AppointmentCancellationPolicy;

export type { _AppointmentCheck, _PolicyCheck };
