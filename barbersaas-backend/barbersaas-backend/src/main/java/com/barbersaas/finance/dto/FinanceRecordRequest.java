package com.barbersaas.finance.dto;

import com.barbersaas.domain.entity.FinanceRecord;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FinanceRecordRequest {

    @NotNull(message = "El tipo es obligatorio")
    private FinanceRecord.Type type;

    @NotBlank(message = "La categoria es obligatoria")
    private String category;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal amount;

    private String description;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate recordDate;
}