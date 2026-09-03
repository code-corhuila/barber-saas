package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.RewardCoupon;
import com.barbersaas.domain.enums.CouponStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RewardCouponRepository extends JpaRepository<RewardCoupon, Long> {

    /**
     * Busca el cupon activo (si existe) de un cliente en una barberia.
     * Se usa al crear una cita para aplicar el descuento automatico.
     */
    Optional<RewardCoupon> findFirstByClientIdAndBarbershopIdAndStatus(
            Long clientId, Long barbershopId, CouponStatus status);

    /**
     * Lista los cupones activos de un cliente en una barberia (normalmente 0 o 1,
     * pero no se restringe a uno solo a nivel de BD por simplicidad).
     */
    List<RewardCoupon> findByClientIdAndBarbershopIdAndStatus(
            Long clientId, Long barbershopId, CouponStatus status);
}