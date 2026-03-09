import { Text, View } from 'react-native';
import { StarIcon } from '@/lib/icons';

interface RatingDisplayProps {
  rating?: string | number | null;
  totalRatings?: number | null;
}

export function RatingDisplay({ rating, totalRatings }: RatingDisplayProps) {
  const normalizedRating = typeof rating === 'string' ? Number.parseFloat(rating) : rating ?? 0;

  return (
    <View className="flex-row items-center gap-1">
      <StarIcon size={16} color="#F59E0B" fill="#F59E0B" />
      <Text className="text-sm font-medium text-foreground">{normalizedRating.toFixed(1)}</Text>
      {typeof totalRatings === 'number' ? <Text className="text-sm text-muted">({totalRatings})</Text> : null}
    </View>
  );
}
