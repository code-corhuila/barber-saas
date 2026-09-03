import { useCallback, useState } from 'react';
import { ToastType } from '../components/Toast';

/**
 * Estado minimo para controlar <Toast>. Se usa en pantallas con
 * mutaciones (crear/editar) para dar feedback sin Alert.alert.
 */
export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');

  const show = useCallback((msg: string, toastType: ToastType = 'success') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return { visible, message, type, show, hide };
}
