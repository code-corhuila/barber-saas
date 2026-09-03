import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { AlertHost } from '../src/components/AlertHost';
import { queryClient } from '../src/api/queryClient';

/** Segmento de ruta (grupo de expo-router) que le corresponde a cada rol. */
const ROLE_HOME_SEGMENT: Record<string, string> = {
  SUPER_ADMIN: '(super-admin)',
  ADMIN_BARBERSHOP: '(admin)',
  BARBER: '(barber)',
  CLIENT: '(client)',
};
const ALL_ROLE_SEGMENTS = Object.values(ROLE_HOME_SEGMENT);

/**
 * Componente que protege rutas segun el estado de autenticacion Y el rol.
 * Se re-evalua cada vez que cambian: isLoading, token, role, o la ruta actual
 * (incluyendo navegacion con el boton "atras" del navegador, que en una SPA
 * no recarga la pagina -- solo cambia la ruta que expo-router observa).
 *
 * Logica:
 * - Mientras se restaura la sesion, no renderiza nada (evita parpadeo).
 * - Sin token y fuera de (auth) -> redirige a welcome. Cubre tanto el primer
 *   ingreso como volver "atras" hacia una pantalla protegida despues de un
 *   logout: el guard se re-evalua con cada cambio de ruta, token incluido.
 * - Con token y dentro de (auth) -> redirige al home de su rol.
 * - Con token pero navegando dentro del grupo de OTRO rol (ej. un CLIENT
 *   escribiendo /(admin)/dashboard en la URL) -> redirige a su propio home.
 * - Mientras cualquiera de los redirects anteriores esta pendiente o en
 *   curso, NO renderiza los hijos -- evita que se vea, aunque sea un
 *   instante, una pantalla protegida a la que ya no se deberia tener acceso.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, role, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, []);

  const inAuthGroup = segments[0] === '(auth)';
  const currentSegment = segments[0] as string | undefined;
  const isInWrongRoleArea =
    !!token &&
    !!role &&
    !!currentSegment &&
    ALL_ROLE_SEGMENTS.includes(currentSegment) &&
    currentSegment !== ROLE_HOME_SEGMENT[role];

  const needsLogin = !isLoading && !token && !inAuthGroup;
  const needsHome = !isLoading && !!token && (inAuthGroup || isInWrongRoleArea);

  useEffect(() => {
    if (needsLogin) {
      router.replace('/(auth)/welcome');
    } else if (needsHome) {
      router.replace(getHomeRouteForRole(role));
    }
  }, [needsLogin, needsHome, role]);

  // Registra el token de notificaciones push solo cuando hay
  // sesion activa -- el hook internamente evita re-registrar
  // en cada render gracias a su propio ref interno.
  usePushNotifications(token);

  if (isLoading || needsLogin || needsHome) {
    return null;
  }

  return <>{children}</>;
}

function getHomeRouteForRole(role: string | null): any {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/(super-admin)/dashboard';
    case 'ADMIN_BARBERSHOP':
      return '/(admin)/dashboard';
    case 'BARBER':
      return '/(barber)/agenda';
    case 'CLIENT':
    default:
      return '/(client)/home';
  }
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: true,
                title: 'Notificaciones',
                headerStyle: { backgroundColor: '#121212' },
                headerTintColor: '#fff',
              }}
            />
          </Stack>
        </AuthGate>
        <AlertHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}