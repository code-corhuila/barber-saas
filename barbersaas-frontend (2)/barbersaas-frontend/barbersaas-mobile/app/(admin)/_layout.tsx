import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBell } from '../../src/components/NotificationBell';

export default function AdminTabsLayout() {
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
      <Tabs.Screen name="loyalty-config" options={{ href: null, title: 'Fidelidad' }} />
      <Tabs.Screen name="finance" options={{ href: null, title: 'Finanzas' }} />
      <Tabs.Screen name="inventory" options={{ href: null, title: 'Inventario' }} />
      <Tabs.Screen name="gallery" options={{ href: null, title: 'Galeria' }} />
      <Tabs.Screen name="promotions" options={{ href: null, title: 'Promociones' }} />
      <Tabs.Screen name="invoices" options={{ href: null, title: 'Facturas' }} />
      
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color, size }) => <Ionicons name="cut" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      {/* Oculta de la barra */}
      <Tabs.Screen name="schedule/[barberProfileId]" options={{ href: null, title: 'Horario' }} />
    </Tabs>
  );
}