package com.barbersaas.notification;

import com.barbersaas.notification.dto.NotificationResponse;
import com.barbersaas.notification.dto.RegisterDeviceTokenRequest;
import com.barbersaas.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Centro de notificaciones y registro de dispositivos")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Listar mis notificaciones")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        Long userId = TenantContext.getUserId();
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Contar notificaciones no leidas")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long userId = TenantContext.getUserId();
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(userId)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marcar una notificacion como leida")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Long userId = TenantContext.getUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/device-token")
    @Operation(summary = "Registrar el token de dispositivo para notificaciones push")
    public ResponseEntity<Void> registerDeviceToken(@Valid @RequestBody RegisterDeviceTokenRequest request) {
        Long userId = TenantContext.getUserId();
        notificationService.registerDeviceToken(userId, request);
        return ResponseEntity.noContent().build();
    }
}