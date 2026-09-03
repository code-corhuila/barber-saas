package com.barbersaas.barberservice;

import com.barbersaas.barberservice.dto.ServiceRequest;
import com.barbersaas.barberservice.dto.ServiceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Servicios", description = "Catalogo de servicios de la barberia")
public class BarberServiceController {

    private final BarberServiceService serviceService;

    @GetMapping("/api/public/barbershops/{barbershopId}/services")
    @Operation(summary = "Listar servicios activos de una barberia (publico, para clientes)")
    public ResponseEntity<List<ServiceResponse>> getPublicServices(@PathVariable Long barbershopId) {
        return ResponseEntity.ok(serviceService.getPublicServices(barbershopId));
    }

    @GetMapping("/api/admin/services")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Listar todos mis servicios (activos e inactivos)")
    public ResponseEntity<List<ServiceResponse>> getMyServices() {
        return ResponseEntity.ok(serviceService.getMyServices());
    }

    @PostMapping("/api/admin/services")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Crear un nuevo servicio")
    public ResponseEntity<ServiceResponse> create(@Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceService.create(request));
    }

    @PutMapping("/api/admin/services/{id}")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Editar un servicio")
    public ResponseEntity<ServiceResponse> update(@PathVariable Long id, @Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceService.update(id, request));
    }

    @PatchMapping("/api/admin/services/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Activar o desactivar un servicio")
    public ResponseEntity<Void> toggleActive(@PathVariable Long id) {
        serviceService.toggleActive(id);
        return ResponseEntity.noContent().build();
    }
}