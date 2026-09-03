package com.barbersaas.schedule.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleExceptionRequest {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate exceptionDate;

    @NotNull(message = "Debe indicar si es dia libre")
    private Boolean isDayOff;

    // Solo requeridos si isDayOff = false (horario especial ese dia)
    private LocalTime startTime;
    private LocalTime endTime;

    private String reason;
}