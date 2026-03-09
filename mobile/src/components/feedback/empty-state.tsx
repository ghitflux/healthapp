import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-3 rounded-[24px] border border-dashed border-border bg-white px-6 py-10">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      <Text className="text-center text-sm leading-6 text-muted">{description}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} />
      ) : null}
    </View>
  );
}
