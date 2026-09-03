import { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { grantSticker, redeemReward } from '../../src/api/loyalty';
import { ClientSearchResponse, getClientLoyaltyCard, searchClients } from '../../src/types/loyalty';
import { showAlert } from '../../src/utils/alertBridge';

/**
 * Pantalla de busqueda de clientes para otorgar sellos o redimir
 * recompensas manualmente. Muestra el estado actual de la tarjeta
 * de fidelidad del cliente seleccionado antes de actuar, via
 * GET /api/admin/loyalty/clients/{clientId}.
 */
export default function LoyaltyClientsScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientSearchResponse | null>(null);

  /**
   * Debounce simple: espera 400ms despues de que el usuario deja de
   * escribir antes de disparar la busqueda, evitando una llamada
   * a la API por cada letra tecleada.
   */
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: results, isLoading: searching } = useQuery({
    queryKey: ['loyalty-client-search', debouncedQuery],
    queryFn: () => searchClients(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  if (selectedClient) {
    return <ClientLoyaltyDetail client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Fidelidad - Clientes' }} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o correo..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {debouncedQuery.length < 2 ? (
        <View style={styles.center}>
          <Text style={styles.hintText}>Escribe al menos 2 caracteres para buscar.</Text>
        </View>
      ) : searching ? (
        <View style={styles.center}>
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.clientId)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No se encontraron clientes con citas en tu barberia que coincidan con "{debouncedQuery}".
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.resultCard} onPress={() => setSelectedClient(item)}>
              <Text style={styles.resultName}>{item.fullName}</Text>
              <Text style={styles.resultEmail}>{item.email}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function ClientLoyaltyDetail({ client, onBack }: { client: ClientSearchResponse; onBack: () => void }) {
  const queryClient = useQueryClient();

  const cardQueryKey = ['loyalty-client-card', client.clientId];

  const { data: card, isLoading, error } = useQuery({
    queryKey: cardQueryKey,
    queryFn: () => getClientLoyaltyCard(client.clientId),
  });

  const grantMutation = useMutation({
    mutationFn: () => grantSticker({ clientId: client.clientId }),
    onSuccess: (data) => {
      queryClient.setQueryData(cardQueryKey, data);
      showAlert('Sello otorgado', `${client.fullName} ahora tiene ${data.stickersCount}/${data.stickersRequired} sellos.`);
    },
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo otorgar el sello');
    },
  });

  const redeemMutation = useMutation({
    mutationFn: () => redeemReward(client.clientId),
    onSuccess: (data) => {
      queryClient.setQueryData(cardQueryKey, data);
      showAlert('Recompensa canjeada', `Se redimio la recompensa de ${client.fullName}.`);
    },
    onError: (error: any) => {
      showAlert('Error', error.response?.data?.error ?? 'No se pudo redimir la recompensa');
    },
  });

  const anyPending = grantMutation.isPending || redeemMutation.isPending;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: client.fullName }} />

      <View style={styles.detailContent}>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Volver a busqueda</Text>
        </Pressable>

        <Text style={styles.clientName}>{client.fullName}</Text>
        <Text style={styles.clientEmail}>{client.email}</Text>

        {isLoading ? (
          <ActivityIndicator color="#D4AF37" style={styles.cardLoading} />
        ) : error || !card ? (
          <Text style={styles.errorText}>No se pudo cargar la tarjeta de fidelidad.</Text>
        ) : (
          <View style={styles.cardSummary}>
            <View style={styles.stickerGrid}>
              {Array.from({ length: card.stickersRequired }).map((_, i) => (
                <View key={i} style={[styles.stickerSlot, i < card.stickersCount && styles.stickerSlotFilled]}>
                  {i < card.stickersCount && <Text style={styles.stickerCheck}>✓</Text>}
                </View>
              ))}
            </View>
            <Text style={styles.cardSummaryText}>
              {card.stickersCount} / {card.stickersRequired} sellos
            </Text>
            <Text style={styles.cardSummaryReward}>{card.rewardDescription}</Text>
            {card.totalRewardsRedeemed > 0 && (
              <Text style={styles.redeemedCount}>Recompensas canjeadas: {card.totalRewardsRedeemed}</Text>
            )}
            {card.canRedeem && (
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>¡Puede canjear!</Text>
              </View>
            )}
          </View>
        )}

        <Pressable style={styles.grantButton} onPress={() => grantMutation.mutate()} disabled={anyPending}>
          {grantMutation.isPending ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.grantButtonText}>🎁 Otorgar sello</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.redeemButton, card && !card.canRedeem && styles.redeemButtonDisabled]}
          onPress={() => redeemMutation.mutate()}
          disabled={anyPending || (card ? !card.canRedeem : true)}
        >
          {redeemMutation.isPending ? (
            <ActivityIndicator color="#D4AF37" />
          ) : (
            <Text style={styles.redeemButtonText}>Redimir recompensa</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  searchContainer: { padding: 16 },
  searchInput: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  hintText: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20, fontSize: 13, lineHeight: 20 },
  resultCard: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, marginBottom: 8 },
  resultName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  detailContent: { padding: 16, flex: 1 },
  backLink: { marginBottom: 16 },
  backLinkText: { color: '#D4AF37', fontSize: 13 },
  clientName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  clientEmail: { color: '#888', fontSize: 13, marginTop: 2, marginBottom: 20 },
  cardLoading: { marginVertical: 20 },
  errorText: { color: '#FF6B6B', fontSize: 13, marginVertical: 20, textAlign: 'center' },
  cardSummary: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  stickerSlot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerSlotFilled: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  stickerCheck: { color: '#121212', fontWeight: '700' },
  cardSummaryText: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSummaryReward: { color: '#888', fontSize: 13 },
  redeemedCount: { color: '#666', fontSize: 11, marginTop: 8 },
  readyBadge: { alignSelf: 'flex-start', backgroundColor: '#4CAF50', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  readyBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  grantButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  grantButtonText: { color: '#121212', fontWeight: '700', fontSize: 15 },
  redeemButton: { borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  redeemButtonDisabled: { borderColor: '#3A3A3A' },
  redeemButtonText: { color: '#D4AF37', fontWeight: '700', fontSize: 15 },
});