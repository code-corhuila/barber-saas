package com.barbersaas.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String profilePhotoUrl;
    private String role;
    private Long barbershopId;
    private String barbershopName;
    private Boolean isActive;
}
