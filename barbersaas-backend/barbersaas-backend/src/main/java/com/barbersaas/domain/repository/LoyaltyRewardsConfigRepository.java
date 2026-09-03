package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.LoyaltyRewardsConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LoyaltyRewardsConfigRepository extends JpaRepository<LoyaltyRewardsConfig, Long> {
    Optional<LoyaltyRewardsConfig> findByBarbershopIdAndIsActiveTrue(Long barbershopId);
}
