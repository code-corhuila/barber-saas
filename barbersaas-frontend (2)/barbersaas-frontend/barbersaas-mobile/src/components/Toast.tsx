import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

export type ToastType = 'success' | 'error';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}

/**
 * Confirmacion animada (fade + slide) que reemplaza Alert.alert para
 * acciones exitosas/fallidas sin bloquear la pantalla con un dialogo nativo.
 */
export function Toast({ visible, message, type = 'success', onHide, duration = 2200 }: ToastProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onHide());
    }, duration);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        type === 'error' ? styles.error : styles.success,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  success: { backgroundColor: '#1E3A1E', borderWidth: 1, borderColor: '#4CAF50' },
  error: { backgroundColor: '#3A1E1E', borderWidth: 1, borderColor: '#FF6B6B' },
  text: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
