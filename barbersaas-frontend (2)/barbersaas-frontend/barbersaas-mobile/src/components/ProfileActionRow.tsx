import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

/** Fila de accion tipo "lista de ajustes", usada en las 4 pantallas de perfil. */
export function ProfileActionRow({ icon, label, onPress, danger }: ProfileActionRowProps) {
  return (
    <Pressable style={[styles.row, danger && styles.rowDanger]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? '#FF6B6B' : '#D4AF37'} />
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color="#555" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 12,
  },
  rowDanger: { borderColor: '#3A1E1E', justifyContent: 'center' },
  label: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  labelDanger: { flex: 0, color: '#FF6B6B' },
});
