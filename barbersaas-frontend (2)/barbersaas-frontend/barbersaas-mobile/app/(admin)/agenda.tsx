import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBarbershopAgenda, confirmAppointment, startAppointment, completeAppointment } from '../../src/api/appointments';
import { getTodayString, formatCurrency } from '../../src/utils/dates';
import { AppointmentResponse, AppointmentStatus } from '../../src/types/appointment';
import { grantSticker } from '../../src/api/loyalty';
import { showAlert } from '../../src/utils/alertBridge';
import { InvoiceDetailModal } from '../../src/components/InvoiceDetailModal';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

/**
 * Genera los proximos 7 dias (incluyendo hoy) como chips de fecha,
 * mismo patron usado en la agenda del barbero y en booking.
 */
function getNext7Days(): { label: string; value: string }[] {
  const days = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Hoy' : `${dayNames[d.getDay()]} ${d.getDate()}`;
    days.push({ label, value });
  }

  return days;
}


const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistio',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: '#FFA500',
  CONFIRMED: '#4CAF50',
  IN_PROGRESS: '#2196F3',
  COMPLETED: '#888',
  CANCELLED: '#FF6B6B',
  NO_SHOW: '#FF6B6B',
};

export default function AdminAgendaScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const days = getNext7Days();
  const [date, setDate] = useState(days[0].value);
  const [completedAppointmentId, setCompletedAppointmentId] = useState<number | null>(null);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['barbershop-agenda', date],
    queryFn: () => getBarbershopAgenda(date),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['barbershop-agenda', date] });

  const grantStickerMutation = useMutation({
  mutationFn: grantSticker,
  onSuccess: () => {
    showAlert('Sello otorgado', 'Se agrego un sello a la tarjeta de fidelidad del cliente.');
  },
  onError: (error: any) => {
    showAlert('Error', error.response?.data?.error ?? 'No se pudo otorgar el sello');
  },
});

  const confirmMutation = useMutation({
    mutationFn: confirmAppointment,
    onSuccess: invalidate,
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo confirmar la cita');
    },
  });

  const startMutation = useMutation({
    mutationFn: startAppointment,
    onSuccess: invalidate,
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo iniciar el servicio');
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeAppointment,
    onSuccess: (_data, appointmentId) => {
      invalidate();
      toast.show('Servicio marcado como hecho. Registra aqui los productos o la promocion.');
      setCompletedAppointmentId(appointmentId);
    },
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo marcar el servicio como hecho');
    },
  });

  const anyMutationPending =
    confirmMutation.isPending || startMutation.isPending || completeMutation.isPending || grantStickerMutation.isPending;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent}>
        {days.map((day) => (
          <Pressable
            key={day.value}
            style={[styles.dateChip, date === day.value && styles.dateChipSelected]}
            onPress={() => setDate(day.value)}
          >
            <Text style={[styles.dateChipText, date === day.value && styles.dateChipTextSelected]}>
              {day.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar la agenda.</Text>
        </View>
      ) : (
      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay citas para esta fecha.</Text>}
        renderItem={({ item }: { item: AppointmentResponse }) => (

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.time}>{item.startTime.substring(0, 5)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
              </View>
            </View>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.detail}>👤 Cliente: {item.clientName}</Text>
            <Text style={styles.detail}>✂️ Barbero: {item.barberName}</Text>
            <Text style={styles.price}>{formatCurrency(item.priceAtBooking)}</Text>

            {item.status === 'PENDING' && (
              <Pressable
                style={styles.confirmButton}
                onPress={() => confirmMutation.mutate(item.id)}
                disabled={anyMutationPending}
              >
                <Text style={styles.confirmButtonText}>Confirmar cita</Text>
              </Pressable>
            )}

            {item.status === 'CONFIRMED' && (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => startMutation.mutate(item.id)}
                  disabled={anyMutationPending}
                >
                  <Text style={styles.actionButtonText}>Iniciar</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => completeMutation.mutate(item.id)}
                  disabled={anyMutationPending}
                >
                  <Text style={styles.actionButtonText}>Ya se hizo</Text>
                </Pressable>
              </View>
            )}

            {item.status === 'IN_PROGRESS' && (
              <Pressable
                style={[styles.actionButton, styles.completeButton, { marginTop: 10 }]}
                onPress={() => completeMutation.mutate(item.id)}
                disabled={anyMutationPending}
              >
                <Text style={styles.actionButtonText}>Ya se hizo</Text>
              </Pressable>
            )}

            {item.status === 'COMPLETED' && (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, styles.invoiceButton]}
                  onPress={() => setCompletedAppointmentId(item.id)}
                >
                  <Text style={styles.actionButtonText}>Ver factura</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.loyaltyButton]}
                  onPress={() => grantStickerMutation.mutate({ clientId: item.clientId, appointmentId: item.id })}
                  disabled={anyMutationPending}
                >
                  <Text style={styles.loyaltyButtonText}>🎁 Sello</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
      )}

      <InvoiceDetailModal
        appointmentId={completedAppointmentId}
        onClose={() => setCompletedAppointmentId(null)}
        toast={toast}
      />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: { color: '#fff', fontSize: 20, fontWeight: '700', padding: 16, paddingBottom: 8 },
  dateScroll: { flexGrow: 0 },
  dateScrollContent: { paddingHorizontal: 16, paddingBottom: 12 },
  dateChip: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  dateChipSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  dateChipText: { color: '#fff', fontSize: 13 },
  dateChipTextSelected: { color: '#121212', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  startButton: { backgroundColor: '#2196F3' },
  completeButton: { backgroundColor: '#D4AF37' },
  invoiceButton: { backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#D4AF37' },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  loyaltyButton: { flex: 1, borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  loyaltyButtonText: { color: '#D4AF37', fontWeight: '700', fontSize: 13 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  time: { color: '#D4AF37', fontSize: 16, fontWeight: '700' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  serviceName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  detail: { color: '#aaa', fontSize: 13, marginTop: 2 },
  price: { color: '#D4AF37', fontSize: 14, fontWeight: '700', marginTop: 6 },
  confirmButton: { marginTop: 10, backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  confirmButtonText: { color: '#121212', fontWeight: '700', fontSize: 13 },
});
