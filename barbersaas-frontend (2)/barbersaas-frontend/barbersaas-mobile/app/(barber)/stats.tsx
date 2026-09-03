import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMyBarberStats } from '../../src/api/barberStats';
import { formatCurrency } from '../../src/utils/dates';

export default function BarberStatsScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['barber-stats'],
    queryFn: getMyBarberStats,
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
        <Text style={styles.errorText}>No se pudieron cargar tus metricas.</Text>
      </View>
    );
  }

  const totalAppointments = data.appointmentsCompletedThisMonth + data.appointmentsCancelledThisMonth;
  const completionRate = totalAppointments > 0
    ? Math.round((data.appointmentsCompletedThisMonth / totalAppointments) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Mis Metricas</Text>
      <Text style={styles.subheader}>Mes actual</Text>

      <View style={styles.row}>
        <MetricCard label="Completadas" value={String(data.appointmentsCompletedThisMonth)} />
        <MetricCard label="Canceladas" value={String(data.appointmentsCancelledThisMonth)} />
      </View>

      <View style={styles.row}>
        <MetricCard label="Ingresos generados" value={formatCurrency(data.revenueGeneratedThisMonth)} highlight wide />
      </View>

      <View style={styles.row}>
        <MetricCard label="Tasa de finalizacion" value={`${completionRate}%`} />
        <MetricCard label="Citas proximas" value={String(data.upcomingAppointmentsCount)} />
      </View>

      <Text style={styles.sectionTitle}>Calificacion</Text>
      <View style={styles.ratingCard}>
        {data.ratingCount > 0 ? (
          <>
            <Text style={styles.ratingValue}>⭐ {data.ratingAvg?.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>basado en {data.ratingCount} reseñas</Text>
          </>
        ) : (
          <Text style={styles.noRating}>Aun no tienes reseñas de clientes.</Text>
        )}
      </View>
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
  header: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subheader: { color: '#888', fontSize: 13, marginBottom: 16, marginTop: 2 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  metricCardHighlight: { borderColor: '#D4AF37' },
  metricCardWide: { flex: 1 },
  metricValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  metricLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  ratingCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  ratingValue: { color: '#FFD700', fontSize: 28, fontWeight: '700' },
  ratingCount: { color: '#888', fontSize: 12, marginTop: 4 },
  noRating: { color: '#888', fontSize: 13 },
});