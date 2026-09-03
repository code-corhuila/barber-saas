import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoiceDetail, addInvoiceProduct, applyInvoicePromotion, removeInvoicePromotion } from '../api/invoices';
import { getMyPromotions } from '../api/promotions';
import { getProducts } from '../api/inventory';
import { getTodayString, formatCurrency } from '../utils/dates';
import { showAlert } from '../utils/alertBridge';
import { useToast } from '../hooks/useToast';
import { downloadInvoicePdf } from '../utils/invoicePdf';

/**
 * Detalle de factura de una cita completada: servicio + productos vendidos +
 * promocion aplicada + total. Se usa tanto desde la lista de Facturas como
 * desde la Agenda del admin justo despues de marcar un servicio como hecho,
 * para que pueda registrar productos/promocion en el momento.
 */
export function InvoiceDetailModal({
  appointmentId,
  onClose,
  toast,
}: {
  appointmentId: number | null;
  onClose: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const queryClient = useQueryClient();
  const [addingProduct, setAddingProduct] = useState(false);
  const [pickingPromotion, setPickingPromotion] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['invoice-detail', appointmentId],
    queryFn: () => getInvoiceDetail(appointmentId!),
    enabled: !!appointmentId,
  });

  const refreshDetail = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice-detail', appointmentId] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const removePromoMutation = useMutation({
    mutationFn: () => removeInvoicePromotion(appointmentId!),
    onSuccess: () => {
      refreshDetail();
      toast.show('Promocion quitada');
    },
    onError: () => toast.show('No se pudo quitar la promocion', 'error'),
  });

  const handleRemovePromotion = () => {
    showAlert('Quitar promocion', '¿Seguro que deseas quitar la promocion aplicada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => removePromoMutation.mutate() },
    ]);
  };

  const handleDownloadPdf = async () => {
    if (!detail) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(detail);
    } catch (err) {
      toast.show('No se pudo generar el PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={!!appointmentId} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Factura #{appointmentId}</Text>

            {isLoading || !detail ? (
              <ActivityIndicator color="#D4AF37" style={{ marginVertical: 30 }} />
            ) : (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailHeaderShop}>{detail.barbershopName}</Text>
                  <Text style={styles.detailHeaderText}>{detail.appointmentDate} · {detail.startTime.slice(0, 5)}</Text>
                  <Text style={styles.detailHeaderText}>Barbero: {detail.barberName}</Text>
                  <Text style={styles.detailHeaderText}>Cliente: {detail.clientName}</Text>
                </View>

                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>{detail.serviceName} (servicio)</Text>
                  <Text style={styles.lineValue}>{formatCurrency(detail.servicePrice)}</Text>
                </View>

                {detail.products.map((p) => (
                  <View key={p.id} style={styles.lineRow}>
                    <Text style={styles.lineLabel}>{p.productName} x{p.quantity}</Text>
                    <Text style={styles.lineValue}>{formatCurrency(p.subtotal)}</Text>
                  </View>
                ))}

                <Pressable style={styles.smallActionButton} onPress={() => setAddingProduct(true)}>
                  <Text style={styles.smallActionButtonText}>+ Agregar producto vendido</Text>
                </Pressable>

                {detail.promotionId ? (
                  <View style={styles.promoBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineLabel}>Promocion: {detail.promotionTitle}</Text>
                      <Text style={styles.discountValue}>-{formatCurrency(detail.discountAmount)}</Text>
                    </View>
                    <Pressable style={styles.removePromoButton} onPress={handleRemovePromotion} disabled={removePromoMutation.isPending}>
                      <Text style={styles.removePromoButtonText}>Quitar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.smallActionButton} onPress={() => setPickingPromotion(true)}>
                    <Text style={styles.smallActionButtonText}>+ Aplicar promocion</Text>
                  </Pressable>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(detail.total)}</Text>
                </View>

                <Pressable style={styles.pdfButton} onPress={handleDownloadPdf} disabled={downloading}>
                  {downloading ? (
                    <ActivityIndicator color="#121212" />
                  ) : (
                    <Text style={styles.pdfButtonText}>⬇ Descargar factura en PDF</Text>
                  )}
                </Pressable>
              </>
            )}

            <Pressable style={styles.cancelButtonModal} onPress={onClose}>
              <Text style={styles.cancelButtonModalText}>Cerrar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      {appointmentId && (
        <AddProductModal
          visible={addingProduct}
          appointmentId={appointmentId}
          onClose={() => setAddingProduct(false)}
          onDone={() => { refreshDetail(); toast.show('Producto agregado a la factura'); }}
        />
      )}
      {appointmentId && (
        <PickPromotionModal
          visible={pickingPromotion}
          appointmentId={appointmentId}
          onClose={() => setPickingPromotion(false)}
          onDone={() => { refreshDetail(); toast.show('Promocion aplicada'); }}
        />
      )}
    </Modal>
  );
}

