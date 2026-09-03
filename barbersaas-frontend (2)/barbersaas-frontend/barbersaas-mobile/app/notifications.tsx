import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getMyNotifications, markNotificationAsRead } from '../src/api/notifications';
import { NotificationResponse } from '../src/types/notifications';
import { SwipeableRow } from '../src/components/SwipeableRow';
import { useAuthStore } from '../src/store/authStore';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  APPOINTMENT_CONFIRMATION: 'calendar',
  REMINDER: 'alarm',
  PROMOTION: 'pricetag',
  SYSTEM: 'information-circle',
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const [refreshing, setRefreshing] = useState(false);

  // Sin esto, si esta pantalla llega a montarse un instante sin sesion
  // valida (ej. navegacion hacia atras del navegador justo cuando expira
  // o se cierra la sesion), la consulta queda pidiendo datos con un
  // request sin token y la pantalla se ve "cargando" indefinidamente en
  // vez de mostrarse vacia mientras el guard de rutas redirige al login.
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    enabled: !!token,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setRefreshing(false);
  }, [queryClient]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={notifications ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={40} color="#555" />
          <Text style={styles.emptyText}>No tienes notificaciones todavia.</Text>
        </View>
      }
      renderItem={({ item }: { item: NotificationResponse }) => (
        <SwipeableRow
          actions={
            item.isRead
              ? []
              : [
                  {
                    label: 'Leida',
                    icon: 'checkmark-done',
                    color: '#D4AF37',
                    onPress: () => markAsReadMutation.mutate(item.id),
                  },
                ]
          }
        >
          <View style={[styles.card, !item.isRead && styles.cardUnread]}>
            <Ionicons
              name={TYPE_ICON[item.type] ?? 'notifications'}
              size={22}
              color={item.isRead ? '#888' : '#D4AF37'}
              style={styles.icon}
            />
            <View style={styles.textBlock}>
              <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </View>
        </SwipeableRow>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 12, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#888', marginTop: 12, fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardUnread: { borderColor: '#D4AF37' },
  icon: { marginRight: 12, marginTop: 2 },
  textBlock: { flex: 1 },
  title: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  titleUnread: { color: '#fff' },
  body: { color: '#888', fontSize: 13, marginTop: 2 },
  date: { color: '#555', fontSize: 11, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4AF37', marginLeft: 8, marginTop: 4 },
});
