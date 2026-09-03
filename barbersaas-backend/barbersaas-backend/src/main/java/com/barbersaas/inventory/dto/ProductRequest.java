package com.barbersaas.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    private String description;

    @NotBlank(message = "La unidad de medida es obligatoria")
    private String unit;

    @NotNull(message = "El stock inicial es obligatorio")
    @DecimalMin(value = "0.0", message = "El stock no puede ser negativo")
    private BigDecimal currentStock;

    @NotNull(message = "La alerta de stock minimo es obligatoria")
    @DecimalMin(value = "0.0", message = "La alerta de stock no puede ser negativa")
    private BigDecimal minStockAlert;
}