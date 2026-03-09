import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Nao foi possivel carregar este conteudo agora.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center gap-3 rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-10">
      <Text className="text-lg font-semibold text-rose-700">{title}</Text>
      <Text className="text-center text-sm leading-6 text-rose-600">{description}</Text>
      {onRetry ? <Button label="Tentar novamente" variant="outline" onPress={onRetry} fullWidth={false} /> : null}
    </View>
  );
}
