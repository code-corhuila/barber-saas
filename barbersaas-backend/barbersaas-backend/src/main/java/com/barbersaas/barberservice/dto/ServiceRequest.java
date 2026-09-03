package com.barbersaas.barberservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServiceRequest {

    @NotBlank(message = "El nombre del servicio es obligatorio")
    private String name;

    private String description;

    @NotNull(message = "La duracion es obligatoria")
    @Min(value = 5, message = "La duracion minima es de 5 minutos")
    private Integer durationMinutes;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
    private BigDecimal price;
}