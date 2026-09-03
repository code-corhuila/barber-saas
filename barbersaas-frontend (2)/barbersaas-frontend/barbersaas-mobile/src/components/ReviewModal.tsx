import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '../api/reviews';
import { StarRating } from './StarRating';

interface ReviewModalProps {
  visible: boolean;
  barbershopId: number;
  barberProfileId?: number;
  appointmentId?: number;
  title: string;
  onClose: () => void;
  onDone: () => void;
}

/**
 * Formulario de reseña reutilizable: se usa desde la ficha de una
 * barberia (cualquier cliente elige la barberia y deja su reseña) y
 * desde una cita completada (pre-llena barberProfileId/appointmentId).
 */
export function ReviewModal({ visible, barbershopId, barberProfileId, appointmentId, title, onClose, onDone }: ReviewModalProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createReview({ barbershopId, barberProfileId, appointmentId, rating, comment: comment.trim() || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reviews', barbershopId] });
      setRating(5);
      setComment('');
      onDone();
      onClose();
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error ?? 'No se pudo enviar la reseña');
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <StarRating value={rating} onChange={setRating} />
          <TextInput
            style={styles.commentInput}
            placeholder="Comentario (opcional)"
            placeholderTextColor="#888"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>Enviar</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  commentInput: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: { color: '#FF6B6B', fontSize: 13, marginTop: 8, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { color: '#888', fontWeight: '600' },
  submitButton: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitButtonText: { color: '#121212', fontWeight: '700', fontSize: 15 },
});
