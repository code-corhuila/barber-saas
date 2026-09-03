import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getUnreadCount } from '../api/notifications';
import { useAuthStore } from '../store/authStore';

/**
 * Campanita con badge de no-leidas para el header de cada rol. Hace polling
 * cada 20s para dar sensacion de "vivo" sin depender de push real (ver plan).
 */
export function NotificationBell() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: getUnreadCount,
    enabled: !!token,
    refetchInterval: 20000,
  });

  return (
    <Pressable style={styles.button} onPress={() => router.push('/notifications')} hitSlop={8}>
      <Ionicons name="notifications-outline" size={24} color="#fff" />
      {!!unreadCount && unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { marginRight: 16, padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
