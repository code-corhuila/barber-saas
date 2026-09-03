import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyBarberHistory } from '../../src/api/invoices';
import { formatCurrency } from '../../src/utils/dates';

export default function BarberHistoryScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['barber-history'],
    queryFn: getMyBarberHistory,
    refetchOnMount: 'always',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['barber-history'] });
    setRefreshing(false);
  }, [queryClient]);

  const totalEarned = (appointments ?? []).reduce((sum, a) => sum + a.priceAtBooking, 0);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar tu historial.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mi Historial</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{appointments?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Cortes hechos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#D4AF37' }]}>{formatCurrency(totalEarned)}</Text>
          <Text style={styles.summaryLabel}>Total generado</Text>
        </View>
      </View>
      <Text style={styles.hint}>Este es tu historial de cortes completados. El resumen y facturas los maneja el administrador.</Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        ListEmptyComponent={<Text style={styles.emptyText}>Aun no has completado ningun corte.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.serviceName}>{item.serviceName}</Text>
              <Text style={styles.price}>{formatCurrency(item.priceAtBooking)}</Text>
            </View>
            <Text style={styles.detail}>👤 {item.clientName}</Text>
            <Text style={styles.detail}>📅 {item.appointmentDate} - 🕐 {item.startTime.substring(0, 5)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 0 },
  summaryCard: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, margin: 16, padding: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#2A2A2A' },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  summaryLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  hint: { color: '#888', fontSize: 12, marginHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  price: { color: '#D4AF37', fontSize: 15, fontWeight: '700' },
  detail: { color: '#aaa', fontSize: 13, marginTop: 2 },
});
