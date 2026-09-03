import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Wizard de auto-registro de dueno de barberia, paso 1 de 3.
 * El estado se va acumulando en los parametros de navegacion
 * (router.push con params) hasta el paso final, donde se hace
 * un unico POST atomico (ver registerBarbershopOwner en backend).
 * Nada se guarda en el servidor hasta completar el paso 3.
 */
export default function OwnerStep1Screen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    setError(null);

    router.push({
      pathname: '/(auth)/register-owner/step2',
      params: {
        ownerFullName: fullName.trim(),
        ownerEmail: email.trim(),
        ownerPhone: phone.trim(),
        ownerPassword: password,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Registrar barberia' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator current={1} />

        <Text style={styles.title}>Tu cuenta</Text>
        <Text style={styles.subtitle}>Crearemos tu cuenta como administrador de tu barberia.</Text>

        <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#888" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Correo electronico" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Telefono" placeholderTextColor="#888" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Contrasena (min. 8 caracteres)" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirmar contrasena" placeholderTextColor="#888" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continuar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const labels = ['Tu cuenta', 'Tu barberia', 'Tu plan'];
  return (
    <View style={indicatorStyles.row}>
      {labels.map((label, idx) => {
        const step = idx + 1;
        const active = step === current;
        const done = step < current;
        return (
          <View key={label} style={indicatorStyles.stepContainer}>
            <View style={[indicatorStyles.dot, (active || done) && indicatorStyles.dotActive]}>
              <Text style={[indicatorStyles.dotText, (active || done) && indicatorStyles.dotTextActive]}>
                {done ? '✓' : step}
              </Text>
            </View>
            <Text style={[indicatorStyles.label, active && indicatorStyles.labelActive]}>{label}</Text>
            {step < 3 && <View style={indicatorStyles.line} />}
          </View>
        );
      })}
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 28 },
  stepContainer: { alignItems: 'center', flexDirection: 'row' },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  dotActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  dotText: { color: '#888', fontSize: 12, fontWeight: '700' },
  dotTextActive: { color: '#121212' },
  label: { color: '#666', fontSize: 10, position: 'absolute', top: 32, width: 60, textAlign: 'center' },
  labelActive: { color: '#D4AF37' },
  line: { width: 30, height: 2, backgroundColor: '#2A2A2A', marginHorizontal: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginVertical: 8, textAlign: 'center' },
  nextButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  nextButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
});