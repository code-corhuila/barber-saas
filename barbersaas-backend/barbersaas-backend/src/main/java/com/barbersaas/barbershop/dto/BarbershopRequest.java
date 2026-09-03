package com.barbersaas.barbershop.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BarbershopRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    private String address;

    @NotBlank(message = "La ciudad es obligatoria")
    private String city;

    private Double latitude;
    private Double longitude;

    @NotBlank(message = "El telefono es obligatorio")
    private String phone;

    private String whatsappNumber;
    private String logoUrl;

    @NotNull(message = "El plan es obligatorio")
    private Long planId;

    private String timezone; // opcional, default America/Bogota

    @Min(value = 0, message = "Las horas de cancelacion no pueden ser negativas")
    private Integer cancellationPolicyHours; // opcional, default 2
}