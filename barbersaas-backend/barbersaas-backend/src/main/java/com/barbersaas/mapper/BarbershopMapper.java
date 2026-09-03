package com.barbersaas.mapper;

import com.barbersaas.barbershop.dto.BarbershopResponse;
import com.barbersaas.domain.entity.Barbershop;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BarbershopMapper {

    @Mapping(target = "planId", expression = "java(barbershop.getPlan() != null ? barbershop.getPlan().getId() : null)")
    @Mapping(target = "planName", expression = "java(barbershop.getPlan() != null ? barbershop.getPlan().getName() : null)")
    BarbershopResponse toResponse(Barbershop barbershop);
}