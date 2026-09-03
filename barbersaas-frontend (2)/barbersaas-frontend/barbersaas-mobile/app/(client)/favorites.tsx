import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getMyFavorites, removeFavorite } from '../../src/api/favorites';
import { FavoriteResponse } from '../../src/types/favorite';

export default function FavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: getMyFavorites,
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Favoritos</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.barbershopId)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="heart-outline" size={40} color="#555" />
            <Text style={styles.emptyText}>Aun no tienes barberias favoritas.</Text>
          </View>
        }
        renderItem={({ item }: { item: FavoriteResponse }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/(client)/barbershop/${item.barbershopId}`)}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoPlaceholderText}>{item.barbershopName.charAt(0).toUpperCase()}</Text>
              </View>
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.barbershopName}</Text>
              <Text style={styles.cardSubtitle}>{item.city}</Text>
            </View>

            <Pressable onPress={() => removeMutation.mutate(item.barbershopId)} disabled={removeMutation.isPending} hitSlop={8}>
              <Ionicons name="heart" size={24} color="#FF6B6B" />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', padding: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },
  emptyText: { color: '#888', marginTop: 12, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  logo: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  logoPlaceholder: { backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  logoPlaceholderText: { color: '#D4AF37', fontSize: 24, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#D4AF37', fontSize: 13, marginTop: 2 },
});
