package com.barbersaas.dashboard;

import com.barbersaas.dashboard.dto.BarbershopDashboardResponse;
import com.barbersaas.domain.entity.FinanceRecord;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.repository.AppointmentRepository;
import com.barbersaas.domain.repository.FinanceRecordRepository;
import com.barbersaas.domain.repository.UserRepository;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

@Service
@RequiredArgsConstructor
public class BarbershopDashboardService {

    private final FinanceRecordRepository financeRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    /**
     * Genera el dashboard completo del admin de barberia para el rango
     * [from, to] (usado para "este mes", "esta semana", etc. segun
     * lo que el frontend solicite para las listas de "top").
     *
     * Las ventas (today/week/month) siempre se calculan respecto a HOY,
     * independientemente del rango solicitado para los "top N".
     */
    public BarbershopDashboardResponse getDashboard(LocalDate from, LocalDate to) {
        Long barbershopId = requireTenant();

        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());

        var salesToday = financeRecordRepository.sumByTypeAndDateRange(
                barbershopId, FinanceRecord.Type.INCOME, today, today);

        var salesThisWeek = financeRecordRepository.sumByTypeAndDateRange(
                barbershopId, FinanceRecord.Type.INCOME, startOfWeek, today);

        var salesThisMonth = financeRecordRepository.sumByTypeAndDateRange(
                barbershopId, FinanceRecord.Type.INCOME, startOfMonth, today);

        long totalClients = userRepository.countDistinctClientsByBarbershopId(barbershopId);
        long newClientsThisMonth = userRepository.countDistinctClientsInRange(barbershopId, startOfMonth, today);
        long recurringClients = Math.max(0, totalClients - newClientsThisMonth);

        long completed = appointmentRepository.countByStatusAndDateRange(
                barbershopId, AppointmentStatus.COMPLETED, from, to);

        long cancelled = appointmentRepository.countByStatusAndDateRange(
                barbershopId, AppointmentStatus.CANCELLED, from, to);

        long totalInRange = appointmentRepository.countByBarbershopIdAndAppointmentDateBetween(
                barbershopId, from, to);

        double cancellationRate = totalInRange == 0 ? 0.0
                : (cancelled * 100.0) / totalInRange;

        return BarbershopDashboardResponse.builder()
                .salesToday(salesToday)
                .salesThisWeek(salesThisWeek)
                .salesThisMonth(salesThisMonth)
                .totalClients(totalClients)
                .newClientsThisMonth(newClientsThisMonth)
                .recurringClients(recurringClients)
                .appointmentsCompleted(completed)
                .appointmentsCancelled(cancelled)
                .totalAppointmentsInRange(totalInRange)
                .cancellationRate(Math.round(cancellationRate * 100.0) / 100.0) // 2 decimales
                .topServices(appointmentRepository.findTopServices(barbershopId, from, to).stream().limit(5).toList())
                .topBarbers(appointmentRepository.findTopBarbers(barbershopId, from, to).stream().limit(5).toList())
                .peakHours(appointmentRepository.findPeakHours(barbershopId, from, to).stream().limit(5).toList())
                .build();
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }
}