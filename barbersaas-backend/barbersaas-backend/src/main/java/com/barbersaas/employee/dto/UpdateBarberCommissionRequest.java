package com.barbersaas.employee.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateBarberCommissionRequest {

    /** Null = quitar el % propio y volver a usar el de la barberia por defecto. */
    @DecimalMin(value = "0.0", message = "El porcentaje no puede ser negativo")
    @DecimalMax(value = "100.0", message = "El porcentaje no puede superar 100")
    private BigDecimal commissionPercentage;
}
