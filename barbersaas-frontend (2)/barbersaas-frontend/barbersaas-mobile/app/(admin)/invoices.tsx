import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getInvoices } from '../../src/api/invoices';
import { getEmployees } from '../../src/api/employees';
import { InvoiceSummaryResponse } from '../../src/types/invoice';
import { getStartOfMonthString, getEndOfMonthString, formatCurrency } from '../../src/utils/dates';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { InvoiceDetailModal } from '../../src/components/InvoiceDetailModal';

export default function InvoicesScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  const from = getStartOfMonthString();
  const to = getEndOfMonthString();

  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const barbers = (employees ?? []).filter((e) => e.role === 'BARBER');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', from, to, selectedBarberId],
    queryFn: () => getInvoices(from, to, selectedBarberId),
  });

  const totalAmount = (invoices ?? []).reduce((sum, i) => sum + i.total, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Facturas' }} />

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{invoices?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Cortes facturados</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#D4AF37' }]}>{formatCurrency(totalAmount)}</Text>
          <Text style={styles.summaryLabel}>Total del periodo</Text>
        </View>
      </View>
      <Text style={styles.hint}>Periodo: {from} a {to}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        <Pressable style={[styles.chip, selectedBarberId === null && styles.chipActive]} onPress={() => setSelectedBarberId(null)}>
          <Text style={[styles.chipText, selectedBarberId === null && styles.chipTextActive]}>Todos</Text>
        </Pressable>
        {barbers.map((b) => (
          <Pressable
            key={b.userId}
            style={[styles.chip, selectedBarberId === b.barberProfileId && styles.chipActive]}
            onPress={() => setSelectedBarberId(b.barberProfileId)}
          >
            <Text style={[styles.chipText, selectedBarberId === b.barberProfileId && styles.chipTextActive]}>{b.fullName}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => String(item.appointmentId)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay cortes completados en este periodo.</Text>}
          renderItem={({ item }: { item: InvoiceSummaryResponse }) => (
            <Pressable style={styles.card} onPress={() => setSelectedAppointmentId(item.appointmentId)}>
              <View style={styles.cardRow}>
                <Text style={styles.cardDate}>{item.appointmentDate} · {item.startTime.slice(0, 5)}</Text>
                <Text style={styles.cardTotal}>{formatCurrency(item.total)}</Text>
              </View>
              <Text style={styles.cardService}>{item.serviceName}</Text>
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardMeta}>Barbero: {item.barberName}</Text>
                <Text style={styles.cardMeta}>Cliente: {item.clientName}</Text>
              </View>
              <View style={styles.badgeRow}>
                {item.hasProducts && (
                  <View style={styles.badge}><Text style={styles.badgeText}>Productos</Text></View>
                )}
                {item.promotionTitle && (
                  <View style={[styles.badge, styles.badgePromo]}><Text style={styles.badgeText}>{item.promotionTitle}</Text></View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}

      <InvoiceDetailModal
        appointmentId={selectedAppointmentId}
        onClose={() => setSelectedAppointmentId(null)}
        toast={toast}
      />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  summaryCard: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, margin: 16, marginBottom: 4, padding: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#2A2A2A' },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  summaryLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  hint: { color: '#888', fontSize: 12, marginHorizontal: 16, marginBottom: 10 },
  chipsRow: { flexGrow: 0, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#121212' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { color: '#888', fontSize: 12 },
  cardTotal: { color: '#D4AF37', fontSize: 16, fontWeight: '700' },
  cardService: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 4 },
  cardMetaRow: { marginTop: 6, gap: 2 },
  cardMeta: { color: '#888', fontSize: 12 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgePromo: { backgroundColor: '#1E3A1E' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
