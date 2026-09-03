import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyBarberAgenda,
  confirmAppointment,
  startAppointment,
  completeAppointment,
  markNoShow,
} from '../../src/api/appointments';
import { grantSticker } from '../../src/api/loyalty';
import { AppointmentResponse, AppointmentStatus } from '../../src/types/appointment';
import { formatCurrency } from '../../src/utils/dates';
import { showAlert } from '../../src/utils/alertBridge';

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

/**
 * Genera los proximos 7 dias (incluyendo hoy) como chips de fecha,
 * mismo patron usado en booking/[barbershopId].tsx (Fase 11) y
 * la agenda del admin (Fase 12).
 */
function getNext7Days(): { label: string; value: string }[] {
  const days = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const value = date.toISOString().split('T')[0];
    const label = i === 0 ? 'Hoy' : `${dayNames[date.getDay()]} ${date.getDate()}`;

    days.push({ label, value });
  }

  return days;
}

export default function BarberAgendaScreen() {
  const queryClient = useQueryClient();
  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(days[0].value);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['barber-agenda', selectedDate],
    queryFn: () => getMyBarberAgenda(selectedDate),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['barber-agenda', selectedDate] });

  const handleError = (error: any) => {
    showAlert('Error', error.response?.data?.error ?? 'No se pudo actualizar la cita');
  };

  const confirmMutation = useMutation({ mutationFn: confirmAppointment, onSuccess: invalidate, onError: handleError });
  const startMutation = useMutation({ mutationFn: startAppointment, onSuccess: invalidate, onError: handleError });
  const completeMutation = useMutation({ mutationFn: completeAppointment, onSuccess: invalidate, onError: handleError });
  const noShowMutation = useMutation({
    mutationFn: markNoShow,
    onSuccess: invalidate,
    onError: handleError,
  });

  const grantStickerMutation = useMutation({
    mutationFn: grantSticker,
    onSuccess: () => {
      showAlert('Sello otorgado', 'Se agrego un sello a la tarjeta de fidelidad del cliente.');
    },
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo otorgar el sello');
    },
  });

  const anyMutationPending =
    confirmMutation.isPending ||
    startMutation.isPending ||
    completeMutation.isPending ||
    noShowMutation.isPending ||
    grantStickerMutation.isPending;

  const handleNoShow = (id: number) => {
    showAlert(
      'Marcar como no asistio',
      '¿Confirmas que el cliente no se presento a esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Si, marcar', style: 'destructive', onPress: () => noShowMutation.mutate(id) },
      ]
    );
  };

  const handleGrantSticker = (appointment: AppointmentResponse) => {
    showAlert(
      'Otorgar sello de fidelidad',
      `¿Otorgar un sello a ${appointment.clientName} por este servicio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Otorgar',
          onPress: () => grantStickerMutation.mutate({ clientId: appointment.clientId, appointmentId: appointment.id }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mi Agenda</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent}>
        {days.map((day) => (
          <Pressable
            key={day.value}
            style={[styles.dateChip, selectedDate === day.value && styles.dateChipSelected]}
            onPress={() => setSelectedDate(day.value)}
          >
            <Text style={[styles.dateChipText, selectedDate === day.value && styles.dateChipTextSelected]}>
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
          <Text style={styles.errorText}>No se pudo cargar tu agenda.</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No tienes citas para este dia.</Text>}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              disabled={anyMutationPending}
              onConfirm={() => confirmMutation.mutate(item.id)}
              onStart={() => startMutation.mutate(item.id)}
              onComplete={() => completeMutation.mutate(item.id)}
              onNoShow={() => handleNoShow(item.id)}
              onGrantSticker={() => handleGrantSticker(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function AppointmentCard({
  appointment,
  disabled,
  onConfirm,
  onStart,
  onComplete,
  onNoShow,
  onGrantSticker,
}: {
  appointment: AppointmentResponse;
  disabled: boolean;
  onConfirm: () => void;
  onStart: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  onGrantSticker: () => void;
}) {
  const { status } = appointment;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.time}>{appointment.startTime.substring(0, 5)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
        </View>
      </View>

      <Text style={styles.serviceName}>{appointment.serviceName}</Text>
      <Text style={styles.detail}>👤 {appointment.clientName}</Text>
      <Text style={styles.price}>{formatCurrency(appointment.priceAtBooking)}</Text>

      {appointment.notes && <Text style={styles.notes}>📝 {appointment.notes}</Text>}

      <View style={styles.actions}>
        {status === 'PENDING' && (
          <Pressable style={[styles.actionButton, styles.confirmButton]} onPress={onConfirm} disabled={disabled}>
            <Text style={styles.actionButtonText}>Confirmar</Text>
          </Pressable>
        )}

        {status === 'CONFIRMED' && (
          <>
            <Pressable style={[styles.actionButton, styles.startButton]} onPress={onStart} disabled={disabled}>
              <Text style={styles.actionButtonText}>Iniciar</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.noShowButton]} onPress={onNoShow} disabled={disabled}>
              <Text style={styles.actionButtonTextOutline}>No asistio</Text>
            </Pressable>
          </>
        )}

        {status === 'IN_PROGRESS' && (
          <Pressable style={[styles.actionButton, styles.completeButton]} onPress={onComplete} disabled={disabled}>
            <Text style={styles.actionButtonText}>Completar</Text>
          </Pressable>
        )}
      </View>

      {status === 'COMPLETED' && (
        <Pressable style={styles.loyaltyButton} onPress={onGrantSticker} disabled={disabled}>
          <Text style={styles.loyaltyButtonText}>🎁 Otorgar sello de fidelidad</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 8 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
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
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  time: { color: '#D4AF37', fontSize: 16, fontWeight: '700' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  serviceName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  detail: { color: '#aaa', fontSize: 13, marginTop: 2 },
  price: { color: '#D4AF37', fontSize: 14, fontWeight: '700', marginTop: 6 },
  notes: { color: '#888', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  confirmButton: { backgroundColor: '#4CAF50' },
  startButton: { backgroundColor: '#2196F3' },
  completeButton: { backgroundColor: '#D4AF37' },
  noShowButton: { borderWidth: 1, borderColor: '#FF6B6B', backgroundColor: 'transparent' },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionButtonTextOutline: { color: '#FF6B6B', fontWeight: '700', fontSize: 13 },
  loyaltyButton: { marginTop: 10, borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  loyaltyButtonText: { color: '#D4AF37', fontWeight: '700', fontSize: 13 },
});