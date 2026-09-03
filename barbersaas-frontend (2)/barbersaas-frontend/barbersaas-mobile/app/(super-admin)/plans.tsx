import { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlans, createPlan, updatePlan } from '../../src/api/superAdmin';
import { SubscriptionPlanResponse } from '../../src/types/superAdmin';
import { formatCurrency } from '../../src/utils/dates';

export default function PlansScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanResponse | null>(null);

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getPlans,
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    setModalVisible(true);
  };

  const openEditModal = (plan: SubscriptionPlanResponse) => {
    setEditingPlan(plan);
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudieron cargar los planes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planes de suscripcion</Text>
        <Pressable style={styles.addButton} onPress={openCreateModal}>
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </Pressable>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay planes definidos.</Text>}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, !item.isActive && styles.cardInactive]} onPress={() => openEditModal(item)}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDetail}>Hasta {item.maxBarbers} barberos</Text>
              {!item.isActive && <Text style={styles.inactiveLabel}>Inactivo</Text>}
            </View>
            <Text style={styles.cardPrice}>{formatCurrency(item.price)}/mes</Text>
          </Pressable>
        )}
      />

      <PlanFormModal visible={modalVisible} plan={editingPlan} onClose={() => setModalVisible(false)} />
    </View>
  );
}

function PlanFormModal({ visible, plan, onClose }: { visible: boolean; plan: SubscriptionPlanResponse | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [maxBarbers, setMaxBarbers] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Sincroniza el formulario con el plan a editar cada vez que el modal
   * se abre. useEffect (no useState) porque "visible" y "plan" pueden
   * cambiar mientras el componente sigue montado.
   */
  useEffect(() => {
    if (visible) {
      setName(plan?.name ?? '');
      setPrice(plan ? String(plan.price) : '');
      setMaxBarbers(plan ? String(plan.maxBarbers) : '');
      setErrorMessage(null);
    }
  }, [visible, plan]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        price: Number(price),
        maxBarbers: Number(maxBarbers),
      };
      return plan ? updatePlan(plan.id, payload) : createPlan(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      onClose();
    },
    onError: (error: any) => {  
      const fieldErrors = error.response?.data?.fields;
      if (fieldErrors) {
        setErrorMessage(String(Object.values(fieldErrors)[0]));
      } else {
        setErrorMessage(error.response?.data?.error ?? 'No se pudo guardar el plan');
      }
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !price.trim() || !maxBarbers.trim()) {
      setErrorMessage('Completa nombre, precio y maximo de barberos');
      return;
    }
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>{plan ? 'Editar plan' : 'Nuevo plan'}</Text>

            <TextInput style={styles.input} placeholder="Nombre del plan" placeholderTextColor="#888" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Precio mensual" placeholderTextColor="#888" value={price} onChangeText={setPrice} keyboardType="number-pad" />
            <TextInput style={styles.input} placeholder="Maximo de barberos" placeholderTextColor="#888" value={maxBarbers} onChangeText={setMaxBarbers} keyboardType="number-pad" />

            {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Guardar</Text>}
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  addButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addButtonText: { color: '#121212', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardInactive: { opacity: 0.5 },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardDetail: { color: '#888', fontSize: 12, marginTop: 4 },
  inactiveLabel: { color: '#FF6B6B', fontSize: 11, marginTop: 4, fontWeight: '600' },
  cardPrice: { color: '#D4AF37', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#121212', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  modalError: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  submitButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#121212', fontWeight: '700' },
  cancelButton: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelButtonText: { color: '#888' },
});