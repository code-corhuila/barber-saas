import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepIndicator } from './step1';

export default function OwnerStep2Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    ownerFullName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerPassword: string;
  }>();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!name.trim() || !city.trim() || !phone.trim()) {
      setError('Completa nombre, ciudad y telefono');
      return;
    }
    setError(null);

    router.push({
      pathname: '/(auth)/register-owner/step3',
      params: {
        ...params,
        barbershopName: name.trim(),
        city: city.trim(),
        address: address.trim(),
        barbershopPhone: phone.trim(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Registrar barberia' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator current={2} />

        <Text style={styles.title}>Tu barberia</Text>
        <Text style={styles.subtitle}>Cuentanos sobre tu negocio.</Text>

        <TextInput style={styles.input} placeholder="Nombre del negocio" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Ciudad" placeholderTextColor="#888" value={city} onChangeText={setCity} />
        <TextInput style={styles.input} placeholder="Direccion (opcional)" placeholderTextColor="#888" value={address} onChangeText={setAddress} />
        <TextInput style={styles.input} placeholder="Telefono de la barberia" placeholderTextColor="#888" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continuar</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
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
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginVertical: 8, textAlign: 'center' },
  nextButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  nextButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  backButton: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  backButtonText: { color: '#888' },
});