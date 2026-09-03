package com.barbersaas.invoice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplyPromotionRequest {

    @NotNull(message = "La promocion es obligatoria")
    private Long promotionId;
}
