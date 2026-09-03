package com.barbersaas.dashboard;

import com.barbersaas.dashboard.dto.SuperAdminDashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/super-admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Dashboard Super Admin", description = "Metricas globales de la plataforma")
public class SuperAdminDashboardController {

    private final SuperAdminDashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Obtener metricas globales de la plataforma")
    public ResponseEntity<SuperAdminDashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }
}