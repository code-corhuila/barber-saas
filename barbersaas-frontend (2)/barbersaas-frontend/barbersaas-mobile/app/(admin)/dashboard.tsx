import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { getBarbershopDashboard } from '../../src/api/dashboard';
import { getStartOfMonthString, getTodayString, formatCurrency } from '../../src/utils/dates';

export default function AdminDashboardScreen() {
  const from = getStartOfMonthString();
  const to = getTodayString();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard', from, to],
    queryFn: () => getBarbershopDashboard(from, to),
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
        <Text style={styles.errorText}>No se pudo cargar el dashboard.</Text>
      </View>
    );
  }

  // Datos para grafica de barras: top 5 servicios
  const barData = data.topServices.slice(0, 5).map((s) => ({
    value: s.totalBookings,
    label: s.serviceName.length > 8 ? s.serviceName.substring(0, 8) + '…' : s.serviceName,
    frontColor: '#D4AF37',
  }));

  // Datos para grafica de pastel: completadas vs canceladas
  const pieData = [
    { value: data.appointmentsCompleted, color: '#4CAF50', text: 'Completadas' },
    { value: data.appointmentsCancelled, color: '#FF6B6B', text: 'Canceladas' },
    {
      value: Math.max(0, data.totalAppointmentsInRange - data.appointmentsCompleted - data.appointmentsCancelled),
      color: '#888',
      text: 'Otras',
    },
  ].filter((d) => d.value > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Ventas */}
      <View style={styles.row}>
        <MetricCard label="Hoy" value={formatCurrency(data.salesToday)} />
        <MetricCard label="Esta semana" value={formatCurrency(data.salesThisWeek)} />
      </View>
      <View style={styles.row}>
        <MetricCard label="Este mes" value={formatCurrency(data.salesThisMonth)} highlight />
        <MetricCard label="Tasa cancelacion" value={`${data.cancellationRate}%`} />
      </View>

      {/* Clientes */}
      <Text style={styles.sectionTitle}>Clientes</Text>
      <View style={styles.row}>
        <MetricCard label="Total" value={String(data.totalClients)} />
        <MetricCard label="Nuevos (mes)" value={String(data.newClientsThisMonth)} />
        <MetricCard label="Recurrentes" value={String(data.recurringClients)} />
      </View>

      {/* Pastel: estado de citas */}
      {pieData.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Citas este mes</Text>
          <View style={styles.chartCard}>
            <View style={styles.pieRow}>
              <PieChart data={pieData} radius={70} innerRadius={40} />
              <View style={styles.pieLegend}>
                {pieData.map((d) => (
                  <View key={d.text} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={styles.legendText}>{d.text}: {d.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}

      {/* Barras: servicios mas vendidos */}
      {barData.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Servicios mas solicitados</Text>
          <View style={styles.chartCard}>
            <BarChart
              data={barData}
              barWidth={28}
              spacing={20}
              roundedTop
              yAxisTextStyle={{ color: '#888' }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 10 }}
              noOfSections={4}
              height={160}
            />
          </View>
        </>
      )}

      {/* Top barberos */}
      {data.topBarbers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Barberos mas solicitados</Text>
          {data.topBarbers.slice(0, 3).map((b, idx) => (
            <View key={b.barberProfileId} style={styles.listItem}>
              <Text style={styles.listItemRank}>#{idx + 1}</Text>
              <Text style={styles.listItemName}>{b.barberName}</Text>
              <Text style={styles.listItemValue}>{b.totalAppointments} citas</Text>
            </View>
          ))}
        </>
      )}

      {/* Horas pico */}
      {data.peakHours.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Horas pico</Text>
          {data.peakHours.slice(0, 3).map((h) => (
            <View key={h.hourOfDay} style={styles.listItem}>
              <Text style={styles.listItemName}>{String(h.hourOfDay).padStart(2, '0')}:00 hrs</Text>
              <Text style={styles.listItemValue}>{h.totalAppointments} citas</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.metricCard, highlight && styles.metricCardHighlight]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
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
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  metricLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  chartCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pieLegend: { flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: '#aaa', fontSize: 12 },
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