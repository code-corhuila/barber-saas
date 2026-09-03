package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.LoyaltyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, Long> {
    Optional<LoyaltyCard> findByClientIdAndBarbershopId(Long clientId, Long barbershopId);
}  