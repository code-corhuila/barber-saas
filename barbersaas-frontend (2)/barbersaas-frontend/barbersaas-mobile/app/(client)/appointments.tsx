import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAppointments, cancelAppointment } from '../../src/api/appointments';
import { AppointmentResponse, AppointmentStatus } from '../../src/types/appointment';
import { ReviewModal } from '../../src/components/ReviewModal';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
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

export default function MyAppointmentsScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [reviewTarget, setReviewTarget] = useState<AppointmentResponse | null>(null);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: getMyAppointments,
    refetchOnMount: 'always',
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => cancelAppointment(id, { reason: 'Cancelada por el cliente' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error ?? 'No se pudo cancelar la cita';
      showAlert('Error', message);
    },
  });

  const handleCancel = (appointment: AppointmentResponse) => {
    showAlert(
      'Cancelar cita',
      `¿Seguro que deseas cancelar tu cita de ${appointment.serviceName} el ${appointment.appointmentDate}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Si, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate({ id: appointment.id }) },
      ]
    );
  };

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
        <Text style={styles.errorText}>No se pudieron cargar tus citas.</Text>
      </View>
    );
  }

  const canCancel = (status: AppointmentStatus) => status === 'PENDING' || status === 'CONFIRMED';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Citas</Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aun no tienes citas reservadas.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.serviceName}>{item.serviceName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
              </View>
            </View>

            <Text style={styles.detail}>👤 {item.barberName}</Text>
            <Text style={styles.detail}>
              📅 {item.appointmentDate} - 🕐 {item.startTime.substring(0, 5)}
            </Text>
            {item.priceAtBooking === 0 ? (
  <Text style={styles.freeLabel}>🎁 Gratis (recompensa canjeada)</Text>
) : (
  <Text style={styles.price}>${item.priceAtBooking.toLocaleString('es-CO')}</Text>
)}

            {item.cancelledReason && (
              <Text style={styles.cancelledReason}>Motivo: {item.cancelledReason}</Text>
            )}

            {canCancel(item.status) && (
              <Pressable
                style={styles.cancelButton}
                onPress={() => handleCancel(item)}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>Cancelar cita</Text>
              </Pressable>
            )}

            {item.status === 'COMPLETED' && (
              <Pressable style={styles.reviewButton} onPress={() => setReviewTarget(item)}>
                <Text style={styles.reviewButtonText}>⭐ Dejar reseña</Text>
              </Pressable>
            )}
          </View>
        )}
      />

      {reviewTarget && (
        <ReviewModal
          visible={!!reviewTarget}
          barbershopId={reviewTarget.barbershopId}
          barberProfileId={reviewTarget.barberId}
          appointmentId={reviewTarget.id}
          title={`¿Cómo te fue con ${reviewTarget.barberName}?`}
          onClose={() => setReviewTarget(null)}
          onDone={() => toast.show('Gracias por tu reseña')}
        />
      )}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', padding: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  freeLabel: { color: '#4CAF50', fontSize: 14, fontWeight: '700', marginTop: 6 },
  serviceName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  detail: { color: '#aaa', fontSize: 13, marginTop: 2 },
  price: { color: '#D4AF37', fontSize: 15, fontWeight: '700', marginTop: 6 },
  cancelledReason: { color: '#FF6B6B', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  cancelButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#FF6B6B', fontWeight: '600', fontSize: 13 },
  reviewButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  reviewButtonText: { color: '#D4AF37', fontWeight: '600', fontSize: 13 },
});