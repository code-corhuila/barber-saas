import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getPlatformDashboard } from '../../src/api/superAdmin';
import { formatCurrency } from '../../src/utils/dates';

export default function SuperAdminDashboardScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: getPlatformDashboard,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar el dashboard de plataforma.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Vista de Plataforma</Text>

      <Text style={styles.sectionTitle}>Barberias</Text>
      <View style={styles.row}>
        <MetricCard label="Total" value={String(data.totalBarbershops)} />
        <MetricCard label="Activas" value={String(data.activeBarbershops)} />
      </View>
      <View style={styles.row}>
        <MetricCard label="Suspendidas" value={String(data.suspendedBarbershops)} />
        <MetricCard label="En prueba" value={String(data.trialBarbershops)} />
      </View>

      <Text style={styles.sectionTitle}>Actividad de la plataforma</Text>
      <View style={styles.row}>
        <MetricCard label="Clientes totales" value={String(data.totalClients)} />
        <MetricCard label="Citas totales" value={String(data.totalAppointments)} />
      </View>
      <View style={styles.row}>
        <MetricCard label="Ingresos generados (todas las barberias)" value={formatCurrency(data.totalPlatformRevenue)} highlight wide />
      </View>

      {data.mostActiveBarbershops.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Barberias mas activas</Text>
          {data.mostActiveBarbershops.map((b, idx) => (
            <View key={b.barbershopId} style={styles.listItem}>
              <Text style={styles.listItemRank}>#{idx + 1}</Text>
              <Text style={styles.listItemName}>{b.name}</Text>
              <Text style={styles.listItemValue}>{b.totalAppointments} citas</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function MetricCard({ label, value, highlight, wide }: { label: string; value: string; highlight?: boolean; wide?: boolean }) {
  return (
    <View style={[styles.metricCard, highlight && styles.metricCardHighlight, wide && styles.metricCardWide]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  metricCardHighlight: { borderColor: '#D4AF37' },
  metricCardWide: { flex: 1 },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  metricLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  listItemRank: { color: '#D4AF37', fontWeight: '700', width: 30 },
  listItemName: { color: '#fff', flex: 1, fontSize: 13 },
  listItemValue: { color: '#888', fontSize: 12 },
});