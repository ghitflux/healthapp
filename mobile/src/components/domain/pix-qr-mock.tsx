import { useMemo } from 'react';
import { Text, View } from 'react-native';

interface PixQrMockProps {
  value: string;
}

const GRID_SIZE = 17;
const CELL_SIZE = 10;

export function PixQrMock({ value }: PixQrMockProps) {
  const cells = useMemo(
    () =>
      Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
        const charCode = value.charCodeAt(index % value.length) || 0;
        return (charCode * (index + 7) + index) % 5 < 2;
      }),
    [value]
  );

  return (
    <View className="items-center gap-4">
      <View className="rounded-[28px] border border-border bg-white p-4">
        <View className="flex-row flex-wrap" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
          {cells.map((filled, index) => (
            <View
              key={`qr-${index}`}
              className={filled ? 'bg-foreground' : 'bg-white'}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            />
          ))}
        </View>
      </View>
      <Text className="text-xs uppercase tracking-[0.2px] text-muted">QR de simulacao local</Text>
    </View>
  );
}
