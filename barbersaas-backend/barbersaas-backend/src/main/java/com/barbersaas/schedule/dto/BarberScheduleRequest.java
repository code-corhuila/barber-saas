package com.barbersaas.schedule.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BarberScheduleRequest {

    @NotEmpty(message = "Debe especificar al menos un bloque de horario")
    @Valid
    private List<DaySchedule> days;

    @Data
    public static class DaySchedule {
        // 0 = Domingo ... 6 = Sabado
        private Integer dayOfWeek;
        private String startTime; // formato "HH:mm"
        private String endTime;   // formato "HH:mm"
    }
}