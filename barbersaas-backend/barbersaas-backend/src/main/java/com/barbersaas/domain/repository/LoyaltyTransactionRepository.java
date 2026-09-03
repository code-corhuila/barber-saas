package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    List<LoyaltyTransaction> findByLoyaltyCardIdOrderByCreatedAtDesc(Long loyaltyCardId);
}