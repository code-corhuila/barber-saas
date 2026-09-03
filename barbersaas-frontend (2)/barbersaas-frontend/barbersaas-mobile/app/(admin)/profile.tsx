import { View, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import { ProfileHeader } from '../../src/components/ProfileHeader';
import { ProfileActionRow } from '../../src/components/ProfileActionRow';

export default function ProfileScreen() {
  const { fullName, email, logout } = useAuthStore();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ProfileHeader
        fallbackName={fullName}
        fallbackEmail={email}
        roleLabel="Administrador"
        roleColor="#D4AF37"
      />

      <ScrollView contentContainerStyle={styles.content}>
        <ProfileActionRow icon="heart" label="Programa de fidelidad" onPress={() => router.push('/(admin)/loyalty-config')} />
        <ProfileActionRow icon="receipt" label="Facturas" onPress={() => router.push('/(admin)/invoices')} />
        <ProfileActionRow icon="cash" label="Finanzas" onPress={() => router.push('/(admin)/finance')} />
        <ProfileActionRow icon="cube" label="Inventario" onPress={() => router.push('/(admin)/inventory')} />
        <ProfileActionRow icon="images" label="Galeria" onPress={() => router.push('/(admin)/gallery')} />
        <ProfileActionRow icon="pricetag" label="Promociones" onPress={() => router.push('/(admin)/promotions')} />

        <View style={styles.spacer} />

        <ProfileActionRow icon="log-out" label="Cerrar sesion" onPress={logout} danger />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingTop: 20 },
  spacer: { height: 12 },
});
