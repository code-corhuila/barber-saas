package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.ClientFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientFavoriteRepository extends JpaRepository<ClientFavorite, Long> {
    List<ClientFavorite> findByClientIdOrderByCreatedAtDesc(Long clientId);
    Optional<ClientFavorite> findByClientIdAndBarbershopId(Long clientId, Long barbershopId);
    boolean existsByClientIdAndBarbershopId(Long clientId, Long barbershopId);
    void deleteByClientIdAndBarbershopId(Long clientId, Long barbershopId);
}