package com.barbersaas.mapper;

import com.barbersaas.domain.entity.SubscriptionPlan;
import com.barbersaas.plan.dto.PlanResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PlanMapper {
    PlanResponse toResponse(SubscriptionPlan plan);
}