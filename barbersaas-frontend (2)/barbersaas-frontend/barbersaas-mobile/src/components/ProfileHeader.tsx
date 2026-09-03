import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, uploadProfilePhoto, updateProfile } from '../api/user';
import { BASE_URL } from '../api/client';
import { Toast } from './Toast';
import { useToast } from '../hooks/useToast';

interface ProfileHeaderProps {
  fallbackName: string | null;
  fallbackEmail: string | null;
  roleLabel: string;
  roleColor: string;
  subtitle?: string;
}

/**
 * Cabecera de perfil compartida por los 4 roles: foto (tocable para
 * cambiarla), nombre editable, correo y una insignia de rol. La foto y la
 * edicion se guardan de verdad en el backend, no son placeholders.
 */
export function ProfileHeader({ fallbackName, fallbackEmail, roleLabel, roleColor, subtitle }: ProfileHeaderProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editModalVisible, setEditModalVisible] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });

  const uploadMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.show('Foto de perfil actualizada');
    },
    onError: (error: any) => {
      console.error('uploadProfilePhoto failed:', error);
      const message = error?.response?.data?.error ?? error?.message ?? 'No se pudo subir la foto';
      toast.show(message, 'error');
    },
  });

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.show('Necesitamos permiso para acceder a tus fotos', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // En web, expo-image-picker ya entrega el File real en `asset.file`;
        // usarlo evita tener que re-leer la blob: URL con fetch().
        uploadMutation.mutate({ uri: asset.uri, file: (asset as any).file });
      }
    } catch (error) {
      console.error('handlePickPhoto failed:', error);
      toast.show('No se pudo abrir el selector de fotos', 'error');
    }
  };

  const name = me?.fullName ?? fallbackName ?? '';
  const email = me?.email ?? fallbackEmail ?? '';
  const photoUrl = me?.profilePhotoUrl ? `${BASE_URL}${me.profilePhotoUrl}` : null;
  const resolvedSubtitle = subtitle ?? me?.barbershopName ?? undefined;

  return (
    <LinearGradient colors={['#2A2416', '#121212']} style={styles.header}>
      <Pressable style={styles.avatarWrapper} onPress={handlePickPhoto} disabled={uploadMutation.isPending}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.cameraBadge}>
          {uploadMutation.isPending ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <Ionicons name="camera" size={14} color="#121212" />
          )}
        </View>
      </Pressable>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{name}</Text>
        <Pressable onPress={() => setEditModalVisible(true)} hitSlop={8} style={styles.editIcon}>
          <Ionicons name="pencil" size={15} color="#D4AF37" />
        </Pressable>
      </View>
      <Text style={styles.email}>{email}</Text>
      {resolvedSubtitle && <Text style={styles.subtitle}>{resolvedSubtitle}</Text>}

      <View style={[styles.roleBadge, { borderColor: roleColor }]}>
        <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
      </View>

      <EditProfileModal
        visible={editModalVisible}
        currentFullName={name}
        currentPhone={me?.phone ?? ''}
        onClose={() => setEditModalVisible(false)}
        onDone={() => toast.show('Perfil actualizado')}
      />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </LinearGradient>
  );
}

function EditProfileModal({
  visible,
  currentFullName,
  currentPhone,
  onClose,
  onDone,
}: {
  visible: boolean;
  currentFullName: string;
  currentPhone: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(currentFullName);
  const [phone, setPhone] = useState(currentPhone);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateProfile({ fullName: fullName.trim(), phone: phone.trim() || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      onDone();
      onClose();
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setErrorMessage(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo actualizar el perfil');
    },
  });

  const handleOpen = () => {
    setFullName(currentFullName);
    setPhone(currentPhone);
    setErrorMessage(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={handleOpen}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Editar perfil</Text>

          <Text style={styles.modalLabel}>Nombre completo</Text>
          <TextInput style={styles.modalInput} value={fullName} onChangeText={setFullName} placeholder="Nombre completo" placeholderTextColor="#888" />

          <Text style={styles.modalLabel}>Telefono</Text>
          <TextInput style={styles.modalInput} value={phone} onChangeText={setPhone} placeholder="Telefono" placeholderTextColor="#888" keyboardType="phone-pad" />

          {errorMessage && <Text style={styles.modalErrorText}>{errorMessage}</Text>}

          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={styles.modalSaveButton}
              onPress={() => {
                if (!fullName.trim()) {
                  setErrorMessage('El nombre es obligatorio');
                  return;
                }
                setErrorMessage(null);
                mutation.mutate();
              }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.modalSaveButtonText}>Guardar</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  avatarWrapper: { marginBottom: 14 },
  avatarImage: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#D4AF37' },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarInitial: { color: '#D4AF37', fontSize: 36, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 21, fontWeight: '700', textAlign: 'center' },
  editIcon: { padding: 4 },
  email: { color: '#aaa', fontSize: 13, marginTop: 3 },
  subtitle: { color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' },
  roleBadge: { marginTop: 12, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  roleBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalLabel: { color: '#ccc', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  modalInput: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  modalErrorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalCancelButtonText: { color: '#888', fontWeight: '600' },
  modalSaveButton: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalSaveButtonText: { color: '#121212', fontWeight: '700', fontSize: 15 },
});
