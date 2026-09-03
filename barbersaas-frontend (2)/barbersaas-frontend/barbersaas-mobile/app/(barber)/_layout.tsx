import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBell } from '../../src/components/NotificationBell';

export default function BarberTabsLayout() {
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
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Mi Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Mis Metricas',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
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