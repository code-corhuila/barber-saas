import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyPromotions, createPromotion, updatePromotion, togglePromotionActive, deletePromotion } from '../../src/api/promotions';
import { PromotionResponse, PromotionRequest, DiscountType } from '../../src/types/promotion';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { showAlert } from '../../src/utils/alertBridge';

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Porcentaje (%)',
  FIXED_AMOUNT: 'Monto fijo ($)',
  TWO_FOR_ONE: '2x1',
};

export default function PromotionsScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionResponse | null>(null);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['my-promotions'],
    queryFn: getMyPromotions,
  });

  const toggleMutation = useMutation({
    mutationFn: togglePromotionActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-promotions'] }),
    onError: () => toast.show('No se pudo actualizar el estado', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-promotions'] });
      toast.show('Promocion eliminada');
    },
    onError: () => toast.show('No se pudo eliminar la promocion', 'error'),
  });

  const handleDelete = (promo: PromotionResponse) => {
    showAlert('Eliminar promocion', `¿Seguro que deseas eliminar "${promo.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(promo.id) },
    ]);
  };

  const openCreate = () => {
    setEditingPromotion(null);
    setModalVisible(true);
  };

  const openEdit = (promo: PromotionResponse) => {
    setEditingPromotion(promo);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Promociones</Text>
        <Pressable style={styles.addButton} onPress={openCreate}>
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={promotions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Aun no tienes promociones. Toca "+ Nueva" para crear una.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openEdit(item)}>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>{item.isActive ? 'Activa' : 'Inactiva'}</Text>
                  </View>
                </View>
                <Text style={styles.cardDiscount}>
                  {item.discountType === 'TWO_FOR_ONE'
                    ? '2x1'
                    : item.discountType === 'PERCENTAGE'
                    ? `${item.discountValue}% de descuento`
                    : `$${item.discountValue.toLocaleString('es-CO')} de descuento`}
                </Text>
                <Text style={styles.cardValidity}>{item.validFrom} a {item.validTo}</Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.toggleButton, item.isActive ? styles.toggleButtonOn : styles.toggleButtonOff]}
                  onPress={() => toggleMutation.mutate(item.id)}
                  disabled={toggleMutation.isPending}
                >
                  <Text style={item.isActive ? styles.toggleButtonTextOn : styles.toggleButtonTextOff}>
                    {item.isActive ? 'Desactivar' : 'Activar'}
                  </Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}

      <PromotionFormModal
        visible={modalVisible}
        promotion={editingPromotion}
        onClose={() => setModalVisible(false)}
        onDone={() => toast.show(editingPromotion ? 'Promocion actualizada' : 'Promocion creada')}
      />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

function PromotionFormModal({
  visible,
  promotion,
  onClose,
  onDone,
}: {
  visible: boolean;
  promotion: PromotionResponse | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!promotion;

  const [title, setTitle] = useState(promotion?.title ?? '');
  const [description, setDescription] = useState(promotion?.description ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(promotion?.discountType ?? 'PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(promotion ? String(promotion.discountValue) : '');
  const [validFrom, setValidFrom] = useState(promotion?.validFrom ?? '');
  const [validTo, setValidTo] = useState(promotion?.validTo ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = (p: PromotionResponse | null) => {
    setTitle(p?.title ?? '');
    setDescription(p?.description ?? '');
    setDiscountType(p?.discountType ?? 'PERCENTAGE');
    setDiscountValue(p ? String(p.discountValue) : '');
    setValidFrom(p?.validFrom ?? '');
    setValidTo(p?.validTo ?? '');
    setErrorMessage(null);
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload: PromotionRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue: Number(discountValue),
        validFrom,
        validTo,
      };
      return isEditing ? updatePromotion(promotion!.id, payload) : createPromotion(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-promotions'] });
      onDone();
      onClose();
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setErrorMessage(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo guardar la promocion');
    },
  });

  const isValidIsoDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + 'T00:00:00');
    return !Number.isNaN(parsed.getTime());
  };

  const handleSubmit = () => {
    if (!title.trim() || !discountValue.trim() || !validFrom.trim() || !validTo.trim()) {
      setErrorMessage('Completa titulo, valor del descuento y las fechas');
      return;
    }
    if (!Number.isFinite(Number(discountValue)) || Number(discountValue) <= 0) {
      setErrorMessage('El valor del descuento debe ser un numero mayor a 0 (usa punto para decimales, sin separador de miles)');
      return;
    }
    if (!isValidIsoDate(validFrom.trim()) || !isValidIsoDate(validTo.trim())) {
      setErrorMessage('Las fechas deben tener el formato AAAA-MM-DD, por ejemplo 2026-09-01');
      return;
    }
    if (validTo.trim() < validFrom.trim()) {
      setErrorMessage('La fecha "Hasta" no puede ser anterior a la fecha "Desde"');
      return;
    }
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => resetForm(promotion)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>{isEditing ? 'Editar promocion' : 'Nueva promocion'}</Text>

            <TextInput style={styles.input} placeholder="Titulo" placeholderTextColor="#888" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Descripcion (opcional)" placeholderTextColor="#888" value={description} onChangeText={setDescription} />

            <View style={styles.typeRow}>
              {(Object.keys(DISCOUNT_TYPE_LABELS) as DiscountType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[styles.typeOption, discountType === type && styles.typeOptionSelected]}
                  onPress={() => setDiscountType(type)}
                >
                  <Text style={[styles.typeOptionText, discountType === type && styles.typeOptionTextSelected]}>
                    {DISCOUNT_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder={discountType === 'PERCENTAGE' ? 'Valor (ej. 20)' : discountType === 'FIXED_AMOUNT' ? 'Valor (ej. 5000)' : 'Valor simbolico (ej. 1)'}
              placeholderTextColor="#888"
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="numeric"
            />

            <TextInput style={styles.input} placeholder="Desde (YYYY-MM-DD)" placeholderTextColor="#888" value={validFrom} onChangeText={setValidFrom} />
            <TextInput style={styles.input} placeholder="Hasta (YYYY-MM-DD)" placeholderTextColor="#888" value={validTo} onChangeText={setValidTo} />

            {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Guardar cambios' : 'Crear promocion'}</Text>}
            </Pressable>

            <Pressable style={styles.cancelButtonModal} onPress={onClose}>
              <Text style={styles.cancelButtonModalText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  addButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addButtonText: { color: '#121212', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardInfo: { marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  statusActive: { backgroundColor: '#1E3A1E', borderWidth: 1, borderColor: '#4CAF50' },
  statusInactive: { backgroundColor: '#2A2A2A' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardDiscount: { color: '#D4AF37', fontSize: 14, fontWeight: '700', marginTop: 4 },
  cardValidity: { color: '#888', fontSize: 12, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8 },
  toggleButton: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  toggleButtonOn: { borderWidth: 1, borderColor: '#FF6B6B' },
  toggleButtonOff: { backgroundColor: '#4CAF50' },
  toggleButtonTextOn: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  toggleButtonTextOff: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteButton: { flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteButtonText: { color: '#888', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#121212', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  typeRow: { gap: 8, marginBottom: 10 },
  typeOption: { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  typeOptionSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  typeOptionText: { color: '#fff', fontSize: 13 },
  typeOptionTextSelected: { color: '#121212', fontWeight: '700' },
  modalError: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  submitButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#121212', fontWeight: '700' },
  cancelButtonModal: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelButtonModalText: { color: '#888' },
});
