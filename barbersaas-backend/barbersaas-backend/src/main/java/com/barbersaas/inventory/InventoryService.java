package com.barbersaas.inventory;

import com.barbersaas.domain.entity.*;
import com.barbersaas.domain.repository.*;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.inventory.dto.ProductRequest;
import com.barbersaas.inventory.dto.ProductResponse;
import com.barbersaas.inventory.dto.StockMovementRequest;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryProductRepository productRepository;
    private final InventoryMovementRepository movementRepository;
    private final BarbershopRepository barbershopRepository;
    private final UserRepository userRepository;

    public List<ProductResponse> getAll() {
        Long barbershopId = requireTenant();
        return productRepository.findByBarbershopId(barbershopId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Long barbershopId = requireTenant();

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        InventoryProduct product = InventoryProduct.builder()
                .barbershop(barbershop)
                .name(request.getName())
                .description(request.getDescription())
                .unit(request.getUnit())
                .currentStock(request.getCurrentStock())
                .minStockAlert(request.getMinStockAlert())
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        InventoryProduct product = findOwnedOrThrow(id);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setUnit(request.getUnit());
        product.setMinStockAlert(request.getMinStockAlert());
        // NOTA: currentStock NO se edita directamente aqui;
        // los cambios de stock se hacen via registerMovement() para
        // mantener la auditoria completa en inventory_movements.

        return toResponse(productRepository.save(product));
    }

    /**
     * Registra una entrada o salida de inventario y actualiza el stock actual.
     * Valida que no se pueda sacar mas stock del disponible.
     */
    @Transactional
    public ProductResponse registerMovement(Long productId, Long userId, StockMovementRequest request) {
        InventoryProduct product = findOwnedOrThrow(productId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (request.getMovementType() == InventoryMovement.Type.OUT
                && product.getCurrentStock().compareTo(request.getQuantity()) < 0) {
            throw new BadRequestException("No hay suficiente stock para esta salida. Stock actual: "
                    + product.getCurrentStock() + " " + product.getUnit());
        }

        if (request.getMovementType() == InventoryMovement.Type.IN) {
            product.setCurrentStock(product.getCurrentStock().add(request.getQuantity()));
        } else {
            product.setCurrentStock(product.getCurrentStock().subtract(request.getQuantity()));
        }

        product = productRepository.save(product);

        movementRepository.save(InventoryMovement.builder()
                .product(product)
                .movementType(request.getMovementType())
                .quantity(request.getQuantity())
                .reason(request.getReason())
                .createdBy(user)
                .build());

        return toResponse(product);
    }

    private InventoryProduct findOwnedOrThrow(Long id) {
        Long barbershopId = requireTenant();

        InventoryProduct product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        if (!product.getBarbershop().getId().equals(barbershopId)) {
            throw new ForbiddenException("No tiene permisos sobre este producto");
        }

        return product;
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    private ProductResponse toResponse(InventoryProduct product) {
        boolean lowStock = product.getCurrentStock().compareTo(product.getMinStockAlert()) <= 0;

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .unit(product.getUnit())
                .currentStock(product.getCurrentStock())
                .minStockAlert(product.getMinStockAlert())
                .lowStock(lowStock)
                .build();
    }
}