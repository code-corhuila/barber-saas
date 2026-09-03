import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/authStore';
import { StepIndicator } from './step1';
import { getPublicPlans } from '../../../src/api/auth';
import { registerBarbershopOwner } from '../../../src/api/appointments';
import { showAlert } from '../../../src/utils/alertBridge';

export default function OwnerStep3Screen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const params = useLocalSearchParams<{
    ownerFullName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerPassword: string;
    barbershopName: string;
    city: string;
    address: string;
    barbershopPhone: string;
  }>();

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: getPublicPlans,
  });

  const mutation = useMutation({
    mutationFn: () =>
      registerBarbershopOwner({
        ownerFullName: params.ownerFullName,
        ownerEmail: params.ownerEmail,
        ownerPassword: params.ownerPassword,
        ownerPhone: params.ownerPhone,
        barbershopName: params.barbershopName,
        address: params.address || undefined,
        city: params.city,
        barbershopPhone: params.barbershopPhone,
        planId: selectedPlanId!,
      }),
    onSuccess: (data) => {
      setSession(data);
      showAlert(
        '¡Bienvenido a BarberSaaS!',
        `Tu barberia "${params.barbershopName}" fue registrada. Tienes 2 meses de prueba gratis para explorar todas las funciones.`,
        [{ text: 'Empezar', onPress: () => router.replace('/(admin)/dashboard') }]
      );
    },
    onError: (err: any) => {
      const fieldErrors = err.response?.data?.fields;
      setError(fieldErrors ? String(Object.values(fieldErrors)[0]) : err.response?.data?.error ?? 'No se pudo completar el registro');
    },
  });

  const handleSubmit = () => {
    if (!selectedPlanId) {
      setError('Selecciona un plan para continuar');
      return;
    }
    setError(null);
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Registrar barberia' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator current={3} />

        <Text style={styles.title}>Elige tu plan</Text>
        <Text style={styles.subtitle}>
          Los primeros 2 meses son completamente gratis. Despues, se cobrara la mensualidad del plan que elijas.
        </Text>

        {loadingPlans ? (
          <ActivityIndicator color="#D4AF37" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.planList}>
            {plans?.map((plan) => (
              <Pressable
                key={plan.id}
                style={[styles.planCard, selectedPlanId === plan.id && styles.planCardSelected]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                <View style={styles.planCardHeader}>
                  <Text style={[styles.planName, selectedPlanId === plan.id && styles.planTextSelected]}>{plan.name}</Text>
                  {selectedPlanId === plan.id && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.planPrice, selectedPlanId === plan.id && styles.planTextSelected]}>
                  ${plan.price.toLocaleString('es-CO')}/mes
                </Text>
                <Text style={[styles.planDetail, selectedPlanId === plan.id && styles.planTextSelectedMuted]}>
                  Hasta {plan.maxBarbers} barberos
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.trialBanner}>
          <Text style={styles.trialBannerText}>🎉 2 meses gratis para probar todas las funciones</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Crear mi barberia</Text>}
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()} disabled={mutation.isPending}>
          <Text style={styles.backButtonText}>Atras</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  planList: { gap: 10, marginBottom: 16 },
  planCard: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  planCardSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  checkmark: { color: '#121212', fontSize: 16, fontWeight: '800' },
  planPrice: { color: '#D4AF37', fontSize: 18, fontWeight: '700', marginTop: 6 },
  planDetail: { color: '#888', fontSize: 12, marginTop: 4 },
  planTextSelected: { color: '#121212' },
  planTextSelectedMuted: { color: '#3a3120' },
  trialBanner: { backgroundColor: '#1a3a1a', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#4CAF50' },
  trialBannerText: { color: '#4CAF50', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginVertical: 8, textAlign: 'center' },
  submitButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  backButton: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  backButtonText: { color: '#888' },
});