package com.barbersaas.promotion.dto;

import com.barbersaas.domain.enums.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PromotionRequest {

    @NotBlank(message = "El titulo es obligatorio")
    private String title;

    private String description;

    @NotNull(message = "El tipo de descuento es obligatorio")
    private DiscountType discountType;

    @NotNull(message = "El valor del descuento es obligatorio")
    @DecimalMin(value = "0.01", message = "El valor debe ser mayor a 0")
    private BigDecimal discountValue;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate validFrom;

    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate validTo;
}
