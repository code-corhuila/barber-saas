import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

/** Selector de 1 a 5 estrellas. Solo lectura si onChange no se usa. */
export function StarRating({ value, onChange, size = 32 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={6}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color="#D4AF37"
            style={styles.star}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
  star: { marginHorizontal: 4 },
});
