import axios from 'axios';

/**
 * Cliente HTTP centralizado. Cambia BASE_URL segun el ambiente:
 * - Desarrollo: tu IP local (NO uses localhost, el emulador/dispositivo
 *   no puede resolverlo). Usa la IP de tu maquina en la red local,
 *   ej. http://192.168.1.50:8080
 * - Produccion: el dominio real del backend desplegado.
 *
 * EXPO_PUBLIC_API_URL permite sobreescribir esto sin tocar codigo (usado por
 * los contenedores Docker); si no esta definida, cae al valor de abajo.
 */
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.80.20:8080'; // IP Wi-Fi actual de esta PC (ipconfig) -- cambia si la red cambia

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de request: adjunta el JWT actual (en memoria, en el store --
 * la sesion no se persiste a proposito, ver authStore.ts) a cada peticion.
 * Import diferido para evitar un ciclo de imports entre client.ts <->
 * authStore.ts (authStore importa queryClient, no client.ts directamente,
 * pero se mantiene el mismo patron diferido que usa el interceptor de abajo).
 */
apiClient.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('../store/authStore');
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptor de response: si el backend responde 401 (token expirado
 * o invalido), cierra la sesion de verdad -- antes solo se borraba
 * AsyncStorage y el store seguia creyendo que habia sesion activa, asi
 * que la app quedaba "pegada" en una pantalla protegida rota (llamadas
 * fallando en silencio) sin volver nunca al login. Import diferido para
 * evitar un ciclo de imports entre client.ts <-> authStore.ts.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { useAuthStore } = await import('../store/authStore');
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);