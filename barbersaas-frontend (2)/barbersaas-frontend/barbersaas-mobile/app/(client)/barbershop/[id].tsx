import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getBarbershopById, getBarbershopServices, getBarbershopReviews } from '../../../src/api/barbershops';
import { getMyFavorites, addFavorite, removeFavorite } from '../../../src/api/favorites';
import { getBarbershopGallery } from '../../../src/api/gallery';
import { getPublicPromotions } from '../../../src/api/promotions';
import { BASE_URL } from '../../../src/api/client';
import { ReviewModal } from '../../../src/components/ReviewModal';
import { Toast } from '../../../src/components/Toast';
import { useToast } from '../../../src/hooks/useToast';

const DISCOUNT_LABEL: Record<string, (value: number) => string> = {
  PERCENTAGE: (v) => `${v}% de descuento`,
  FIXED_AMOUNT: (v) => `$${v.toLocaleString('es-CO')} de descuento`,
  TWO_FOR_ONE: () => '2x1',
};

export default function BarbershopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const barbershopId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const { data: barbershop, isLoading: loadingShop } = useQuery({
    queryKey: ['barbershop', barbershopId],
    queryFn: () => getBarbershopById(barbershopId),
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['services', barbershopId],
    queryFn: () => getBarbershopServices(barbershopId),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', barbershopId],
    queryFn: () => getBarbershopReviews(barbershopId),
  });

  const { data: gallery } = useQuery({
    queryKey: ['gallery', barbershopId],
    queryFn: () => getBarbershopGallery(barbershopId),
  });

  const { data: promotions } = useQuery({
    queryKey: ['promotions', barbershopId],
    queryFn: () => getPublicPromotions(barbershopId),
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getMyFavorites,
  });
  const isFavorite = favorites?.some((f) => f.barbershopId === barbershopId) ?? false;

  const favoriteMutation = useMutation({
    mutationFn: () => (isFavorite ? removeFavorite(barbershopId) : addFavorite(barbershopId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.show(isFavorite ? 'Quitada de favoritos' : 'Agregada a favoritos');
    },
    onError: () => toast.show('No se pudo actualizar favoritos', 'error'),
  });

  if (loadingShop || loadingServices) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  const activeServices = services?.filter((s) => s.isActive) ?? [];
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleContinue = () => {
    if (!selectedServiceId) return;
    router.push(`/(client)/booking/${barbershopId}?serviceId=${selectedServiceId}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: barbershop?.name ?? 'Barberia' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {barbershop?.logoUrl && (
          <Image source={{ uri: barbershop.logoUrl }} style={styles.banner} />
        )}

        {gallery && gallery.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryStrip} contentContainerStyle={styles.galleryStripContent}>
            {gallery.map((photo) => (
              <Image key={photo.id} source={{ uri: `${BASE_URL}${photo.imageUrl}` }} style={styles.galleryPhoto} />
            ))}
          </ScrollView>
        )}

        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{barbershop?.name}</Text>
            <Pressable onPress={() => favoriteMutation.mutate()} disabled={favoriteMutation.isPending} hitSlop={8}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={26} color="#FF6B6B" />
            </Pressable>
          </View>
          <Text style={styles.address}>{barbershop?.address}, {barbershop?.city}</Text>

          {avgRating && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>⭐ {avgRating}</Text>
              <Text style={styles.ratingCount}>({reviews?.length} reseñas)</Text>
            </View>
          )}

          <Pressable style={styles.reviewButton} onPress={() => setReviewModalVisible(true)}>
            <Text style={styles.reviewButtonText}>⭐ Dejar reseña de esta barberia</Text>
          </Pressable>
        </View>

        {promotions && promotions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🏷️ Promociones activas</Text>
            {promotions.map((promo) => (
              <View key={promo.id} style={styles.promoCard}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoDiscount}>{DISCOUNT_LABEL[promo.discountType](promo.discountValue)}</Text>
                {promo.description && <Text style={styles.promoDescription}>{promo.description}</Text>}
                <Text style={styles.promoValidity}>Válida hasta {promo.validTo}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Servicios</Text>

        {activeServices.length === 0 ? (
          <Text style={styles.emptyText}>Esta barberia aun no tiene servicios publicados.</Text>
        ) : (
          activeServices.map((service) => (
            <Pressable
              key={service.id}
              style={[
                styles.serviceCard,
                selectedServiceId === service.id && styles.serviceCardSelected,
              ]}
              onPress={() => setSelectedServiceId(service.id)}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                )}
                <Text style={styles.serviceDuration}>{service.durationMinutes} min</Text>
              </View>
              <Text style={styles.servicePrice}>
                ${service.price.toLocaleString('es-CO')}
              </Text>
            </Pressable>
          ))
        )}

        {reviews && reviews.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reseñas recientes</Text>
            {reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.clientName}</Text>
                  <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
                </View>
                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.continueButton, !selectedServiceId && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedServiceId}
        >
          <Text style={styles.continueButtonText}>
            {selectedServiceId ? 'Continuar' : 'Selecciona un servicio'}
          </Text>
        </Pressable>
      </View>

      <ReviewModal
        visible={reviewModalVisible}
        barbershopId={barbershopId}
        title={`Deja tu reseña de ${barbershop?.name ?? 'esta barberia'}`}
        onClose={() => setReviewModalVisible(false)}
        onDone={() => toast.show('Gracias por tu reseña')}
      />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  banner: { width: '100%', height: 160 },
  galleryStrip: { marginTop: 10 },
  galleryStripContent: { paddingHorizontal: 16, gap: 8 },
  galleryPhoto: { width: 100, height: 100, borderRadius: 10, marginRight: 8, backgroundColor: '#1E1E1E' },
  infoSection: { padding: 16 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', flex: 1 },
  promoCard: {
    backgroundColor: '#241d0a',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  promoTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  promoDiscount: { color: '#D4AF37', fontSize: 14, fontWeight: '700', marginTop: 2 },
  promoDescription: { color: '#ccc', fontSize: 12, marginTop: 4 },
  promoValidity: { color: '#888', fontSize: 11, marginTop: 6 },
  address: { color: '#aaa', fontSize: 13, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingStars: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  ratingCount: { color: '#888', fontSize: 12, marginLeft: 6 },
  reviewButton: { marginTop: 12, borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  reviewButtonText: { color: '#D4AF37', fontWeight: '600', fontSize: 13 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#888', paddingHorizontal: 16 },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  serviceCardSelected: {
    borderColor: '#D4AF37',
  },
  serviceInfo: { flex: 1, paddingRight: 8 },
  serviceName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  serviceDescription: { color: '#aaa', fontSize: 12, marginTop: 2 },
  serviceDuration: { color: '#888', fontSize: 12, marginTop: 4 },
  servicePrice: { color: '#D4AF37', fontSize: 15, fontWeight: '700' },
  reviewCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewAuthor: { color: '#fff', fontSize: 13, fontWeight: '600' },
  reviewRating: { fontSize: 12 },
  reviewComment: { color: '#aaa', fontSize: 13, marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  continueButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#3A3A3A',
  },
  continueButtonText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 16,
  },
});