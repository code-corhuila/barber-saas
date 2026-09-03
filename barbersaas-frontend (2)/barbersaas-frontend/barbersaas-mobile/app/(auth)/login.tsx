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
import { Link, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { login } from '../../src/api/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      setErrorMessage(null);
      await setSession(data);
      // La redireccion ocurre automaticamente via AuthGate en _layout.tsx
    },
    onError: (error: any) => {
      const message = error.response?.data?.error ?? 'No se pudo iniciar sesion. Intenta de nuevo.';
      setErrorMessage(message);
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor completa correo y contrasena');
      return;
    }
    setErrorMessage(null);
    mutation.mutate({ email: email.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backLink} onPress={() => router.replace('/(auth)/welcome')}>
          <Text style={styles.backLinkText}>← Volver</Text>
        </Pressable>

        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💈</Text>
          </View>
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>Inicia sesion para continuar</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Correo electronico</Text>
          <TextInput
            style={[styles.input, !email.trim() && errorMessage && styles.inputError]}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.fieldLabel}>Contrasena</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput, !password.trim() && errorMessage && styles.inputError]}
              placeholder="Tu contrasena"
              placeholderTextColor="#666"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.eyeButtonText}>{showPassword ? '🙈' : '👁️'}</Text>
            </Pressable>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, mutation.isPending && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesion</Text>
            )}
          </Pressable>
        </View>
        <Link href="/(auth)/forgot-password" asChild>
  <Pressable style={styles.forgotLink}>
    <Text style={styles.forgotLinkText}>¿Olvidaste tu contrasena?</Text>
  </Pressable>
</Link>

        <Link href="/(auth)/register-choice" style={styles.link} asChild>
          <Pressable>
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.linkTextBold}>Registrate</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  forgotLink: { alignSelf: 'center', marginTop: 14 },
  forgotLinkText: { color: '#888', fontSize: 13 },
  flex: { flex: 1, backgroundColor: '#121212' },
  container: { flexGrow: 1, backgroundColor: '#121212', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, justifyContent: 'center' },
  backLink: { position: 'absolute', top: 16, left: 16 },
  backLinkText: { color: '#888', fontSize: 14 },
  logoSection: { alignItems: 'center', marginBottom: 36, marginTop: 40 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 6 },
  form: { marginBottom: 8 },
  fieldLabel: { color: '#ccc', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  inputError: { borderColor: '#FF6B6B' },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: 14, top: 14 },
  eyeButtonText: { fontSize: 18 },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { color: '#888', fontSize: 14 },
  linkTextBold: { color: '#D4AF37', fontWeight: '700' },
});