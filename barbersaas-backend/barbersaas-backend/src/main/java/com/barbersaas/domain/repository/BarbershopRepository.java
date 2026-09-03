package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.enums.BarbershopStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BarbershopRepository extends JpaRepository<Barbershop, Long> {
    List<Barbershop> findByStatus(BarbershopStatus status);
    List<Barbershop> findByStatusIn(List<BarbershopStatus> statuses);
    List<Barbershop> findByCityIgnoreCase(String city);
    long countByStatus(BarbershopStatus status);
}