package com.barbersaas.appointment;

import com.barbersaas.appointment.dto.*;
import com.barbersaas.domain.enums.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@Tag(name = "Citas", description = "Reservas, agenda y gestion de estados de citas")
public class AppointmentController {

    private final AppointmentService appointmentService;

    // =====================================================================
    // CLIENTE
    // =====================================================================

    @PostMapping("/api/client/appointments")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Reservar una nueva cita")
    public ResponseEntity<AppointmentResponse> create(Authentication auth,
                                                        @Valid @RequestBody CreateAppointmentRequest request) {
        Long clientId = currentUserId(auth);
        return ResponseEntity.ok(appointmentService.create(clientId, request));
    }

    @GetMapping("/api/client/appointments")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Ver mi historial de citas")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(Authentication auth) {
        Long clientId = currentUserId(auth);
        return ResponseEntity.ok(appointmentService.getMyAppointmentsAsClient(clientId));
    }

    @PatchMapping("/api/client/appointments/{id}/cancel")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Cancelar una de mis citas")
    public ResponseEntity<AppointmentResponse> cancelAsClient(Authentication auth,
                                                                @PathVariable Long id,
                                                                @RequestBody CancelAppointmentRequest request) {
        Long clientId = currentUserId(auth);
        return ResponseEntity.ok(appointmentService.cancel(id, clientId, Role.CLIENT, request));
    }

    @PatchMapping("/api/client/appointments/{id}/reschedule")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Reprogramar una de mis citas")
    public ResponseEntity<AppointmentResponse> reschedule(Authentication auth,
                                                            @PathVariable Long id,
                                                            @Valid @RequestBody RescheduleAppointmentRequest request) {
        Long clientId = currentUserId(auth);
        return ResponseEntity.ok(appointmentService.reschedule(id, clientId, request));
    }

    // =====================================================================
    // BARBERO
    // =====================================================================


    @GetMapping("/api/barber/appointments")
@PreAuthorize("hasRole('BARBER')")
@Operation(summary = "Ver mi agenda como barbero para una fecha")
public ResponseEntity<List<AppointmentResponse>> getMyAgenda(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    Long userId = com.barbersaas.security.TenantContext.getUserId();
    return ResponseEntity.ok(appointmentService.getMyAgendaAsBarber(userId, date));
}

    @GetMapping("/api/barber/{barberProfileId}/agenda")
    @PreAuthorize("hasAnyRole('BARBER','ADMIN_BARBERSHOP')")
    @Operation(summary = "Ver la agenda de un barbero para una fecha")
    public ResponseEntity<List<AppointmentResponse>> getBarberAgenda(
            @PathVariable Long barberProfileId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getBarberAgenda(barberProfileId, date));
    }

    @PatchMapping("/api/appointments/{id}/start")
    @PreAuthorize("hasAnyRole('BARBER','ADMIN_BARBERSHOP')")
    @Operation(summary = "Marcar cita como en proceso")
    public ResponseEntity<AppointmentResponse> startService(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.startService(id));
    }

    @PatchMapping("/api/appointments/{id}/complete")
    @PreAuthorize("hasAnyRole('BARBER','ADMIN_BARBERSHOP')")
    @Operation(summary = "Marcar cita como completada")
    public ResponseEntity<AppointmentResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.complete(id));
    }

    @PatchMapping("/api/appointments/{id}/no-show")
    @PreAuthorize("hasAnyRole('BARBER','ADMIN_BARBERSHOP')")
    @Operation(summary = "Marcar que el cliente no se presento")
    public ResponseEntity<AppointmentResponse> markNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.markNoShow(id));
    }

    // =====================================================================
    // ADMIN BARBERIA
    // =====================================================================

    @GetMapping("/api/admin/appointments")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Ver todas las citas de mi barberia para una fecha")
    public ResponseEntity<List<AppointmentResponse>> getBarbershopAgenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getBarbershopAgenda(date));
    }

    @PatchMapping("/api/appointments/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Confirmar una cita pendiente")
    public ResponseEntity<AppointmentResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.confirm(id));
    }

    @PatchMapping("/api/admin/appointments/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Cancelar una cita de mi barberia")
    public ResponseEntity<AppointmentResponse> cancelAsAdmin(@PathVariable Long id,
                                                              @RequestBody CancelAppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.cancel(id, null, Role.ADMIN_BARBERSHOP, request));
    }

    // =====================================================================
    // HELPER: extraer userId del JWT
    // =====================================================================

    /**
     * Extrae el userId desde el TenantContext, que ya fue poblado por
     * JwtAuthenticationFilter con el claim "userId" del token.
     */
    private Long currentUserId(Authentication auth) {
        Long userId = com.barbersaas.security.TenantContext.getUserId();
        if (userId == null) {
            throw new IllegalStateException("No se pudo determinar el usuario autenticado");
        }
        return userId;
    }
}