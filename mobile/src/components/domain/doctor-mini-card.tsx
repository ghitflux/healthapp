import { Text, View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MapPinIcon, StethoscopeIcon } from '@/lib/icons';

interface DoctorMiniCardProps {
  doctorName: string;
  specialty: string;
  clinicName: string;
  avatarUrl?: string | null;
}

export function DoctorMiniCard({ doctorName, specialty, clinicName, avatarUrl }: DoctorMiniCardProps) {
  return (
    <Card className="flex-row items-center gap-3">
      <Avatar uri={avatarUrl} name={doctorName} />
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-foreground">{doctorName}</Text>
        <View className="flex-row items-center gap-2">
          <StethoscopeIcon color="#64748B" size={14} />
          <Text className="text-sm text-muted">{specialty}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <MapPinIcon color="#64748B" size={14} />
          <Text className="text-sm text-muted">{clinicName}</Text>
        </View>
      </View>
    </Card>
  );
}
