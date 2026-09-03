import { useState, useRef } from 'react';
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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { resetPassword, forgotPassword } from '../../src/api/auth';
import { showAlert } from '../../src/utils/alertBridge';

/**
 * Paso 2 del flujo de recuperacion de contrasena.
 * El usuario ingresa el codigo de 6 digitos que recibio por email
 * y su nueva contrasena.
 *
 * El email llega como parametro de navegacion desde forgot-password.tsx.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  // Codigo de 6 digitos: un input por digito para mejor UX
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      showAlert(
        'Contrasena actualizada',
        'Tu contrasena fue restablecida correctamente. Ya puedes iniciar sesion.',
        [{ text: 'Iniciar sesion', onPress: () => router.replace('/(auth)/login') }]
      );
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'El codigo es invalido o ya expiro. Solicita uno nuevo.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      showAlert('Codigo reenviado', 'Revisa tu correo y carpeta de spam.');
    },
    onError: () => {
      showAlert('Error', 'No se pudo reenviar el codigo. Intenta de nuevo.');
    },
  });

  const handleDigitChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // solo numeros
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // solo 1 digito
    setDigits(newDigits);
    if (error) setError(null);

    // avanza al siguiente input automaticamente
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const token = digits.join('');
    if (token.length < 6) {
      setError('Ingresa el codigo de 6 digitos completo');
      return;
    }
    if (!newPassword.trim()) {
      setError('Ingresa tu nueva contrasena');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    setError(null);
    resetMutation.mutate({ email: email!, token, newPassword });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Volver</Text>
        </Pressable>

        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>📬</Text>
        </View>

        <Text style={styles.title}>Revisa tu correo</Text>
        <Text style={styles.subtitle}>
          Enviamos un codigo de 6 digitos a{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        {/* Inputs de codigo */}
        <Text style={styles.label}>Codigo de verificacion</Text>
        <View style={styles.codeRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.digitInput, digit && styles.digitInputFilled]}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, index)}
              onKeyPress={({ nativeEvent }) => handleDigitKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Pressable
          style={styles.resendLink}
          onPress={() => resendMutation.mutate({ email: email! })}
          disabled={resendMutation.isPending}
        >
          <Text style={styles.resendLinkText}>
            {resendMutation.isPending ? 'Reenviando...' : '¿No recibiste el codigo? Reenviar'}
          </Text>
        </Pressable>

        {/* Nueva contrasena */}
        <Text style={[styles.label, { marginTop: 20 }]}>Nueva contrasena</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Min. 8 caracteres"
            placeholderTextColor="#666"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (error) setError(null);
            }}
            secureTextEntry={!showPassword}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.eyeButtonText}>{showPassword ? '🙈' : '👁️'}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Confirmar contrasena</Text>
        <TextInput
          style={styles.input}
          placeholder="Repite tu nueva contrasena"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (error) setError(null);
          }}
          secureTextEntry={!showPassword}
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={resetMutation.isPending}>
          {resetMutation.isPending ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.buttonText}>Restablecer contrasena</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
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
  emailHighlight: { color: '#D4AF37', fontWeight: '600' },
  label: { color: '#ccc', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  codeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 12 },
  digitInput: {
    width: 46,
    height: 56,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  digitInputFilled: { borderColor: '#D4AF37' },
  resendLink: { alignSelf: 'center', marginBottom: 8 },
  resendLinkText: { color: '#D4AF37', fontSize: 13 },
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
  buttonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
});