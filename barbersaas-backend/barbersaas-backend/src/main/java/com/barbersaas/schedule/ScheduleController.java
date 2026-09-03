package com.barbersaas.schedule;

import com.barbersaas.schedule.dto.AvailableSlotResponse;
import com.barbersaas.schedule.dto.BarberScheduleRequest;
import com.barbersaas.schedule.dto.BarberScheduleResponse;
import com.barbersaas.schedule.dto.ScheduleExceptionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Horarios y Disponibilidad")
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final AvailabilityService availabilityService;

    @GetMapping("/api/admin/barbers/{barberProfileId}/schedule")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Ver el horario semanal de un barbero")
    public ResponseEntity<List<BarberScheduleResponse>> getSchedule(@PathVariable Long barberProfileId) {
        return ResponseEntity.ok(scheduleService.getSchedule(barberProfileId));
    }

    @PutMapping("/api/admin/barbers/{barberProfileId}/schedule")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Configurar el horario semanal de un barbero")
    public ResponseEntity<List<BarberScheduleResponse>> setSchedule(@PathVariable Long barberProfileId,
                                                                      @Valid @RequestBody BarberScheduleRequest request) {
        return ResponseEntity.ok(scheduleService.setSchedule(barberProfileId, request));
    }

    @PostMapping("/api/admin/barbers/{barberProfileId}/schedule/exceptions")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Agregar una excepcion de horario (dia libre o especial)")
    public ResponseEntity<Void> addException(@PathVariable Long barberProfileId,
                                              @Valid @RequestBody ScheduleExceptionRequest request) {
        scheduleService.addException(barberProfileId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/public/availability")
    @Operation(summary = "Consultar slots disponibles de un barbero para una fecha y servicio (publico)")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailability(
            @RequestParam Long barberId,
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return ResponseEntity.ok(availabilityService.getAvailableSlots(barberId, serviceId, date));
    }
}