package com.barbersaas.dashboard;

import com.barbersaas.dashboard.dto.BarberStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/barber/stats")
@RequiredArgsConstructor
@Tag(name = "Barbero - Estadisticas", description = "Metricas personales del barbero autenticado")
public class BarberStatsController {

    private final BarberStatsService barberStatsService;

    @GetMapping
    @PreAuthorize("hasRole('BARBER')")
    @Operation(summary = "Obtener mis estadisticas del mes actual")
    public ResponseEntity<BarberStatsResponse> getMyStats() {
        return ResponseEntity.ok(barberStatsService.getMyStats());
    }
}