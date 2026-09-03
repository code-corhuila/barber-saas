export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (config: AlertConfig) => void;

let listener: Listener | null = null;

export function setAlertListener(fn: Listener | null) {
  listener = fn;
}

/**
 * Reemplazo de Alert.alert (misma firma) que SI funciona en el target web.
 * Alert.alert de React Native es un no-op en react-native-web
 * (node_modules/react-native-web/dist/exports/Alert/index.js: `static alert() {}`),
 * lo que dejaba sin disparar cualquier accion u onPress de navegacion metida
 * dentro de un boton de Alert.alert. showAlert la reemplaza usando un modal
 * real, renderizado por <AlertHost /> montado en app/_layout.tsx.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (!listener) {
    console.warn('showAlert: AlertHost no esta montado todavia');
    return;
  }
  listener({ title, message, buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }] });
}
