package com.barbersaas.plan;

import com.barbersaas.domain.entity.SubscriptionPlan;
import com.barbersaas.domain.repository.SubscriptionPlanRepository;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.mapper.PlanMapper;
import com.barbersaas.plan.dto.PlanRequest;
import com.barbersaas.plan.dto.PlanResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository planRepository;
    private final PlanMapper planMapper;

    public List<PlanResponse> getAll() {
        return planRepository.findAll().stream()
                .map(planMapper::toResponse)
                .toList();
    }

    @Transactional
    public PlanResponse create(PlanRequest request) {
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .name(request.getName())
                .price(request.getPrice())
                .maxBarbers(request.getMaxBarbers())
                .featuresJson(request.getFeaturesJson())
                .isActive(true)
                .build();

        return planMapper.toResponse(planRepository.save(plan));
    }

    @Transactional
    public PlanResponse update(Long id, PlanRequest request) {
        SubscriptionPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan no encontrado"));

        plan.setName(request.getName());
        plan.setPrice(request.getPrice());
        plan.setMaxBarbers(request.getMaxBarbers());
        plan.setFeaturesJson(request.getFeaturesJson());

        return planMapper.toResponse(planRepository.save(plan));
    }

    @Transactional
    public void deactivate(Long id) {
        SubscriptionPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan no encontrado"));

        plan.setIsActive(false);
        planRepository.save(plan);
    }
}