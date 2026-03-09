import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { ChevronLeftIcon } from '@/lib/icons';

export default function TermsScreen() {
  return (
    <ScreenWrapper>
      <View className="gap-4">
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.back()}
          leftIcon={<ChevronLeftIcon color="#2563EB" size={18} />}
        />

        <Text className="text-3xl font-bold text-foreground">Termos e Privacidade</Text>

        <Card className="gap-3">
          <Text className="text-sm leading-6 text-muted">
            O Abase Saúde trata dados pessoais para autenticacao, agendamento, notificacoes operacionais e historico assistencial.
          </Text>
          <Text className="text-sm leading-6 text-muted">
            Esta fase mobile usa somente a API existente. Fluxos completos de consentimento, exportacao e exclusao entram
            na continuidade da Fase 3.
          </Text>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
