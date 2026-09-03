import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyServices, createService, updateService, toggleServiceActive } from '../../src/api/services';
import { ServiceResponse } from '../../src/types/service';
import { formatCurrency } from '../../src/utils/dates';

export default function ServicesScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceResponse | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['my-services'],
    queryFn: getMyServices,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleServiceActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-services'] }),
  });

  const openCreateModal = () => {
    setEditingService(null);
    setModalVisible(true);
  };

  const openEditModal = (service: ServiceResponse) => {
    setEditingService(service);
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Servicios</Text>
        <Pressable style={styles.addButton} onPress={openCreateModal}>
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </Pressable>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Aun no tienes servicios. Crea el primero.</Text>}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, !item.isActive && styles.cardInactive]} onPress={() => openEditModal(item)}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
              <Text style={styles.cardDuration}>{item.durationMinutes} min</Text>
            </View>

            <View style={styles.cardRight}>
              <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
              <Pressable
                style={[styles.toggleButton, item.isActive ? styles.toggleButtonActive : styles.toggleButtonInactive]}
                onPress={() => toggleMutation.mutate(item.id)}
              >
                <Text style={styles.toggleButtonText}>{item.isActive ? 'Activo' : 'Inactivo'}</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <ServiceFormModal
        visible={modalVisible}
        service={editingService}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

function ServiceFormModal({ visible, service, onClose }: { visible: boolean; service: ServiceResponse | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [duration, setDuration] = useState(service ? String(service.durationMinutes) : '');
  const [price, setPrice] = useState(service ? String(service.price) : '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincroniza el formulario cuando cambia el servicio a editar
  useState(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description ?? '');
      setDuration(String(service.durationMinutes));
      setPrice(String(service.price));
    } else {
      setName('');
      setDescription('');
      setDuration('');
      setPrice('');
    }
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        durationMinutes: Number(duration),
        price: Number(price),
      };
      return service ? updateService(service.id, payload) : createService(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      onClose();
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      if (fieldErrors) {
        setErrorMessage(String(Object.values(fieldErrors)[0]));
      } else {
        setErrorMessage(error.response?.data?.error ?? 'No se pudo guardar el servicio');
      }
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !duration.trim() || !price.trim()) {
      setErrorMessage('Completa nombre, duracion y precio');
      return;
    }
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{service ? 'Editar servicio' : 'Nuevo servicio'}</Text>

          <TextInput style={styles.input} placeholder="Nombre del servicio" placeholderTextColor="#888" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Descripcion (opcional)" placeholderTextColor="#888" value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Duracion en minutos" placeholderTextColor="#888" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
          <TextInput style={styles.input} placeholder="Precio" placeholderTextColor="#888" value={price} onChangeText={setPrice} keyboardType="number-pad" />

          {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Guardar</Text>}
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  addButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addButtonText: { color: '#121212', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' },
  cardInactive: { opacity: 0.5 },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardDescription: { color: '#aaa', fontSize: 12, marginTop: 2 },
  cardDuration: { color: '#888', fontSize: 12, marginTop: 4 },
  cardRight: { alignItems: 'flex-end' },
  cardPrice: { color: '#D4AF37', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  toggleButton: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  toggleButtonActive: { backgroundColor: '#4CAF50' },
  toggleButtonInactive: { backgroundColor: '#3A3A3A' },
  toggleButtonText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#121212', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  modalError: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  submitButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#121212', fontWeight: '700' },
  cancelButton: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelButtonText: { color: '#888' },
});