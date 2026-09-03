import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllBarbershops, updateBarbershopStatus } from '../../src/api/superAdmin';
import { BarbershopAdminResponse } from '../../src/types/barbershopAdmin';
import { useRouter } from 'expo-router';
import { showAlert } from '../../src/utils/alertBridge';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
  TRIAL: 'Periodo de prueba',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#4CAF50',
  SUSPENDED: '#FF6B6B',
  TRIAL: '#FFA500',
};

export default function BarbershopsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: barbershops, isLoading, error } = useQuery({
    queryKey: ['all-barbershops'],
    queryFn: getAllBarbershops,
    // Los tabs no se desmontan al cambiar de pestana -- sin esto, volver
    // a esta pantalla despues de crear una barberia mostraba datos viejos.
    refetchOnMount: 'always',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateBarbershopStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-barbershops'] }),
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo actualizar el estado');
    },
  });

  const handleToggleStatus = (barbershop: BarbershopAdminResponse) => {
    const newStatus = barbershop.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = newStatus === 'SUSPENDED' ? 'suspender' : 'reactivar';

    showAlert(
      `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} barberia`,
      `¿Seguro que deseas ${actionLabel} "${barbershop.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: newStatus === 'SUSPENDED' ? 'destructive' : 'default',
          onPress: () => statusMutation.mutate({ id: barbershop.id, status: newStatus }),
        },
      ]
    );
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
        <Text style={styles.errorText}>No se pudieron cargar las barberias.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerrow}>
  <Text style={styles.headerrow}>Barberias</Text>
  <Pressable style={styles.addButton} onPress={() => router.push('/(super-admin)/barbershops/create')}>
    <Text style={styles.addButtonText}>+ Nueva</Text>
  </Pressable>
</View>

      <FlatList
        data={barbershops}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay barberias registradas.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardCity}>{item.city}</Text>
              {item.planName && <Text style={styles.cardPlan}>Plan: {item.planName}</Text>}
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] ?? '#888' }]}>
                <Text style={styles.statusText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              </View>
            </View>

            {item.status !== 'TRIAL' && (
              <Pressable
                style={[styles.actionButton, item.status === 'ACTIVE' ? styles.suspendButton : styles.reactivateButton]}
                onPress={() => handleToggleStatus(item)}
                disabled={statusMutation.isPending}
              >
                <Text style={item.status === 'ACTIVE' ? styles.suspendButtonText : styles.reactivateButtonText}>
                  {item.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  headerrow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  addButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addButtonText: { color: '#121212', fontWeight: '700', fontSize: 13 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardCity: { color: '#aaa', fontSize: 12, marginTop: 2 },
  cardPlan: { color: '#888', fontSize: 12, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  actionButton: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  suspendButton: { borderWidth: 1, borderColor: '#FF6B6B' },
  suspendButtonText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  reactivateButton: { backgroundColor: '#4CAF50' },
  reactivateButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});