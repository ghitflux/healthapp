import type { DoctorList } from '@api/types/DoctorList';
import { DoctorCard } from '@/components/domain/doctor-card';

interface ClinicCardProps {
  doctor: DoctorList;
  onPress?: () => void;
}

export function ClinicCard({ doctor, onPress }: ClinicCardProps) {
  return <DoctorCard doctor={doctor} onPress={onPress} />;
}
