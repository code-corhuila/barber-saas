package com.barbersaas.favorite;

import com.barbersaas.favorite.dto.FavoriteResponse;
import com.barbersaas.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client/favorites")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
@Tag(name = "Favoritos", description = "Barberias favoritas del cliente")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    @Operation(summary = "Listar mis barberias favoritas")
    public ResponseEntity<List<FavoriteResponse>> getMyFavorites() {
        Long clientId = TenantContext.getUserId();
        return ResponseEntity.ok(favoriteService.getMyFavorites(clientId));
    }

    @PostMapping("/{barbershopId}")
    @Operation(summary = "Agregar una barberia a favoritos")
    public ResponseEntity<Void> addFavorite(@PathVariable Long barbershopId) {
        Long clientId = TenantContext.getUserId();
        favoriteService.addFavorite(clientId, barbershopId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{barbershopId}")
    @Operation(summary = "Quitar una barberia de favoritos")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long barbershopId) {
        Long clientId = TenantContext.getUserId();
        favoriteService.removeFavorite(clientId, barbershopId);
        return ResponseEntity.noContent().build();
    }
}