package com.barbersaas.dashboard.dto;

import com.barbersaas.dashboard.dto.PeakHourProjection;
import com.barbersaas.dashboard.dto.TopBarberProjection;
import com.barbersaas.dashboard.dto.TopServiceProjection;
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
public class BarbershopDashboardResponse {

    // Ventas
    private BigDecimal salesToday;
    private BigDecimal salesThisWeek;
    private BigDecimal salesThisMonth;

    // Clientes
    private Long totalClients;
    private Long newClientsThisMonth;
    private Long recurringClients; // total - nuevos este mes (aprox)

    // Citas
    private Long appointmentsCompleted;
    private Long appointmentsCancelled;
    private Long totalAppointmentsInRange;
    private Double cancellationRate; // porcentaje

    // Top
    private List<TopServiceProjection> topServices;
    private List<TopBarberProjection> topBarbers;
    private List<PeakHourProjection> peakHours;
}