import { Pressable, Text, View } from 'react-native';
import type { Convenio } from '@api/types/Convenio';
import type { ConvenioList } from '@api/types/ConvenioList';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BuildingIcon, MailIcon } from '@/lib/icons';

interface ClinicCardProps {
  clinic: ConvenioList | Convenio;
  onPress?: () => void;
}

export function ClinicCard({ clinic, onPress }: ClinicCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="mr-4 w-[280px] gap-4">
        <View className="flex-row items-start gap-3">
          <Avatar uri={clinic.logo_url} name={clinic.name} />
          <View className="flex-1 gap-1">
            <Text className="text-base font-semibold text-foreground">{clinic.name}</Text>
            <View className="flex-row items-center gap-2">
              <BuildingIcon color="#64748B" size={14} />
              <Text className="text-sm text-muted">
                {clinic.subscription_plan ? `Plano ${clinic.subscription_plan}` : 'Clinica parceira'}
              </Text>
            </View>
            {'contact_email' in clinic ? (
              <View className="flex-row items-center gap-2">
                <MailIcon color="#64748B" size={14} />
                <Text className="text-sm text-muted" numberOfLines={1}>
                  {clinic.contact_email}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Badge
          label={clinic.is_active === false ? 'Cadastro em revisao' : 'Atendimento ativo'}
          className={clinic.is_active === false ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}
          textClassName={clinic.is_active === false ? 'text-amber-700' : 'text-emerald-700'}
        />

        <Button label="Ver clinica" onPress={onPress} />
      </Card>
    </Pressable>
  );
}

export function ClinicCardSkeleton() {
  return (
    <Card className="mr-4 w-[280px] gap-4">
      <View className="flex-row gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </View>
      </View>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-12 w-full" />
    </Card>
  );
}
