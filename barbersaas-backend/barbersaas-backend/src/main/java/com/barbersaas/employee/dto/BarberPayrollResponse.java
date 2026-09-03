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
public class BarberPayrollResponse {
    private Long barberProfileId;
    private Long userId;
    private String barberName;
    private long cutsCount;
    private BigDecimal totalRevenue;
    private BigDecimal commissionPercentage;
    private boolean usesDefaultCommission;
    private BigDecimal amountToPay;
}
