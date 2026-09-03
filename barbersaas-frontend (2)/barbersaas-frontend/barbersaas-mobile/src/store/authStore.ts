import { create } from 'zustand';
import { AuthResponse, Role } from '../types/auth';
import { queryClient } from '../api/queryClient';

interface AuthState {
  token: string | null;
  userId: number | null;
  fullName: string | null;
  email: string | null;
  role: Role | null;
  barbershopId: number | null;
  isLoading: boolean; // true mientras se restaura la sesion al abrir la app
  setSession: (auth: AuthResponse) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  fullName: null,
  email: null,
  role: null,
  barbershopId: null,
  isLoading: true,

  /**
   * Guarda la sesion tras login/registro exitoso, solo en memoria (store).
   * A proposito NO persiste en AsyncStorage: cada vez que se abre la app
   * o se recarga la pagina debe pedir login de nuevo, sin excepcion --
   * decision explicita, no un descuido.
   */
  setSession: async (auth) => {
    set({
      token: auth.token,
      userId: auth.userId,
      fullName: auth.fullName,
      email: auth.email,
      role: auth.role,
      barbershopId: auth.barbershopId,
      isLoading: false,
    });
  },

  /**
   * Se ejecuta al abrir la app. No hay nada que restaurar (ver nota en
   * setSession) -- solo baja isLoading para que AuthGate pueda evaluar y
   * mandar a login. Se mantiene como funcion async para no tener que
   * tocar el resto del codigo que ya la llama de esa forma.
   */
  restoreSession: async () => {
    set({ isLoading: false });
  },

  logout: async () => {
    // Limpia toda la cache de React Query -- sin esto, un segundo usuario
    // que inicie sesion en el mismo navegador/dispositivo podia ver por un
    // instante datos (citas, notificaciones, etc.) del usuario anterior
    // mientras las nuevas consultas terminaban de cargar.
    queryClient.clear();

    set({
      token: null,
      userId: null,
      fullName: null,
      email: null,
      role: null,
      barbershopId: null,
      isLoading: false,
    });
  },
}));
