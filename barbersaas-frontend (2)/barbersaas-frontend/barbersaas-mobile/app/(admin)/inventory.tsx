import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, FlatList, RefreshControl, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, createProduct, registerMovement } from '../../src/api/inventory';
import { ProductResponse, MovementType } from '../../src/types/inventory';
import { SwipeableRow } from '../../src/components/SwipeableRow';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

export default function InventoryScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [movementTarget, setMovementTarget] = useState<{ product: ProductResponse; type: MovementType } | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: getProducts,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Inventario',
          headerRight: () => (
            <Pressable onPress={() => setAddModalVisible(true)} hitSlop={8}>
              <Ionicons name="add-circle" size={26} color="#D4AF37" />
            </Pressable>
          ),
        }}
      />

      {isLoading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={products ?? []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          ListEmptyComponent={<Text style={styles.emptyText}>Aun no tienes productos registrados. Toca + para agregar uno.</Text>}
          renderItem={({ item }) => (
            <SwipeableRow
              actions={[
                { label: 'Entrada', icon: 'add', color: '#4CAF50', onPress: () => setMovementTarget({ product: item, type: 'IN' }) },
                { label: 'Salida', icon: 'remove', color: '#FF6B6B', onPress: () => setMovementTarget({ product: item, type: 'OUT' }) },
              ]}
            >
              <View style={[styles.card, item.lowStock && styles.cardLowStock]}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
                  {item.lowStock && (
                    <View style={styles.lowStockTag}>
                      <Ionicons name="alert-circle" size={12} color="#FFA500" />
                      <Text style={styles.lowStockText}>Stock bajo</Text>
                    </View>
                  )}
                </View>
                <View style={styles.stockBlock}>
                  <Text style={[styles.stockValue, item.lowStock && styles.stockValueLow]}>
                    {item.currentStock} {item.unit}
                  </Text>
                  <Text style={styles.stockAlert}>min {item.minStockAlert}</Text>
                </View>
              </View>
            </SwipeableRow>
          )}
        />
      )}

      <AddProductModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onCreated={() => toast.show('Producto agregado')}
      />
      <MovementModal
        target={movementTarget}
        onClose={() => setMovementTarget(null)}
        onDone={() => toast.show('Movimiento registrado')}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

function AddProductModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setName('');
      setUnit('');
      setCurrentStock('');
      setMinStockAlert('');
      onCreated();
      onClose();
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setErrorMessage(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo crear el producto');
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !unit.trim() || !currentStock.trim() || !minStockAlert.trim()) {
      setErrorMessage('Completa todos los campos');
      return;
    }
    setErrorMessage(null);
    mutation.mutate({
      name: name.trim(),
      unit: unit.trim(),
      currentStock: Number(currentStock),
      minStockAlert: Number(minStockAlert),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Nuevo producto</Text>
          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#888" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Unidad (ej. unidad, ml)" placeholderTextColor="#888" value={unit} onChangeText={setUnit} />
          <TextInput style={styles.input} placeholder="Stock inicial" placeholderTextColor="#888" value={currentStock} onChangeText={setCurrentStock} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Alerta de stock minimo" placeholderTextColor="#888" value={minStockAlert} onChangeText={setMinStockAlert} keyboardType="numeric" />
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MovementModal({
  target,
  onClose,
  onDone,
}: {
  target: { product: ProductResponse; type: MovementType } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      registerMovement(target!.product.id, {
        movementType: target!.type,
        quantity: Number(quantity),
        reason: reason.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setQuantity('');
      setReason('');
      onDone();
      onClose();
    },
    onError: (error: any) => {
      const fieldErrors = error.response?.data?.fields;
      setErrorMessage(fieldErrors ? String(Object.values(fieldErrors)[0]) : error.response?.data?.error ?? 'No se pudo registrar el movimiento');
    },
  });

  if (!target) return null;

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {target.type === 'IN' ? 'Entrada de' : 'Salida de'} {target.product.name}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Cantidad"
            placeholderTextColor="#888"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            autoFocus
          />
          <TextInput style={styles.input} placeholder="Motivo (opcional)" placeholderTextColor="#888" value={reason} onChangeText={setReason} />
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, target.type === 'OUT' && styles.saveButtonExpense]}
              onPress={() => {
                if (!quantity.trim() || Number(quantity) <= 0) {
                  setErrorMessage('Ingresa una cantidad valida');
                  return;
                }
                setErrorMessage(null);
                mutation.mutate();
              }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Confirmar</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingBottom: 40 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  cardLowStock: { borderColor: '#FFA500' },
  cardInfo: { flex: 1 },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardDescription: { color: '#888', fontSize: 12, marginTop: 2 },
  lowStockTag: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  lowStockText: { color: '#FFA500', fontSize: 11, fontWeight: '600' },
  stockBlock: { alignItems: 'flex-end' },
  stockValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  stockValueLow: { color: '#FFA500' },
  stockAlert: { color: '#555', fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { color: '#888', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveButtonExpense: { backgroundColor: '#FF9E7A' },
  saveButtonText: { color: '#121212', fontWeight: '700', fontSize: 15 },
});
