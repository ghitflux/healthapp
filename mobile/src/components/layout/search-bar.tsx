import { Input } from '@/components/ui/input';
import { SearchIcon } from '@/lib/icons';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Pesquise medico, especialidade ou exame',
}: SearchBarProps) {
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      icon={<SearchIcon color="#64748B" size={18} />}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}
