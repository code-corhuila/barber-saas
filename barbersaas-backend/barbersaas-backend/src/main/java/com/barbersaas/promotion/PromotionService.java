package com.barbersaas.promotion;

import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.Promotion;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.PromotionRepository;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.promotion.dto.PromotionRequest;
import com.barbersaas.promotion.dto.PromotionResponse;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final BarbershopRepository barbershopRepository;

    /** Publico: promociones activas y vigentes hoy, para el cliente en la ficha de la barberia. */
    public List<PromotionResponse> getActiveForBarbershop(Long barbershopId) {
        LocalDate today = LocalDate.now();
        return promotionRepository
                .findByBarbershopIdAndIsActiveTrueAndValidFromLessThanEqualAndValidToGreaterThanEqual(barbershopId, today, today)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** Admin: todas mis promociones (activas, inactivas, vencidas, futuras). */
    public List<PromotionResponse> getMine() {
        Long barbershopId = requireTenant();
        return promotionRepository.findByBarbershopIdOrderByValidFromDesc(barbershopId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PromotionResponse create(PromotionRequest request) {
        Long barbershopId = requireTenant();

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        Promotion promotion = Promotion.builder()
                .barbershop(barbershop)
                .title(request.getTitle())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .isActive(true)
                .build();

        return toResponse(promotionRepository.save(promotion));
    }

    @Transactional
    public PromotionResponse update(Long id, PromotionRequest request) {
        Promotion promotion = findOwnedByTenant(id);

        promotion.setTitle(request.getTitle());
        promotion.setDescription(request.getDescription());
        promotion.setDiscountType(request.getDiscountType());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setValidFrom(request.getValidFrom());
        promotion.setValidTo(request.getValidTo());

        return toResponse(promotionRepository.save(promotion));
    }

    @Transactional
    public void toggleActive(Long id) {
        Promotion promotion = findOwnedByTenant(id);
        promotion.setIsActive(!promotion.getIsActive());
        promotionRepository.save(promotion);
    }

    @Transactional
    public void delete(Long id) {
        Promotion promotion = findOwnedByTenant(id);
        promotionRepository.delete(promotion);
    }

    private Promotion findOwnedByTenant(Long id) {
        Long barbershopId = requireTenant();
        return promotionRepository.findByIdAndBarbershopId(id, barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Promocion no encontrada"));
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    private PromotionResponse toResponse(Promotion promotion) {
        return PromotionResponse.builder()
                .id(promotion.getId())
                .title(promotion.getTitle())
                .description(promotion.getDescription())
                .discountType(promotion.getDiscountType())
                .discountValue(promotion.getDiscountValue())
                .validFrom(promotion.getValidFrom())
                .validTo(promotion.getValidTo())
                .isActive(promotion.getIsActive())
                .build();
    }
}
