package com.barbersaas.loyalty.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GrantStickerRequest {

    @NotNull(message = "El cliente es obligatorio")
    private Long clientId;

    // Opcional: vincular el sticker a una cita especifica (auditoria)
    private Long appointmentId;
}