function AddProductModal({
  visible,
  appointmentId,
  onClose,
  onDone,
}: {
  visible: boolean;
  appointmentId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: getProducts, enabled: visible });

  const mutation = useMutation({
    mutationFn: () =>
      addInvoiceProduct(appointmentId, {
        productId: productId!,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      }),
    onSuccess: () => {
      setProductId(null);
      setQuantity('1');
      setUnitPrice('');
      setErrorMessage(null);
      onDone();
      onClose();
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error ?? 'No se pudo agregar el producto');
    },
  });

  const handleSubmit = () => {
    if (!productId) {
      setErrorMessage('Selecciona un producto');
      return;
    }
    if (!quantity.trim() || Number(quantity) <= 0) {
      setErrorMessage('La cantidad debe ser mayor a 0');
      return;
    }
    if (!unitPrice.trim() || Number(unitPrice) < 0) {
      setErrorMessage('Ingresa el precio unitario');
      return;
    }
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Agregar producto vendido</Text>

            {(products ?? []).map((p) => (
              <Pressable
                key={p.id}
                style={[styles.typeOption, productId === p.id && styles.typeOptionSelected]}
                onPress={() => setProductId(p.id)}
              >
                <Text style={[styles.typeOptionText, productId === p.id && styles.typeOptionTextSelected]}>
                  {p.name} (stock: {p.currentStock} {p.unit})
                </Text>
              </Pressable>
            ))}

            <TextInput style={styles.input} placeholder="Cantidad" placeholderTextColor="#888" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Precio unitario" placeholderTextColor="#888" value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" />

            {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Agregar</Text>}
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

function PickPromotionModal({
  visible,
  appointmentId,
  onClose,
  onDone,
}: {
  visible: boolean;
  appointmentId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: promotions } = useQuery({ queryKey: ['my-promotions'], queryFn: getMyPromotions, enabled: visible });

  const today = getTodayString();
  const eligible = (promotions ?? []).filter((p) => p.isActive && p.validFrom <= today && p.validTo >= today);

  const mutation = useMutation({
    mutationFn: (promotionId: number) => applyInvoicePromotion(appointmentId, { promotionId }),
    onSuccess: () => {
      setErrorMessage(null);
      onDone();
      onClose();
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error ?? 'No se pudo aplicar la promocion');
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Aplicar promocion</Text>

            {eligible.length === 0 && <Text style={styles.emptyText}>No hay promociones activas y vigentes hoy.</Text>}

            {eligible.map((p) => (
              <Pressable key={p.id} style={styles.promoCard} onPress={() => mutation.mutate(p.id)} disabled={mutation.isPending}>
                <Text style={styles.promoCardTitle}>{p.title}</Text>
                <Text style={styles.promoCardDiscount}>
                  {p.discountType === 'TWO_FOR_ONE' ? '2x1' : p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `$${p.discountValue.toLocaleString('es-CO')}`}
                </Text>
              </Pressable>
            ))}

            {errorMessage && <Text style={styles.modalError}>{errorMessage}</Text>}

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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  detailHeader: { marginBottom: 14, gap: 2 },
  detailHeaderShop: { color: '#D4AF37', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  detailHeaderText: { color: '#888', fontSize: 13 },
  pdfButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  pdfButtonText: { color: '#121212', fontWeight: '700', fontSize: 14 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  lineLabel: { color: '#fff', fontSize: 14, flex: 1 },
  lineValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  smallActionButton: { borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  smallActionButtonText: { color: '#D4AF37', fontWeight: '600', fontSize: 13 },
  promoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A1E', borderRadius: 8, padding: 12, marginTop: 12 },
  discountValue: { color: '#4CAF50', fontSize: 13, fontWeight: '700', marginTop: 2 },
  removePromoButton: { borderWidth: 1, borderColor: '#FF6B6B', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  removePromoButtonText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  totalLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  totalValue: { color: '#D4AF37', fontSize: 20, fontWeight: '700' },
  input: { backgroundColor: '#121212', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  typeOption: { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  typeOptionSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  typeOptionText: { color: '#fff', fontSize: 13 },
  typeOptionTextSelected: { color: '#121212', fontWeight: '700' },
  modalError: { color: '#FF6B6B', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  submitButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#121212', fontWeight: '700' },
  cancelButtonModal: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelButtonModalText: { color: '#888' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20, paddingHorizontal: 10 },
  promoCard: { backgroundColor: '#121212', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2A2A2A' },
  promoCardTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  promoCardDiscount: { color: '#D4AF37', fontSize: 13, fontWeight: '700', marginTop: 4 },
});
