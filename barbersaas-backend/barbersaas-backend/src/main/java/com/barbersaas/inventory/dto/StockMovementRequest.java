package com.barbersaas.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockMovementRequest {

    @NotNull(message = "El tipo de movimiento es obligatorio")
    private com.barbersaas.domain.entity.InventoryMovement.Type movementType; // IN o OUT

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
    private BigDecimal quantity;

    private String reason;
}