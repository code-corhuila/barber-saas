package com.barbersaas.notification;

import com.barbersaas.domain.entity.DeviceToken;
import com.barbersaas.domain.entity.Notification;
import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.repository.DeviceTokenRepository;
import com.barbersaas.domain.repository.NotificationRepository;
import com.barbersaas.domain.repository.UserRepository;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.notification.dto.NotificationResponse;
import com.barbersaas.notification.dto.RegisterDeviceTokenRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;

    /**
     * Punto de entrada UNICO para crear notificaciones desde cualquier parte
     * del sistema (citas, promociones, etc.).
     *
     * 1. Siempre crea el registro en BD (historial para el centro de notificaciones).
     * 2. Intenta enviar push a TODOS los dispositivos registrados del usuario.
     *
     * Es @Transactional solo para el paso 1; el paso 2 es best-effort y
     * sus fallos no afectan la transaccion (ver comentario en FcmService).
     */
    @Transactional
    public void notify(Long userId, String title, String body, Notification.Type type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .body(body)
                .type(type)
                .isRead(false)
                .build();

        notificationRepository.save(notification);

        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        for (DeviceToken deviceToken : tokens) {
            fcmService.sendToToken(deviceToken.getToken(), title, body);
        }
    }

    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificacion no encontrada"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new com.barbersaas.exception.ForbiddenException("No puede modificar notificaciones de otro usuario");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void registerDeviceToken(Long userId, RegisterDeviceTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // Si el token ya existe (re-registro tras reinstalar la app), actualiza el usuario
        DeviceToken deviceToken = deviceTokenRepository.findByToken(request.getToken())
                .orElse(DeviceToken.builder().token(request.getToken()).build());

        deviceToken.setUser(user);
        deviceToken.setPlatform(request.getPlatform());

        deviceTokenRepository.save(deviceToken);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .body(n.getBody())
                .type(n.getType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}