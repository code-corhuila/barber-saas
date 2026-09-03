package com.barbersaas.dashboard;

import com.barbersaas.dashboard.dto.SuperAdminDashboardResponse;
import com.barbersaas.domain.enums.BarbershopStatus;
import com.barbersaas.domain.enums.Role;
import com.barbersaas.domain.repository.AppointmentRepository;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.FinanceRecordRepository;
import com.barbersaas.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SuperAdminDashboardService {

    private final BarbershopRepository barbershopRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final FinanceRecordRepository financeRecordRepository;

    public SuperAdminDashboardResponse getDashboard() {

        var mostActive = appointmentRepository.findMostActiveBarbershops().stream()
                .limit(5)
                .map(p -> SuperAdminDashboardResponse.MostActiveBarbershop.builder()
                        .barbershopId(p.getBarbershopId())
                        .name(p.getName())
                        .totalAppointments(p.getTotalAppointments())
                        .build())
                .toList();

        return SuperAdminDashboardResponse.builder()
                .totalBarbershops(barbershopRepository.count())
                .activeBarbershops(barbershopRepository.countByStatus(BarbershopStatus.ACTIVE))
                .suspendedBarbershops(barbershopRepository.countByStatus(BarbershopStatus.SUSPENDED))
                .trialBarbershops(barbershopRepository.countByStatus(BarbershopStatus.TRIAL))
                .totalClients(userRepository.countByRole(Role.CLIENT))
                .totalAppointments(appointmentRepository.count())
                .totalPlatformRevenue(financeRecordRepository.sumAllPlatformIncome())
                .mostActiveBarbershops(mostActive)
                .build();
    }
}