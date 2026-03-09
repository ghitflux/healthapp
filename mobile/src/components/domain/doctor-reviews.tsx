import { Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/formatters';
import { StarIcon, UserIcon } from '@/lib/icons';
import type { DoctorReviewMock } from '@/lib/mock-data';

interface DoctorReviewsProps {
  reviews: DoctorReviewMock[];
  averageRating: string | number;
  totalRatings: number;
}

export function DoctorReviews({ reviews, averageRating, totalRatings }: DoctorReviewsProps) {
  const normalizedRating =
    typeof averageRating === 'string' ? Number.parseFloat(averageRating || '0') : averageRating ?? 0;

  return (
    <View className="gap-3">
      <Card className="items-center gap-2">
        <Text className="text-4xl font-bold text-foreground">{normalizedRating.toFixed(1)}</Text>
        <View className="flex-row gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
              key={`summary-star-${index + 1}`}
              color="#F59E0B"
              fill={index < Math.round(normalizedRating) ? '#F59E0B' : 'transparent'}
              size={16}
            />
          ))}
        </View>
        <Text className="text-sm text-muted">{totalRatings} avaliacoes registradas</Text>
      </Card>

      {reviews.map((review) => (
        <Card key={review.id} className="gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                <UserIcon color="#2563EB" size={16} />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground">
                  {review.is_anonymous ? 'Paciente anonimo' : review.patient_name}
                </Text>
                <Text className="text-xs text-muted">{formatDate(review.created_at)}</Text>
              </View>
            </View>

            <View className="flex-row gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon
                  key={`${review.id}-star-${index + 1}`}
                  color="#F59E0B"
                  fill={index < review.score ? '#F59E0B' : 'transparent'}
                  size={12}
                />
              ))}
            </View>
          </View>

          <Text className="text-sm leading-6 text-muted">{review.comment}</Text>
        </Card>
      ))}
    </View>
  );
}
