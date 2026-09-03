package com.barbersaas.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateReviewRequest {

    @NotNull(message = "La barberia es obligatoria")
    private Long barbershopId;

    private Long barberProfileId; // opcional

    private Long appointmentId; // opcional, recomendado para validar que el cliente si fue atendido

    @NotNull(message = "La calificacion es obligatoria")
    @Min(value = 1, message = "La calificacion minima es 1")
    @Max(value = 5, message = "La calificacion maxima es 5")
    private Integer rating;

    private String comment;
}