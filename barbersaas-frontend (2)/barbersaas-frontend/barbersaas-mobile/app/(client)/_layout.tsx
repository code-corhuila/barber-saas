import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBell } from '../../src/components/NotificationBell';

export default function ClientTabsLayout() {
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
        name="home"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Mis Citas',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
  name="loyalty"
  options={{
    title: 'Fidelidad',
    tabBarIcon: ({ color, size }) => <Ionicons name="gift" size={size} color={color} />,
  }}
/>
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
        
      />
      {/* Pantallas ocultas de la barra de tabs, accesibles por navegacion */}
      <Tabs.Screen name="barbershop/[id]" options={{ href: null, title: 'Barberia' }} />
      <Tabs.Screen name="booking/[barbershopId]" options={{ href: null, title: 'Reservar' }} />
    </Tabs>
  );
}