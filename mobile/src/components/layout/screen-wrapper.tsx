import { ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from 'react-native';
import { cn } from '@/lib/utils';

interface ScreenWrapperProps extends ViewProps {
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentClassName?: string;
}

export function ScreenWrapper({
  scroll = true,
  refreshing = false,
  onRefresh,
  children,
  className,
  contentClassName,
  ...props
}: ScreenWrapperProps) {
  const content = (
    <View className={cn('flex-1 px-5 py-4', contentClassName)} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
