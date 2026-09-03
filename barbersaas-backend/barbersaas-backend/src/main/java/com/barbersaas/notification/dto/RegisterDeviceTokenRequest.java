package com.barbersaas.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterDeviceTokenRequest {

    @NotBlank(message = "El token es obligatorio")
    private String token;

    @NotBlank(message = "La plataforma es obligatoria")
    private String platform; // "android" o "ios"
}