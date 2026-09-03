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
public class EmployeeResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private Boolean isActive;
    private Long barberProfileId; // null si role = ADMIN_BARBERSHOP

    /** Solo aplica si role = BARBER. Null = usa el % por defecto de la barberia. */
    private BigDecimal commissionPercentage;
}