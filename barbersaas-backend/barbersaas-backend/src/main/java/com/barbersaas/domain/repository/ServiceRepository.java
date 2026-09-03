package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.BarberServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRepository extends JpaRepository<BarberServiceEntity, Long> {
    List<BarberServiceEntity> findByBarbershopIdAndIsActiveTrue(Long barbershopId);
    List<BarberServiceEntity> findByBarbershopId(Long barbershopId);
    Optional<BarberServiceEntity> findByIdAndBarbershopId(Long id, Long barbershopId);
}