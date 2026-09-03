package com.barbersaas.inventory;

import com.barbersaas.inventory.dto.ProductRequest;
import com.barbersaas.inventory.dto.ProductResponse;
import com.barbersaas.inventory.dto.StockMovementRequest;
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
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
@Tag(name = "Inventario", description = "Productos y movimientos de stock")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/products")
    @Operation(summary = "Listar productos de mi inventario")
    public ResponseEntity<List<ProductResponse>> getAll() {
        return ResponseEntity.ok(inventoryService.getAll());
    }

    @PostMapping("/products")
    @Operation(summary = "Crear un producto")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(inventoryService.create(request));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Editar un producto (sin afectar stock)")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(inventoryService.update(id, request));
    }

    @PostMapping("/products/{id}/movement")
    @Operation(summary = "Registrar entrada o salida de stock")
    public ResponseEntity<ProductResponse> registerMovement(@PathVariable Long id,
                                                             @Valid @RequestBody StockMovementRequest request) {
        Long userId = TenantContext.getUserId();
        return ResponseEntity.ok(inventoryService.registerMovement(id, userId, request));
    }
}