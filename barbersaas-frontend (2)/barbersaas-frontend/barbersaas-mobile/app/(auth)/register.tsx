import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { register } from '../../src/api/auth';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setSession = useAuthStore((s) => s.setSession);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async (data) => {
      setErrorMessage(null);
      await setSession(data);
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      if (fieldErrors) {
        const firstError = Object.values(fieldErrors)[0];
        setErrorMessage(String(firstError));
      } else {
        setErrorMessage(error.response?.data?.error ?? 'No se pudo completar el registro');
      }
    },
  });

  const handleRegister = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }
    mutation.mutate({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Registrate como cliente para reservar citas</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor="#888"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electronico"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Telefono"
        placeholderTextColor="#888"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Contrasena (minimo 8 caracteres)"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <Pressable
        style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarme</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Ya tengo cuenta, iniciar sesion</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  link: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: '#D4AF37',
    fontSize: 14,
  },
});