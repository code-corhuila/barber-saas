package com.barbersaas.dashboard;

import com.barbersaas.dashboard.dto.BarbershopDashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
@Tag(name = "Dashboard Barberia", description = "Metricas y graficas de mi barberia")
public class BarbershopDashboardController {

    private final BarbershopDashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Obtener metricas del dashboard para un rango de fechas")
    public ResponseEntity<BarbershopDashboardResponse> getDashboard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getDashboard(from, to));
    }
}