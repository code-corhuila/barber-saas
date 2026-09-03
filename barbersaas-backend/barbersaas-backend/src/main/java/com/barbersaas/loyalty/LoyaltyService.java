package com.barbersaas.loyalty;

import com.barbersaas.domain.entity.*;
import com.barbersaas.domain.enums.CouponStatus;
import com.barbersaas.domain.repository.*;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.loyalty.dto.*;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyCardRepository loyaltyCardRepository;
    private final LoyaltyRewardsConfigRepository configRepository;
    private final LoyaltyTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final BarbershopRepository barbershopRepository;
    private final AppointmentRepository appointmentRepository;
    private final RewardCouponRepository rewardCouponRepository;


    // =====================================================================
    // CONFIGURACION (ADMIN_BARBERSHOP)
    // =====================================================================

    @Transactional
    public LoyaltyConfigResponse setConfig(LoyaltyConfigRequest request) {
        Long barbershopId = requireTenant();

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        LoyaltyRewardsConfig config = configRepository.findByBarbershopIdAndIsActiveTrue(barbershopId)
                .orElse(LoyaltyRewardsConfig.builder()
                        .barbershop(barbershop)
                        .isActive(true)
                        .build());

        config.setStickersRequired(request.getStickersRequired());
        config.setRewardDescription(request.getRewardDescription());

        config = configRepository.save(config);

        return LoyaltyConfigResponse.builder()
                .id(config.getId())
                .stickersRequired(config.getStickersRequired())
                .rewardDescription(config.getRewardDescription())
                .isActive(config.getIsActive())
                .build();
    }

    public LoyaltyConfigResponse getConfig(Long barbershopId) {
        LoyaltyRewardsConfig config = configRepository.findByBarbershopIdAndIsActiveTrue(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Esta barberia no tiene programa de fidelizacion configurado"));

        return LoyaltyConfigResponse.builder()
                .id(config.getId())
                .stickersRequired(config.getStickersRequired())
                .rewardDescription(config.getRewardDescription())
                .isActive(config.getIsActive())
                .build();
    }

    // =====================================================================
    // OTORGAR STICKER (ADMIN_BARBERSHOP o BARBER)
    // =====================================================================

    /**
     * Otorga un sticker manualmente. Si el cliente no tiene tarjeta de
     * fidelizacion en esta barberia, se crea automaticamente (1ra visita).
     */
    @Transactional
    public LoyaltyCardResponse grantSticker(Long grantedByUserId, GrantStickerRequest request) {
        Long barbershopId = requireTenant();

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        User client = userRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        User grantedBy = userRepository.findById(grantedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        LoyaltyCard card = loyaltyCardRepository.findByClientIdAndBarbershopId(request.getClientId(), barbershopId)
                .orElseGet(() -> loyaltyCardRepository.save(LoyaltyCard.builder()
                        .client(client)
                        .barbershop(barbershop)
                        .stickersCount(0)
                        .totalRewardsRedeemed(0)
                        .build()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));

            if (!appointment.getBarbershop().getId().equals(barbershopId)) {
                throw new ForbiddenException("La cita no pertenece a esta barberia");
            }
        }

        card.setStickersCount(card.getStickersCount() + 1);
        card = loyaltyCardRepository.save(card);

        transactionRepository.save(LoyaltyTransaction.builder()
                .loyaltyCard(card)
                .appointment(appointment)
                .type(LoyaltyTransaction.Type.STICKER_EARNED)
                .grantedBy(grantedBy)
                .build());

        return toResponse(card, barbershopId);
    }

    // =====================================================================
    // CONSULTA Y REDENCION (CLIENT)
    // =====================================================================

    /** El cliente consulta su tarjeta en una barberia especifica. */
    public LoyaltyCardResponse getMyCard(Long clientId, Long barbershopId) {
        LoyaltyCard card = loyaltyCardRepository.findByClientIdAndBarbershopId(clientId, barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("No tiene tarjeta de fidelizacion en esta barberia aun"));

        return toResponse(card, barbershopId);
    }

    /**
     * Redime una recompensa: resta stickers_required del contador
     * (permite acumulacion) e incrementa total_rewards_redeemed.
     * Debe ser ejecutado por ADMIN_BARBERSHOP o BARBER al momento
     * de entregar la recompensa fisica al cliente.
     */
    @Transactional
    public LoyaltyCardResponse redeemReward(Long grantedByUserId, Long clientId) {
        Long barbershopId = requireTenant();

        LoyaltyCard card = loyaltyCardRepository.findByClientIdAndBarbershopId(clientId, barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("El cliente no tiene tarjeta de fidelizacion"));

        LoyaltyRewardsConfig config = configRepository.findByBarbershopIdAndIsActiveTrue(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Esta barberia no tiene programa de fidelizacion configurado"));

        if (card.getStickersCount() < config.getStickersRequired()) {
            throw new BadRequestException("El cliente aun no acumula suficientes stickers para redimir");
        }

        User grantedBy = userRepository.findById(grantedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        card.setStickersCount(card.getStickersCount() - config.getStickersRequired());
        card.setTotalRewardsRedeemed(card.getTotalRewardsRedeemed() + 1);
        card = loyaltyCardRepository.save(card);
        rewardCouponRepository.save(RewardCoupon.builder()
        .client(card.getClient())
        .barbershop(card.getBarbershop())
        .status(CouponStatus.ACTIVE)
        .build());

        transactionRepository.save(LoyaltyTransaction.builder()
                .loyaltyCard(card)
                .type(LoyaltyTransaction.Type.REWARD_REDEEMED)
                .grantedBy(grantedBy)
                .build());

        return toResponse(card, barbershopId);
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    private LoyaltyCardResponse toResponse(LoyaltyCard card, Long barbershopId) {
        Optional<LoyaltyRewardsConfig> configOpt = configRepository.findByBarbershopIdAndIsActiveTrue(barbershopId);

        int required = configOpt.map(LoyaltyRewardsConfig::getStickersRequired).orElse(10);
        String description = configOpt.map(LoyaltyRewardsConfig::getRewardDescription).orElse(null);

        return LoyaltyCardResponse.builder()
                .id(card.getId())
                .clientId(card.getClient().getId())
                .clientName(card.getClient().getFullName())
                .stickersCount(card.getStickersCount())
                .stickersRequired(required)
                .totalRewardsRedeemed(card.getTotalRewardsRedeemed())
                .canRedeem(card.getStickersCount() >= required)
                .rewardDescription(description)
                .build();
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    // Nuevo metodo:
/**
 * Busca clientes de la barberia actual (resuelta via TenantContext)
 * que coincidan parcialmente con el nombre o correo indicado.
 * Usado por ADMIN_BARBERSHOP/BARBER para localizar un cliente
 * y otorgarle un sello o redimir su recompensa.
 */
public List<ClientSearchResponse> searchClients(String query) {
    Long barbershopId = TenantContext.getTenantId();

    return userRepository.searchClientsByBarbershop(barbershopId, query).stream()
            .map(u -> ClientSearchResponse.builder()
                    .clientId(u.getId())
                    .fullName(u.getFullName())
                    .email(u.getEmail())
                    .build())
            .toList();
}

/**
 * Permite a un ADMIN_BARBERSHOP o BARBER consultar la tarjeta de
 * fidelidad de un cliente especifico de su barberia, sin necesitar
 * que el cliente este autenticado.
 *
 * Reutiliza la misma logica de resolucion/creacion de tarjeta que
 * getMyCard, pero el clientId viene del path en lugar de TenantContext.
 */
public LoyaltyCardResponse getClientCard(Long clientId) {
    Long barbershopId = TenantContext.getTenantId();
    return getMyCard(clientId, barbershopId);
}

public CouponStatusResponse getCouponStatus(Long clientId, Long barbershopId) {
    boolean hasActive = !rewardCouponRepository
            .findByClientIdAndBarbershopIdAndStatus(clientId, barbershopId, CouponStatus.ACTIVE)
            .isEmpty();

    return CouponStatusResponse.builder().hasActiveCoupon(hasActive).build();
}

}
