import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Image, Modal, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getBarbershopGallery, uploadGalleryImage, deleteGalleryImage } from '../../src/api/gallery';
import { GalleryImageResponse } from '../../src/types/gallery';
import { BASE_URL } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { showAlert } from '../../src/utils/alertBridge';

export default function AdminGalleryScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const barbershopId = useAuthStore((s) => s.barbershopId);
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string; file?: Blob } | null>(null);
  const [caption, setCaption] = useState('');

  const { data: gallery, isLoading } = useQuery({
    queryKey: ['gallery', barbershopId],
    queryFn: () => getBarbershopGallery(barbershopId!),
    enabled: barbershopId !== null,
  });

  const uploadMutation = useMutation({
    mutationFn: () => uploadGalleryImage(pickedPhoto!, caption),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['gallery', barbershopId] });
      setPickedPhoto(null);
      setCaption('');
      toast.show('Foto agregada a la galeria');
    },
    onError: (error: any) => {
      toast.show(error?.response?.data?.error ?? 'No se pudo subir la foto', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery', barbershopId] }),
    onError: () => toast.show('No se pudo eliminar la foto', 'error'),
  });

  const handlePick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.show('Necesitamos permiso para acceder a tus fotos', 'error');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPickedPhoto({ uri: asset.uri, file: (asset as any).file });
      }
    } catch (error) {
      console.error('handlePick failed:', error);
      toast.show('No se pudo abrir el selector de fotos', 'error');
    }
  };

  const handleDelete = (image: GalleryImageResponse) => {
    showAlert('Eliminar foto', '¿Seguro que deseas eliminar esta foto de la galeria?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(image.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Galeria',
          headerRight: () => (
            <Pressable onPress={handlePick} hitSlop={8}>
              <Ionicons name="add-circle" size={26} color="#D4AF37" />
            </Pressable>
          ),
        }}
      />

      {isLoading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={gallery}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={styles.emptyText}>Aun no tienes fotos. Toca + para subir la primera.</Text>}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <Image source={{ uri: `${BASE_URL}${item.imageUrl}` }} style={styles.photo} />
              <Pressable style={styles.deleteBadge} onPress={() => handleDelete(item)}>
                <Ionicons name="trash" size={14} color="#fff" />
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal visible={!!pickedPhoto} transparent animationType="fade" onRequestClose={() => setPickedPhoto(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva foto</Text>
            {pickedPhoto && <Image source={{ uri: pickedPhoto.uri }} style={styles.preview} />}
            <TextInput
              style={styles.captionInput}
              placeholder="Descripcion (opcional)"
              placeholderTextColor="#888"
              value={caption}
              onChangeText={setCaption}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setPickedPhoto(null)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Subir</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  grid: { padding: 8, flexGrow: 1 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  cell: { flex: 1 / 3, aspectRatio: 1, padding: 4 },
  photo: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#1E1E1E' },
  deleteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 16 },
  preview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12, backgroundColor: '#121212' },
  captionInput: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { color: '#888', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: '#121212', fontWeight: '700', fontSize: 15 },
});
