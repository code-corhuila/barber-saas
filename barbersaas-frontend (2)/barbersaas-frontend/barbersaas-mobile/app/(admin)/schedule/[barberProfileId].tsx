import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBarberSchedule, setBarberSchedule } from '../../../src/api/schedules';
import { DaySchedule } from '../../../src/types/schedule';
import { showAlert } from '../../../src/utils/alertBridge';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export default function BarberScheduleScreen() {
  const { barberProfileId } = useLocalSearchParams<{ barberProfileId: string }>();
  const id = Number(barberProfileId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: existingSchedule, isLoading } = useQuery({
    queryKey: ['barber-schedule', id],
    queryFn: () => getBarberSchedule(id),
  });

  // dayConfig[dayOfWeek] = { enabled, startTime, endTime }
  const [dayConfig, setDayConfig] = useState<Record<number, { enabled: boolean; startTime: string; endTime: string }>>(
    Object.fromEntries(DAY_NAMES.map((_, i) => [i, { enabled: false, startTime: '08:00', endTime: '18:00' }]))
  );

  useEffect(() => {
    if (existingSchedule) {
      const config = { ...dayConfig };
      existingSchedule.forEach((s) => {
        config[s.dayOfWeek] = {
          enabled: s.isActive,
          startTime: s.startTime.substring(0, 5),
          endTime: s.endTime.substring(0, 5),
        };
      });
      setDayConfig(config);
    }
  }, [existingSchedule]);

  const mutation = useMutation({
    mutationFn: (days: DaySchedule[]) => setBarberSchedule(id, { days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-schedule', id] });
      showAlert('Listo', 'Horario actualizado correctamente', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo guardar el horario');
    },
  });

  const toggleDay = (day: number) => {
    setDayConfig((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  };

  const updateTime = (day: number, field: 'startTime' | 'endTime', value: string) => {
    setDayConfig((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = () => {
    const days: DaySchedule[] = Object.entries(dayConfig)
      .filter(([, config]) => config.enabled)
      .map(([dayOfWeek, config]) => ({
        dayOfWeek: Number(dayOfWeek),
        startTime: config.startTime,
        endTime: config.endTime,
      }));

    if (days.length === 0) {
      showAlert('Atencion', 'Activa al menos un dia de la semana');
      return;
    }

    mutation.mutate(days);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Configurar horario' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Activa los dias que el barbero trabaja y define su horario. Los dias desactivados
          se consideran "dia libre" automaticamente.
        </Text>

        {DAY_NAMES.map((name, dayIndex) => {
          const config = dayConfig[dayIndex];
          return (
            <View key={dayIndex} style={styles.dayRow}>
              <Pressable style={styles.dayToggle} onPress={() => toggleDay(dayIndex)}>
                <View style={[styles.checkbox, config.enabled && styles.checkboxChecked]}>
                  {config.enabled && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.dayName}>{name}</Text>
              </Pressable>

              {config.enabled && (
                <View style={styles.timeInputs}>
                  <TextInput
                    style={styles.timeInput}
                    value={config.startTime}
                    onChangeText={(v) => updateTime(dayIndex, 'startTime', v)}
                    placeholder="08:00"
                    placeholderTextColor="#666"
                  />
                  <Text style={styles.timeSeparator}>-</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={config.endTime}
                    onChangeText={(v) => updateTime(dayIndex, 'endTime', v)}
                    placeholder="18:00"
                    placeholderTextColor="#666"
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Guardar horario</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 100 },
  hint: { color: '#888', fontSize: 12, marginBottom: 16, lineHeight: 18 },
  dayRow: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 12, marginBottom: 8 },
  dayToggle: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#888', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  checkmark: { color: '#121212', fontWeight: '700', fontSize: 14 },
  dayName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  timeInputs: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 32 },
  timeInput: { backgroundColor: '#121212', color: '#fff', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: '#2A2A2A', width: 70, textAlign: 'center' },
  timeSeparator: { color: '#888', marginHorizontal: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#121212', padding: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  saveButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
});