import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../../src/api/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: email.trim() },
      });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'No se pudo procesar la solicitud. Intenta de nuevo.');
    },
  });

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electronico');
      return;
    }
    setError(null);
    mutation.mutate({ email: email.trim() });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Volver</Text>
        </Pressable>

        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🔑</Text>
        </View>

        <Text style={styles.title}>¿Olvidaste tu contrasena?</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo y te enviaremos un codigo de 6 digitos para restablecer tu contrasena.
        </Text>

        <Text style={styles.label}>Correo electronico</Text>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="tucorreo@ejemplo.com"
          placeholderTextColor="#666"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.buttonText}>Enviar codigo</Text>
          )}
        </Pressable>

        <Text style={styles.hint}>
          Revisa tu bandeja de entrada y carpeta de spam despues de enviar.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  container: { flexGrow: 1, padding: 24, paddingTop: 60, justifyContent: 'center' },
  backLink: { position: 'absolute', top: 16, left: 16 },
  backLinkText: { color: '#888', fontSize: 14 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  logoEmoji: { fontSize: 32 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  label: { color: '#ccc', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 14,
  },
  inputError: { borderColor: '#FF6B6B' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1515',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#5a2a2a',
    gap: 8,
  },
  errorIcon: { fontSize: 14 },
  errorText: { color: '#FF8A8A', fontSize: 13, flex: 1 },
  button: { backgroundColor: '#D4AF37', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  hint: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});