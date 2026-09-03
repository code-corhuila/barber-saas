import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoyaltyConfig, setLoyaltyConfig } from '../../src/api/loyalty';
import { useAuthStore } from '../../src/store/authStore';
import { showAlert } from '../../src/utils/alertBridge';

export default function LoyaltyConfigScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const barbershopId = useAuthStore((s) => s.barbershopId);

  const [stickersRequired, setStickersRequired] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['loyalty-config', barbershopId],
    queryFn: () => getLoyaltyConfig(barbershopId!),
    enabled: barbershopId !== null,
  });

  useEffect(() => {
    if (config) {
      setStickersRequired(String(config.stickersRequired));
      setRewardDescription(config.rewardDescription);
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: setLoyaltyConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loyalty-config', barbershopId] });
      showAlert('Listo', 'La configuracion de fidelidad fue actualizada.', [
            { text: 'OK', onPress: () => router.replace('/(admin)/profile') } 
      ]);
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setErrorMessage(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo guardar la configuracion');
    },
  });

  const handleSave = () => {
    if (!stickersRequired.trim() || !rewardDescription.trim()) {
      setErrorMessage('Completa ambos campos');
      return;
    }
    setErrorMessage(null);
    mutation.mutate({
      stickersRequired: Number(stickersRequired),
      rewardDescription: rewardDescription.trim(),
    });
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
      <Stack.Screen options={{ title: 'Programa de fidelidad' }} />

      <View style={styles.content}>
        <Text style={styles.hint}>
          Define cuantos sellos debe acumular un cliente para obtener una
          recompensa, y describe en que consiste esa recompensa.
        </Text>

        <Text style={styles.label}>Sellos requeridos</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 10"
          placeholderTextColor="#888"
          value={stickersRequired}
          onChangeText={setStickersRequired}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Descripcion de la recompensa</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ej. Un corte de cabello gratis"
          placeholderTextColor="#888"
          value={rewardDescription}
          onChangeText={setRewardDescription}
          multiline
          numberOfLines={3}
        />

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Guardar configuracion</Text>}
        </Pressable>

        {config && !config.isActive && (
          <Text style={styles.warningText}>
            El programa de fidelidad esta actualmente inactivo para tus clientes.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  hint: { color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  label: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  saveButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  warningText: { color: '#FFA500', fontSize: 12, marginTop: 16, textAlign: 'center' },
});