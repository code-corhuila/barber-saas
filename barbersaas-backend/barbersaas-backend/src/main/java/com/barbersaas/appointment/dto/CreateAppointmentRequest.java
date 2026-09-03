package com.barbersaas.appointment.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateAppointmentRequest {

    @NotNull(message = "El barbero es obligatorio")
    private Long barberId; // barber_profile_id

    @NotNull(message = "El servicio es obligatorio")
    private Long serviceId;

    @NotNull(message = "La fecha es obligatoria")
    @FutureOrPresent(message = "La fecha no puede ser en el pasado")
    private LocalDate appointmentDate;

    @NotNull(message = "La hora de inicio es obligatoria")
    private LocalTime startTime;

    private String notes;
}