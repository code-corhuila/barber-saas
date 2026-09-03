package com.barbersaas.plan.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PlanRequest {

    @NotBlank(message = "El nombre del plan es obligatorio")
    private String name;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El precio no puede ser negativo")
    private BigDecimal price;

    @NotNull(message = "El numero maximo de barberos es obligatorio")
    @Min(value = 1, message = "Debe permitir al menos 1 barbero")
    private Integer maxBarbers;

    private String featuresJson;
}