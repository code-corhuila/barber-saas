import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert } from '../../src/utils/alertBridge';

/**
 * Punto de entrada del registro: el usuario elige que tipo de cuenta
 * quiere crear. El caso BARBER no lleva a un formulario -- un barbero
 * siempre pertenece a una barberia existente, asi que solo se le
 * explica que debe pedirle a su administrador que lo registre desde
 * el panel de Equipo (Fase 4, ya existente).
 */
export default function RegisterChoiceScreen() {
  const router = useRouter();

  const handleBarberPress = () => {
    showAlert(
      'Eres barbero?',
      'Si trabajas en una barberia que ya usa BarberSaaS, pide a tu administrador que te agregue desde la seccion "Equipo" de su panel. El te dara tus credenciales de acceso.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Crear cuenta' }} />

      <View style={styles.content}>
        <Text style={styles.header}>¿Como quieres usar BarberSaaS?</Text>
        <Text style={styles.subheader}>Elige la opcion que mejor te describe.</Text>

        <Pressable style={styles.optionCard} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.optionEmoji}>🙋</Text>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Soy cliente</Text>
            <Text style={styles.optionDescription}>Quiero reservar citas en barberias cerca de mi.</Text>
          </View>
        </Pressable>

        <Pressable style={styles.optionCard} onPress={() => router.push('/(auth)/register-owner/step1')}>
          <Text style={styles.optionEmoji}>🏪</Text>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Soy dueño de una barberia</Text>
            <Text style={styles.optionDescription}>
              Quiero registrar mi negocio y empezar a gestionar mi equipo y mis citas.
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.optionCard} onPress={handleBarberPress}>
          <Text style={styles.optionEmoji}>✂️</Text>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Soy barbero</Text>
            <Text style={styles.optionDescription}>Trabajo en una barberia que ya usa la plataforma.</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1, padding: 20, paddingTop: 12 },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subheader: { color: '#888', fontSize: 14, marginBottom: 24 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 16,
  },
  optionEmoji: { fontSize: 32 },
  optionTextContainer: { flex: 1 },
  optionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  optionDescription: { color: '#888', fontSize: 12, lineHeight: 17 },
});