import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBarbershop, createBarbershopOwner, getPlans } from '../../../src/api/superAdmin';
import { showAlert } from '../../../src/utils/alertBridge';

/**
 * Flujo de 2 pasos:
 * 1. Datos de la barberia (nombre, ciudad, plan, etc.) -> POST /barbershops
 * 2. Datos del primer ADMIN_BARBERSHOP -> POST /barbershops/{id}/owner
 *
 * El paso 2 solo se habilita despues de que el paso 1 fue exitoso,
 * porque necesita el ID de la barberia recien creada.
 */
export default function CreateBarbershopScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [createdBarbershopId, setCreatedBarbershopId] = useState<number | null>(null);
  const [createdBarbershopName, setCreatedBarbershopName] = useState('');

  // ---- Paso 1: datos de la barberia ----
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState<number | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // ---- Paso 2: datos del admin ----
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [step2Error, setStep2Error] = useState<string | null>(null);

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getPlans,
  });

  const createShopMutation = useMutation({
    mutationFn: createBarbershop,
    onSuccess: async (data) => {
      // La barberia ya existe en el backend desde aqui (aunque el
      // administrador se cree en el paso 2) -- invalidamos ya para que
      // la lista este al dia incluso si el usuario abandona el paso 2.
      await queryClient.invalidateQueries({ queryKey: ['all-barbershops'] });
      setCreatedBarbershopId(data.id);
      setCreatedBarbershopName(data.name);
      setStep(2);
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setStep1Error(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo crear la barberia');
    },
  });

  const createOwnerMutation = useMutation({
    mutationFn: () => createBarbershopOwner(createdBarbershopId!, {
      fullName: ownerName.trim(),
      email: ownerEmail.trim(),
      password: ownerPassword,
      phone: ownerPhone.trim(),
    }),
    onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ['all-barbershops'] });
  showAlert(
    'Barberia creada',
    `"${createdBarbershopName}" fue registrada y su administrador puede iniciar sesion.`,
    [{ text: 'Listo', onPress: () => router.replace('/(super-admin)/barbershops') }]
  );
},
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setStep2Error(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo crear el administrador');
    },
  });

  const handleSubmitStep1 = () => {
    if (!name.trim() || !city.trim() || !phone.trim() || !planId) {
      setStep1Error('Completa nombre, ciudad, telefono y selecciona un plan');
      return;
    }
    setStep1Error(null);
    createShopMutation.mutate({
      name: name.trim(),
      city: city.trim(),
      address: address.trim() || undefined,
      phone: phone.trim(),
      planId,
    });
  };

  const handleSubmitStep2 = () => {
    if (!ownerName.trim() || !ownerEmail.trim() || !ownerPhone.trim() || !ownerPassword.trim()) {
      setStep2Error('Completa todos los campos');
      return;
    }
    setStep2Error(null);
    createOwnerMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Nueva barberia' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepIndicator}>
          <StepBadge number={1} active={step === 1} done={step === 2} label="Datos" />
          <View style={styles.stepLine} />
          <StepBadge number={2} active={step === 2} done={false} label="Administrador" />
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.sectionTitle}>Datos de la barberia</Text>

            <TextInput style={styles.input} placeholder="Nombre del negocio" placeholderTextColor="#888" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Ciudad" placeholderTextColor="#888" value={city} onChangeText={setCity} />
            <TextInput style={styles.input} placeholder="Direccion (opcional)" placeholderTextColor="#888" value={address} onChangeText={setAddress} />
            <TextInput style={styles.input} placeholder="Telefono" placeholderTextColor="#888" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Plan de suscripcion</Text>
            {loadingPlans ? (
              <ActivityIndicator color="#D4AF37" />
            ) : (
              <View style={styles.planOptions}>
                {plans?.filter((p) => p.isActive).map((plan) => (
                  <Pressable
                    key={plan.id}
                    style={[styles.planOption, planId === plan.id && styles.planOptionSelected]}
                    onPress={() => setPlanId(plan.id)}
                  >
                    <Text style={[styles.planOptionName, planId === plan.id && styles.planOptionTextSelected]}>{plan.name}</Text>
                    <Text style={[styles.planOptionPrice, planId === plan.id && styles.planOptionTextSelected]}>
                        ${plan.price.toLocaleString('es-CO')}/mes
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {step1Error && <Text style={styles.errorText}>{step1Error}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmitStep1} disabled={createShopMutation.isPending}>
              {createShopMutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Continuar</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Administrador de "{createdBarbershopName}"</Text>
            <Text style={styles.hint}>
              Esta persona podra iniciar sesion como administrador de la barberia
              y gestionar su equipo, servicios y horarios.
            </Text>

            <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#888" value={ownerName} onChangeText={setOwnerName} />
            <TextInput style={styles.input} placeholder="Correo electronico" placeholderTextColor="#888" value={ownerEmail} onChangeText={setOwnerEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Telefono" placeholderTextColor="#888" value={ownerPhone} onChangeText={setOwnerPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Contrasena (min. 8 caracteres)" placeholderTextColor="#888" value={ownerPassword} onChangeText={setOwnerPassword} secureTextEntry />

            {step2Error && <Text style={styles.errorText}>{step2Error}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmitStep2} disabled={createOwnerMutation.isPending}>
              {createOwnerMutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Finalizar</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StepBadge({ number, active, done, label }: { number: number; active: boolean; done: boolean; label: string }) {
  return (
    <View style={styles.stepBadgeContainer}>
      <View style={[styles.stepBadge, (active || done) && styles.stepBadgeActive]}>
        <Text style={[styles.stepBadgeText, (active || done) && styles.stepBadgeTextActive]}>
          {done ? '✓' : number}
        </Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingBottom: 40 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepBadgeContainer: { alignItems: 'center' },
  stepBadge: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  stepBadgeActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  stepBadgeText: { color: '#888', fontWeight: '700' },
  stepBadgeTextActive: { color: '#121212' },
  stepLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  stepLine: { width: 40, height: 2, backgroundColor: '#2A2A2A', marginHorizontal: 8, marginBottom: 18 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  hint: { color: '#888', fontSize: 12, marginBottom: 16, lineHeight: 18 },
  label: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  planOptions: { gap: 8, marginBottom: 8 },
  planOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  planOptionSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  planOptionName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  planOptionPrice: { color: '#888', fontSize: 13 },
  planOptionTextSelected: { color: '#121212' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginVertical: 8, textAlign: 'center' },
  submitButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  submitButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
});