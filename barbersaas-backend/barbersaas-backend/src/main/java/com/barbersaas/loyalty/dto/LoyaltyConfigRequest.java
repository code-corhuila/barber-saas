package com.barbersaas.loyalty.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoyaltyConfigRequest {

    @NotNull(message = "El numero de stickers requeridos es obligatorio")
    @Min(value = 1, message = "Debe requerir al menos 1 sticker")
    private Integer stickersRequired;

    @NotBlank(message = "La descripcion de la recompensa es obligatoria")
    private String rewardDescription;
}