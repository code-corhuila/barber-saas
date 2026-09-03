import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { setAlertListener, AlertConfig, AlertButton } from '../utils/alertBridge';

/**
 * Host global de showAlert(). Se monta UNA vez en app/_layout.tsx.
 * Ver src/utils/alertBridge.ts para el porque de su existencia.
 */
export function AlertHost() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    setAlertListener(setConfig);
    return () => setAlertListener(null);
  }, []);

  if (!config) return null;

  const handlePress = (button: AlertButton) => {
    setConfig(null);
    button.onPress?.();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setConfig(null)}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{config.title}</Text>
          {config.message ? <Text style={styles.message}>{config.message}</Text> : null}

          <View style={styles.buttonsRow}>
            {config.buttons.map((button, index) => (
              <Pressable
                key={`${button.text}-${index}`}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.buttonCancel,
                  button.style === 'destructive' && styles.buttonDestructive,
                  button.style !== 'cancel' && button.style !== 'destructive' && styles.buttonDefault,
                ]}
                onPress={() => handlePress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.buttonTextCancel,
                    button.style === 'destructive' && styles.buttonTextDestructive,
                    button.style !== 'cancel' && button.style !== 'destructive' && styles.buttonTextDefault,
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  message: { color: '#aaa', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  buttonsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  button: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonDefault: { backgroundColor: '#D4AF37' },
  buttonCancel: { borderWidth: 1, borderColor: '#2A2A2A' },
  buttonDestructive: { backgroundColor: '#FF6B6B' },
  buttonText: { fontWeight: '700', fontSize: 15 },
  buttonTextDefault: { color: '#121212' },
  buttonTextCancel: { color: '#888' },
  buttonTextDestructive: { color: '#121212' },
});
