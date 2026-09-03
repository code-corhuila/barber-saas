package com.barbersaas.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarberStatsResponse {
    private Long appointmentsCompletedThisMonth;
    private Long appointmentsCancelledThisMonth;
    private BigDecimal revenueGeneratedThisMonth;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private Long upcomingAppointmentsCount;
}