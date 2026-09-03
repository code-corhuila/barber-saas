package com.barbersaas.mapper;

import com.barbersaas.domain.entity.User;
import com.barbersaas.user.dto.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "barbershopId", expression = "java(user.getBarbershop() != null ? user.getBarbershop().getId() : null)")
    @Mapping(target = "barbershopName", expression = "java(user.getBarbershop() != null ? user.getBarbershop().getName() : null)")
    UserResponse toResponse(User user);
}
