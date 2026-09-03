import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBell } from '../../src/components/NotificationBell';

export default function SuperAdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#fff',
        headerRight: () => <NotificationBell />,
        tabBarStyle: { backgroundColor: '#121212', borderTopColor: '#2A2A2A' },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#888',
      }}
      
    >
      <Tabs.Screen name="barbershops/create" options={{ href: null, title: 'Nueva barberia' }} />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Plataforma',
          tabBarIcon: ({ color, size }) => <Ionicons name="globe" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="barbershops"
        options={{
          title: 'Barberias',
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Planes',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}