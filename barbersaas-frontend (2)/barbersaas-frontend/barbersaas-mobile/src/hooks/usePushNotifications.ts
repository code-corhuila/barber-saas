import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerDeviceToken } from '../api/notifications';
import { Platform } from 'react-native';

/**
 * Controla como se muestran las notificaciones cuando la app esta
 * en primer plano (foreground). Sin esto, por defecto algunas
 * notificaciones no se muestran como banner si la app esta abierta.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Hook que, al montarse (normalmente justo despues del login),
 * pide permiso de notificaciones push, obtiene el token FCM nativo
 * del dispositivo, y lo registra en el backend asociado al usuario
 * autenticado.
 *
 * Debe llamarse solo cuando hay sesion activa (despues de setSession),
 * ya que registerDeviceToken requiere un JWT valido.
 *
 * No funciona en Expo Go para FCM nativo -- requiere un development
 * build (EAS Build) ya que usa modulos nativos de notificaciones.
 */
export function usePushNotifications(token: string | null) {
  const registeredForToken = useRef<string | null>(null);

  useEffect(() => {
    // Solo registra si hay sesion activa y no se ha registrado ya
    // para este mismo token (evita repetir la llamada en cada
    // render mientras el usuario sigue logueado).
    if (!token || registeredForToken.current === token) return;

    registerForPushNotifications();
    registeredForToken.current = token;
  }, [token]);
}

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Las notificaciones push requieren un dispositivo fisico, no un simulador.');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones push denegado por el usuario.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    // getDevicePushTokenAsync obtiene el token NATIVO de FCM/APNs
    // (no el "Expo Push Token"), que es lo que el backend necesita
    // para llamar directamente a la API de Firebase Admin.
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const token = tokenResponse.data;

    await registerDeviceToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    console.log('Token de notificaciones registrado correctamente.');
  } catch (error) {
    console.log('No se pudo registrar el token de notificaciones:', error);
  }
}