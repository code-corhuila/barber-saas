package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.InventoryProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InventoryProductRepository extends JpaRepository<InventoryProduct, Long> {
    List<InventoryProduct> findByBarbershopId(Long barbershopId);
    Optional<InventoryProduct> findByIdAndBarbershopId(Long id, Long barbershopId);

    // Para la alerta de stock bajo en el dashboard de la Fase 7
    List<InventoryProduct> findByBarbershopIdAndCurrentStockLessThanEqual(Long barbershopId, java.math.BigDecimal threshold);
}