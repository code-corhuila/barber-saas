package com.barbersaas.loyalty;

import com.barbersaas.loyalty.dto.*;
import com.barbersaas.security.TenantContext;
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
@Tag(name = "Fidelizacion", description = "Tarjeta digital, stickers y recompensas")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @PutMapping("/api/admin/loyalty/config")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Configurar el programa de fidelizacion de mi barberia")
    public ResponseEntity<LoyaltyConfigResponse> setConfig(@Valid @RequestBody LoyaltyConfigRequest request) {
        return ResponseEntity.ok(loyaltyService.setConfig(request));
    }

    @GetMapping("/api/public/barbershops/{barbershopId}/loyalty/config")
    @Operation(summary = "Ver la configuracion de fidelizacion de una barberia (publico)")
    public ResponseEntity<LoyaltyConfigResponse> getConfig(@PathVariable Long barbershopId) {
        return ResponseEntity.ok(loyaltyService.getConfig(barbershopId));
    }

    @PostMapping("/api/admin/loyalty/grant")
    @PreAuthorize("hasAnyRole('ADMIN_BARBERSHOP','BARBER')")
    @Operation(summary = "Otorgar un sticker de fidelizacion a un cliente")
    public ResponseEntity<LoyaltyCardResponse> grantSticker(@Valid @RequestBody GrantStickerRequest request) {
        Long grantedByUserId = TenantContext.getUserId();
        return ResponseEntity.ok(loyaltyService.grantSticker(grantedByUserId, request));
    }

    @PostMapping("/api/admin/loyalty/redeem/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN_BARBERSHOP','BARBER')")
    @Operation(summary = "Redimir una recompensa para un cliente")
    public ResponseEntity<LoyaltyCardResponse> redeem(@PathVariable Long clientId) {
        Long grantedByUserId = TenantContext.getUserId();
        return ResponseEntity.ok(loyaltyService.redeemReward(grantedByUserId, clientId));
    }

    @GetMapping("/api/client/loyalty/{barbershopId}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Ver mi tarjeta de fidelizacion en una barberia")
    public ResponseEntity<LoyaltyCardResponse> getMyCard(@PathVariable Long barbershopId) {
        Long clientId = TenantContext.getUserId();
        return ResponseEntity.ok(loyaltyService.getMyCard(clientId, barbershopId));
    }

    @GetMapping("/api/admin/loyalty/clients/search")
@PreAuthorize("hasAnyRole('ADMIN_BARBERSHOP','BARBER')")
@Operation(summary = "Buscar clientes de mi barberia por nombre o correo")
public ResponseEntity<List<ClientSearchResponse>> searchClients(@RequestParam String query) {
    return ResponseEntity.ok(loyaltyService.searchClients(query));
}

@GetMapping("/api/admin/loyalty/clients/{clientId}")
@PreAuthorize("hasAnyRole('ADMIN_BARBERSHOP','BARBER')")
@Operation(summary = "Ver la tarjeta de fidelidad de un cliente de mi barberia")
public ResponseEntity<LoyaltyCardResponse> getClientCard(@PathVariable Long clientId) {
    return ResponseEntity.ok(loyaltyService.getClientCard(clientId));
}

@GetMapping("/api/client/loyalty/{barbershopId}/coupon")
@PreAuthorize("hasRole('CLIENT')")
@Operation(summary = "Ver si tengo un cupon de recompensa activo en esta barberia")
public ResponseEntity<CouponStatusResponse> getMyCouponStatus(@PathVariable Long barbershopId) {
    Long clientId = TenantContext.getUserId();
    return ResponseEntity.ok(loyaltyService.getCouponStatus(clientId, barbershopId));
}
}



