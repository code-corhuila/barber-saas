import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBarbershopBarbers, getAvailability } from '../../../src/api/barbershops';
import { createAppointment } from '../../../src/api/appointments';
import { showAlert } from '../../../src/utils/alertBridge';

/**
 * Genera los proximos 7 dias (incluyendo hoy) como opciones de fecha,
 * en formato "YYYY-MM-DD" para enviar al backend.
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

export default function BookingScreen() {
  const { barbershopId, serviceId } = useLocalSearchParams<{ barbershopId: string; serviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const shopId = Number(barbershopId);
  const svcId = Number(serviceId);

  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getNext7Days()[0].value);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: barbers, isLoading: loadingBarbers } = useQuery({
    queryKey: ['barbers', shopId],
    queryFn: () => getBarbershopBarbers(shopId),
  });

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['availability', selectedBarberId, svcId, selectedDate],
    queryFn: () => getAvailability({ barberId: selectedBarberId!, serviceId: svcId, date: selectedDate }),
    enabled: selectedBarberId !== null,
  });

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      showAlert('Cita reservada', 'Tu cita fue registrada y esta pendiente de confirmacion.', [
        { text: 'Ver mis citas', onPress: () => router.replace('/(client)/appointments') },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error ?? 'No se pudo reservar la cita';
      showAlert('Error', message);
    },
  });

  const handleSelectBarber = (barberId: number) => {
    setSelectedBarberId(barberId);
    setSelectedSlot(null); // resetea el slot al cambiar de barbero
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null); // resetea el slot al cambiar de fecha
  };

  const handleConfirm = () => {
    if (!selectedBarberId || !selectedSlot) return;

    createMutation.mutate({
      barberId: selectedBarberId,
      serviceId: svcId,
      appointmentDate: selectedDate,
      startTime: selectedSlot,
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Reservar cita' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Elige tu barbero</Text>

        {loadingBarbers ? (
          <ActivityIndicator color="#D4AF37" />
        ) : (
          <View style={styles.barberRow}>
            {barbers?.map((barber) => (
              <Pressable
                key={barber.id}
                style={[styles.barberCard, selectedBarberId === barber.id && styles.barberCardSelected]}
                onPress={() => handleSelectBarber(barber.id)}
              >
                <Text style={styles.barberName}>{barber.fullName}</Text>
                {barber.ratingAvg !== null && barber.ratingCount! > 0 && (
                  <Text style={styles.barberRating}>⭐ {barber.ratingAvg}</Text>
                )}
                {barber.experienceYears !== null && (
                  <Text style={styles.barberExperience}>{barber.experienceYears} años exp.</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Elige el dia</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {getNext7Days().map((day) => (
            <Pressable
              key={day.value}
              style={[styles.dateChip, selectedDate === day.value && styles.dateChipSelected]}
              onPress={() => handleSelectDate(day.value)}
            >
              <Text style={[styles.dateChipText, selectedDate === day.value && styles.dateChipTextSelected]}>
                {day.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Horarios disponibles</Text>

        {!selectedBarberId ? (
          <Text style={styles.emptyText}>Selecciona un barbero para ver su disponibilidad.</Text>
        ) : loadingSlots ? (
          <ActivityIndicator color="#D4AF37" />
        ) : !slots || slots.length === 0 ? (
          <Text style={styles.emptyText}>No hay horarios disponibles para este dia. Prueba otra fecha.</Text>
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map((slot) => {
              const timeLabel = slot.startTime.substring(0, 5); // "HH:mm:ss" -> "HH:mm"
              return (
                <Pressable
                  key={slot.startTime}
                  style={[styles.slotChip, selectedSlot === slot.startTime && styles.slotChipSelected]}
                  onPress={() => setSelectedSlot(slot.startTime)}
                >
                  <Text style={[styles.slotText, selectedSlot === slot.startTime && styles.slotTextSelected]}>
                    {timeLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.confirmButton, (!selectedSlot || createMutation.isPending) && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedSlot || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {selectedSlot ? `Confirmar cita - ${selectedSlot.substring(0, 5)}` : 'Selecciona un horario'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#888', fontSize: 13 },
  barberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  barberCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    minWidth: 110,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  barberCardSelected: { borderColor: '#D4AF37' },
  barberName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  barberRating: { color: '#FFD700', fontSize: 11, marginTop: 4 },
  barberExperience: { color: '#888', fontSize: 11, marginTop: 2 },
  dateScroll: { flexDirection: 'row' },
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
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  slotChipSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  slotText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  slotTextSelected: { color: '#121212' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  confirmButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  confirmButtonDisabled: { backgroundColor: '#3A3A3A' },
  confirmButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
});