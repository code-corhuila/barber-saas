package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByBarbershopIdOrderByValidFromDesc(Long barbershopId);

    Optional<Promotion> findByIdAndBarbershopId(Long id, Long barbershopId);

    List<Promotion> findByBarbershopIdAndIsActiveTrueAndValidFromLessThanEqualAndValidToGreaterThanEqual(
            Long barbershopId, LocalDate from, LocalDate to);
}
