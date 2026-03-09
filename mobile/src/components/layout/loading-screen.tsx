import { View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingScreen() {
  return (
    <ScreenWrapper>
      <View className="gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </View>
    </ScreenWrapper>
  );
}
