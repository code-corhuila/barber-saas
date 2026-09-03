package com.barbersaas.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarberPublicResponse {
    private Long id; // barber_profile_id
    private String fullName;
    private String profilePhotoUrl;
    private Integer experienceYears;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
}