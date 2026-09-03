package com.barbersaas.plan;

import com.barbersaas.plan.dto.PlanRequest;
import com.barbersaas.plan.dto.PlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin/plans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")

@Tag(name = "Super Admin - Planes", description = "Gestion de planes de suscripcion")
public class SubscriptionPlanController {

    private final SubscriptionPlanService planService;

    @GetMapping
    @Operation(summary = "Listar todos los planes")
    public ResponseEntity<List<PlanResponse>> getAll() {
        return ResponseEntity.ok(planService.getAll());
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo plan de suscripcion")
    public ResponseEntity<PlanResponse> create(@Valid @RequestBody PlanRequest request) {
        return ResponseEntity.ok(planService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un plan existente")
    public ResponseEntity<PlanResponse> update(@PathVariable Long id, @Valid @RequestBody PlanRequest request) {
        return ResponseEntity.ok(planService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar un plan")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        planService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}