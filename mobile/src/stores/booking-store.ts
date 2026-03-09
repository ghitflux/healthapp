import { create } from 'zustand';
import type { AppointmentTypeEnum } from '@api/types/AppointmentTypeEnum';
import type { Doctor } from '@api/types/Doctor';
import type { Payment } from '@api/types/Payment';
import { createMockPixPayment, updateMockPaymentStatus } from '@/lib/mock-data';

interface BookingDraft {
  appointmentId: string | null;
  doctorId: string | null;
  doctorName: string | null;
  specialty: string | null;
  clinicId: string | null;
  clinicName: string | null;
  durationMinutes: number | null;
  price: string | null;
  date: string | null;
  time: string | null;
  appointmentType: AppointmentTypeEnum;
  notes: string;
}

interface BookingState {
  draft: BookingDraft;
  mockPixPayment: Payment | null;
  syncDoctor: (doctor: Doctor) => void;
  setSchedule: (date: string, time: string) => void;
  setNotes: (notes: string) => void;
  createMockAppointment: () => string;
  createMockPix: () => Payment;
  completeMockPix: () => void;
  failMockPix: () => void;
  clearMockPix: () => void;
  resetBooking: () => void;
}

const defaultDraft: BookingDraft = {
  appointmentId: null,
  doctorId: null,
  doctorName: null,
  specialty: null,
  clinicId: null,
  clinicName: null,
  durationMinutes: null,
  price: null,
  date: null,
  time: null,
  appointmentType: 'consultation',
  notes: '',
};

function buildMockAppointmentId() {
  return `mock_appt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  draft: defaultDraft,
  mockPixPayment: null,
  syncDoctor: (doctor) =>
    set((state) => ({
      draft: {
        ...state.draft,
        doctorId: doctor.id,
        doctorName: doctor.user_name,
        specialty: doctor.specialty,
        clinicId: doctor.convenio,
        clinicName: doctor.convenio_name,
        durationMinutes: doctor.consultation_duration ?? 30,
        price: doctor.consultation_price ?? state.draft.price,
      },
    })),
  setSchedule: (date, time) =>
    set((state) => ({
      draft: {
        ...state.draft,
        date,
        time,
      },
    })),
  setNotes: (notes) =>
    set((state) => ({
      draft: {
        ...state.draft,
        notes,
      },
    })),
  createMockAppointment: () => {
    const existing = get().draft.appointmentId;

    if (existing) {
      return existing;
    }

    const appointmentId = buildMockAppointmentId();
    set((state) => ({
      draft: {
        ...state.draft,
        appointmentId,
      },
    }));
    return appointmentId;
  },
  createMockPix: () => {
    const state = get();
    const appointmentId = state.draft.appointmentId ?? state.createMockAppointment();
    const payment = createMockPixPayment({
      amount: state.draft.price,
      appointmentId,
      doctorId: state.draft.doctorId,
      doctorName: state.draft.doctorName,
      scheduledDate: state.draft.date,
      scheduledTime: state.draft.time,
    });

    set({ mockPixPayment: payment });
    return payment;
  },
  completeMockPix: () =>
    set((state) => ({
      mockPixPayment: state.mockPixPayment ? updateMockPaymentStatus(state.mockPixPayment, 'completed') : null,
    })),
  failMockPix: () =>
    set((state) => ({
      mockPixPayment: state.mockPixPayment ? updateMockPaymentStatus(state.mockPixPayment, 'failed') : null,
    })),
  clearMockPix: () => set({ mockPixPayment: null }),
  resetBooking: () =>
    set({
      draft: defaultDraft,
      mockPixPayment: null,
    }),
}));
