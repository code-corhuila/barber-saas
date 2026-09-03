package com.barbersaas.barbershop;

import com.barbersaas.barbershop.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestion de barberias por el SUPER_ADMIN: alta de nuevas barberias
 * en la plataforma, asignacion del primer administrador (owner),
 * edicion, cambio de estado y baja.
 *
 * Nota: GET /api/super-admin/barbershops y PATCH .../status ya
 * pueden existir en otro controller (Fase 3/14) -- se agregan aqui
 * los que faltaban: POST de creacion, PUT de edicion, y POST de owner.
 * Si alguna ruta colisiona con un controller existente, eliminar el
 * duplicado de aqui.
 */
@RestController
@RequestMapping("/api/super-admin/barbershops")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Super Admin - Barberias", description = "Alta, edicion y administracion de barberias de la plataforma")
public class SuperAdminBarbershopController {

    private final BarbershopService barbershopService;

    @GetMapping
    @Operation(summary = "Listar todas las barberias")
    public ResponseEntity<List<BarbershopResponse>> getAll() {
        return ResponseEntity.ok(barbershopService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Ver el detalle de una barberia")
    public ResponseEntity<BarbershopResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(barbershopService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Registrar una nueva barberia en la plataforma")
    public ResponseEntity<BarbershopResponse> create(@Valid @RequestBody BarbershopRequest request) {
        return ResponseEntity.ok(barbershopService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar los datos de una barberia")
    public ResponseEntity<BarbershopResponse> update(@PathVariable Long id, @Valid @RequestBody BarbershopRequest request) {
        return ResponseEntity.ok(barbershopService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activar o suspender una barberia")
    public ResponseEntity<BarbershopResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateBarbershopStatusRequest request) {
        return ResponseEntity.ok(barbershopService.updateStatus(id, request));
    }

    @PostMapping("/{id}/owner")
    @Operation(summary = "Crear el administrador (owner) inicial de una barberia")
    public ResponseEntity<EmployeeResponseLite> createOwner(@PathVariable Long id, @Valid @RequestBody CreateBarbershopOwnerRequest request) {
        return ResponseEntity.ok(barbershopService.createOwner(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una barberia (y todos sus datos asociados)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        barbershopService.delete(id);
        return ResponseEntity.noContent().build();
    }
}