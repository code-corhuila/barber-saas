package com.barbersaas.notification.dto;

import com.barbersaas.domain.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String title;
    private String body;
    private Notification.Type type;
    private Boolean isRead;
    private LocalDateTime createdAt;
}