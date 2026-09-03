import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMyAppointments } from '../../src/api/appointments';
import { getMyLoyaltyCard, getCouponStatus } from '../../src/api/loyalty';

/**
 * El cliente puede tener tarjeta de fidelidad en multiples barberias
 * (cualquiera donde haya tenido al menos una cita). Esta pantalla:
 * 1. Obtiene el historial de citas del cliente.
 * 2. Extrae los barbershopId unicos.
 * 3. Por cada uno, pide su tarjeta de fidelidad y el estado de su cupon
 *    de recompensa (si tiene uno activo listo para usar).
 */
export default function ClientLoyaltyScreen() {
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: getMyAppointments,
  });

  const barbershopIds = appointments
    ? Array.from(new Set(appointments.map((a) => a.barbershopId)))
    : [];

  if (loadingAppointments) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (barbershopIds.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          Aun no tienes tarjetas de fidelidad. Reserva una cita para empezar a acumular sellos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Mi Fidelidad</Text>

      {barbershopIds.map((barbershopId) => (
        <LoyaltyCardSection key={barbershopId} barbershopId={barbershopId} />
      ))}
    </ScrollView>
  );
}

function LoyaltyCardSection({ barbershopId }: { barbershopId: number }) {
  const { data: card, isLoading, error } = useQuery({
    queryKey: ['loyalty-card', barbershopId],
    queryFn: () => getMyLoyaltyCard(barbershopId),
  });

  const { data: coupon } = useQuery({
    queryKey: ['loyalty-coupon', barbershopId],
    queryFn: () => getCouponStatus(barbershopId),
  });

  if (isLoading) {
    return (
      <View style={styles.cardLoading}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  // Si la barberia nunca configuro su programa de fidelidad,
  // el backend puede devolver un error o un objeto vacio segun
  // la implementacion de LoyaltyService.getMyCard. En ese caso,
  // omitimos esta seccion en lugar de mostrar un error confuso.
  if (error || !card) {
    return null;
  }

  const progress = card.stickersRequired > 0
    ? Math.min(card.stickersCount / card.stickersRequired, 1)
    : 0;

  return (
    <View style={styles.card}>
      {coupon?.hasActiveCoupon && (
        <View style={styles.couponBanner}>
          <Text style={styles.couponBannerTitle}>🎉 Tienes una recompensa lista</Text>
          <Text style={styles.couponBannerText}>
            Tu proxima cita en esta barberia sera GRATIS automaticamente.
          </Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Tarjeta de sellos</Text>
        {card.canRedeem && (
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>¡Lista!</Text>
          </View>
        )}
      </View>

      <View style={styles.stickerGrid}>
        {Array.from({ length: card.stickersRequired }).map((_, i) => (
          <View key={i} style={[styles.stickerSlot, i < card.stickersCount && styles.stickerSlotFilled]}>
            {i < card.stickersCount && <Text style={styles.stickerCheck}>✓</Text>}
          </View>
        ))}
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.progressText}>
        {card.stickersCount} / {card.stickersRequired} sellos
      </Text>

      <View style={styles.rewardBox}>
        <Text style={styles.rewardLabel}>Recompensa</Text>
        <Text style={styles.rewardText}>{card.rewardDescription}</Text>
      </View>

      {card.canRedeem && !coupon?.hasActiveCoupon && (
        <Text style={styles.redeemHint}>
          Muestra esta pantalla en la barberia para canjear tu recompensa.
        </Text>
      )}

      {card.totalRewardsRedeemed > 0 && (
        <Text style={styles.redeemedCount}>
          Recompensas canjeadas: {card.totalRewardsRedeemed}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { padding: 16, paddingBottom: 40 },
  header: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  emptyText: { color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  cardLoading: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 24, marginBottom: 16, alignItems: 'center' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  couponBanner: { backgroundColor: '#1a3a1a', borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#4CAF50' },
  couponBannerTitle: { color: '#4CAF50', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  couponBannerText: { color: '#a5d6a7', fontSize: 12, lineHeight: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  readyBadge: { backgroundColor: '#4CAF50', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  readyBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  stickerSlot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerSlotFilled: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  stickerCheck: { color: '#121212', fontWeight: '700' },
  progressBarTrack: { height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#D4AF37' },
  progressText: { color: '#888', fontSize: 12, marginBottom: 12 },
  rewardBox: { backgroundColor: '#121212', borderRadius: 8, padding: 12 },
  rewardLabel: { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  rewardText: { color: '#fff', fontSize: 14 },
  redeemHint: { color: '#4CAF50', fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  redeemedCount: { color: '#888', fontSize: 11, marginTop: 8 },
});