import { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface SwipeAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: ReactNode;
  actions: SwipeAction[];
}

/**
 * Envoltorio delgado sobre Swipeable (react-native-gesture-handler) para
 * exponer 1-2 acciones rapidas al deslizar una fila hacia la izquierda.
 * Usado en el inbox de notificaciones y en inventario.
 */
export function SwipeableRow({ children, actions }: SwipeableRowProps) {
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => (
    <Animated.View
      style={[
        styles.actionsRow,
        {
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [actions.length * 76, 0],
              }),
            },
          ],
        },
      ]}
    >
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={[styles.actionButton, { backgroundColor: action.color }]}
          onPress={action.onPress}
        >
          <Ionicons name={action.icon} size={20} color="#121212" />
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row' },
  actionButton: {
    width: 76,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  actionLabel: { color: '#121212', fontSize: 11, fontWeight: '700' },
});
