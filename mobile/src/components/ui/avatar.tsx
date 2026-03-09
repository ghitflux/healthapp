import { Text, View, type ViewProps } from 'react-native';
import { Image } from 'expo-image';
import { cn } from '@/lib/utils';

interface AvatarProps extends ViewProps {
  uri?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24',
} as const;

function getInitials(name?: string | null) {
  if (!name) return 'S';
  return name
    .split(' ')
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ uri, name, size = 'md', className, ...props }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-full bg-primary-100',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {uri ? (
        <Image source={{ uri }} contentFit="cover" className="h-full w-full" />
      ) : (
        <Text className="text-sm font-semibold text-primary-700">{initials}</Text>
      )}
    </View>
  );
}
