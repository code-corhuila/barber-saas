import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { searchBarbershops } from '../../src/api/barbershops';
import { BarbershopResponse } from '../../src/types/barbershop';

export default function ClientHomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  /**
   * Solicita permiso de ubicacion al montar la pantalla.
   * Si el usuario lo niega, la busqueda funciona igual pero sin
   * ordenar por cercania (backend trata lat/lng ausentes correctamente).
   */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
    })();
  }, []);

  const { data: barbershops, isLoading, error } = useQuery({
    queryKey: ['barbershops', location],
    queryFn: () => searchBarbershops(location ? { lat: location.lat, lng: location.lng } : {}),
    // Espera a que se resuelva el permiso de ubicacion (granted o denied)
    // antes de hacer la primera busqueda, para no buscar dos veces.
    enabled: location !== null || locationDenied,
    // Los tabs no se desmontan al cambiar de pestana -- sin esto, volver
    // a "Buscar" no reflejaba barberias creadas/activadas mientras tanto.
    refetchOnMount: 'always',
  });

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
      <Text style={styles.header}>
        {location ? 'Barberias cerca de ti' : 'Barberias disponibles'}
      </Text>

      <FlatList
        data={barbershops}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay barberias disponibles por ahora.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(client)/barbershop/${item.id}`)}
          >
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoPlaceholderText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.city}</Text>
              {item.address && <Text style={styles.cardAddress}>{item.address}</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  logo: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  logoPlaceholder: { backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  logoPlaceholderText: { color: '#D4AF37', fontSize: 24, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#D4AF37', fontSize: 13, marginTop: 2 },
  cardAddress: { color: '#aaa', fontSize: 12, marginTop: 2 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#FF6B6B', fontSize: 16 },
});