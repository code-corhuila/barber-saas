package com.barbersaas.dashboard;

import com.barbersaas.dashboard.dto.BarberStatsResponse;
import com.barbersaas.domain.entity.BarberProfile;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.repository.AppointmentRepository;
import com.barbersaas.domain.repository.BarberProfileRepository;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Calcula metricas personales para el barbero autenticado.
 * Todas las consultas se acotan al barberProfileId del usuario actual
 * (resuelto via TenantContext + BarberProfileRepository), nunca a
 * un ID enviado por el cliente -- esto evita que un barbero consulte
 * estadisticas de otro.
 */
@Service
@RequiredArgsConstructor
public class BarberStatsService {

    private final AppointmentRepository appointmentRepository;
    private final BarberProfileRepository barberProfileRepository;

    public BarberStatsResponse getMyStats() {
        Long userId = TenantContext.getUserId();

        BarberProfile profile = barberProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de barbero no encontrado"));

        Long barberProfileId = profile.getId();

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate today = LocalDate.now();

        Long completed = appointmentRepository.countByBarberIdAndStatusAndAppointmentDateBetween(
        barberProfileId, AppointmentStatus.COMPLETED, startOfMonth, today);

Long cancelled = appointmentRepository.countByBarberIdAndStatusAndAppointmentDateBetween(
        barberProfileId, AppointmentStatus.CANCELLED, startOfMonth, today);

BigDecimal revenue = appointmentRepository.sumPriceByBarberIdAndStatusAndAppointmentDateBetween(
        barberProfileId, AppointmentStatus.COMPLETED, startOfMonth, today);

Long upcoming = appointmentRepository.countByBarberIdAndStatusInAndAppointmentDateGreaterThanEqual(
        barberProfileId,
        java.util.List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
        today);

        return BarberStatsResponse.builder()
                .appointmentsCompletedThisMonth(completed)
                .appointmentsCancelledThisMonth(cancelled)
                .revenueGeneratedThisMonth(revenue != null ? revenue : BigDecimal.ZERO)
                .ratingAvg(profile.getRatingAvg())
                .ratingCount(profile.getRatingCount())
                .upcomingAppointmentsCount(upcoming)
                .build();
    }
}