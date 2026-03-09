import { Pressable, TextInput, View } from 'react-native';
import { ChevronLeftIcon, SearchIcon, XIcon } from '@/lib/icons';

interface SearchHeaderProps {
  value: string;
  onChangeText: (value: string) => void;
  onBack: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchHeader({
  value,
  onChangeText,
  onBack,
  placeholder = 'Buscar medico, especialidade ou clinica',
  autoFocus = false,
}: SearchHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 border-b border-border bg-white px-5 py-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        className="h-11 w-11 items-center justify-center rounded-full border border-border bg-background"
        onPress={onBack}
      >
        <ChevronLeftIcon color="#0F172A" size={20} />
      </Pressable>

      <View className="min-h-[52px] flex-1 flex-row items-center gap-3 rounded-2xl border border-border bg-background px-4">
        <SearchIcon color="#64748B" size={18} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          className="flex-1 py-3 text-base text-foreground"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          returnKeyType="search"
          value={value}
        />
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => onChangeText('')}>
            <XIcon color="#64748B" size={18} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
