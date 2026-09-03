import { QueryClient } from '@tanstack/react-query';

/**
 * Instancia unica compartida: se provee en app/_layout.tsx y se limpia
 * desde authStore.logout() (y desde el interceptor 401 de client.ts) para
 * que ningun dato de la sesion anterior quede en cache tras cerrar sesion
 * o expirar el token -- importante en un dispositivo/navegador compartido.
 */
export const queryClient = new QueryClient();
