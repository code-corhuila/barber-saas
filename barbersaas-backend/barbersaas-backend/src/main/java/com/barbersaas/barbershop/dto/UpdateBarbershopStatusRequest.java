package com.barbersaas.barbershop.dto;

import com.barbersaas.domain.enums.BarbershopStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateBarbershopStatusRequest {

    @NotNull(message = "El estado es obligatorio")
    private BarbershopStatus status;
}