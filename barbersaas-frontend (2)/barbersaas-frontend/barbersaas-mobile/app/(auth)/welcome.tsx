import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💈</Text>
          </View>
          <Text style={styles.appName}>BarberSaaS</Text>
          <Text style={styles.tagline}>
            La forma mas facil de gestionar tu barberia o reservar tu proximo corte.
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Feature emoji="📅" text="Reserva citas en segundos" />
          <Feature emoji="✂️" text="Gestiona tu equipo y agenda" />
          <Feature emoji="🎁" text="Programa de fidelidad para tus clientes" />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.primaryButtonText}>Iniciar sesion</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/(auth)/register-choice')}>
            <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Feature({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  logoSection: { alignItems: 'center', marginTop: 40 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  appName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 20 },
  featuresSection: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, gap: 12 },
  featureEmoji: { fontSize: 22 },
  featureText: { color: '#ddd', fontSize: 14, flex: 1 },
  actions: { gap: 12, marginBottom: 12 },
  primaryButton: { backgroundColor: '#D4AF37', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  secondaryButton: { borderWidth: 1, borderColor: '#3A3A3A', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});