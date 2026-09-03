package com.barbersaas.promotion;

import com.barbersaas.promotion.dto.PromotionRequest;
import com.barbersaas.promotion.dto.PromotionResponse;
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
@Tag(name = "Promociones", description = "Descuentos y ofertas de la barberia")
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping("/api/public/barbershops/{barbershopId}/promotions")
    @Operation(summary = "Ver promociones activas y vigentes de una barberia (publico)")
    public ResponseEntity<List<PromotionResponse>> getPublicPromotions(@PathVariable Long barbershopId) {
        return ResponseEntity.ok(promotionService.getActiveForBarbershop(barbershopId));
    }

    @GetMapping("/api/admin/promotions")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Listar todas mis promociones (activas, inactivas, vencidas, futuras)")
    public ResponseEntity<List<PromotionResponse>> getMine() {
        return ResponseEntity.ok(promotionService.getMine());
    }

    @PostMapping("/api/admin/promotions")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Crear una promocion")
    public ResponseEntity<PromotionResponse> create(@Valid @RequestBody PromotionRequest request) {
        return ResponseEntity.ok(promotionService.create(request));
    }

    @PutMapping("/api/admin/promotions/{id}")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Editar una promocion")
    public ResponseEntity<PromotionResponse> update(@PathVariable Long id, @Valid @RequestBody PromotionRequest request) {
        return ResponseEntity.ok(promotionService.update(id, request));
    }

    @PatchMapping("/api/admin/promotions/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Activar o desactivar una promocion")
    public ResponseEntity<Void> toggleActive(@PathVariable Long id) {
        promotionService.toggleActive(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/admin/promotions/{id}")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Eliminar una promocion")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        promotionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
