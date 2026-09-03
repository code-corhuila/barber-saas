package com.barbersaas.appointment.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class RescheduleAppointmentRequest {

    @NotNull(message = "La nueva fecha es obligatoria")
    @FutureOrPresent(message = "La fecha no puede ser en el pasado")
    private LocalDate newDate;

    @NotNull(message = "La nueva hora es obligatoria")
    private LocalTime newStartTime;
}