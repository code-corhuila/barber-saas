package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.BarberProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BarberProfileRepository extends JpaRepository<BarberProfile, Long> {
    List<BarberProfile> findByBarbershopId(Long barbershopId);
    Optional<BarberProfile> findByUserId(Long userId);
}