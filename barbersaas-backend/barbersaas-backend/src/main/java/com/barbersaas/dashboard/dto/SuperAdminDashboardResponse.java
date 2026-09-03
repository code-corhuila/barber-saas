package com.barbersaas.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminDashboardResponse {
    private Long totalBarbershops;
    private Long activeBarbershops;
    private Long suspendedBarbershops;
    private Long trialBarbershops;
    private Long totalClients;
    private Long totalAppointments;
    private BigDecimal totalPlatformRevenue; // suma de finance_records INCOME de todas las barberias
    private List<MostActiveBarbershop> mostActiveBarbershops;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MostActiveBarbershop {
        private Long barbershopId;
        private String name;
        private Long totalAppointments;
    }
}