import { View, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { ProfileHeader } from '../../src/components/ProfileHeader';
import { ProfileActionRow } from '../../src/components/ProfileActionRow';

export default function ProfileScreen() {
  const { fullName, email, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <ProfileHeader
        fallbackName={fullName}
        fallbackEmail={email}
        roleLabel="Barbero"
        roleColor="#2196F3"
      />

      <ScrollView contentContainerStyle={styles.content}>
        <ProfileActionRow icon="log-out" label="Cerrar sesion" onPress={logout} danger />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingTop: 20 },
});
