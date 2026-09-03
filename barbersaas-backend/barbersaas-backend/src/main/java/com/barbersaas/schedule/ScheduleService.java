package com.barbersaas.schedule;

import com.barbersaas.domain.entity.BarberProfile;
import com.barbersaas.domain.entity.BarberSchedule;
import com.barbersaas.domain.entity.ScheduleException;
import com.barbersaas.domain.repository.BarberProfileRepository;
import com.barbersaas.domain.repository.BarberScheduleRepository;
import com.barbersaas.domain.repository.ScheduleExceptionRepository;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.schedule.dto.BarberScheduleRequest;
import com.barbersaas.schedule.dto.BarberScheduleResponse;
import com.barbersaas.schedule.dto.ScheduleExceptionRequest;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final BarberProfileRepository barberProfileRepository;
    private final BarberScheduleRepository barberScheduleRepository;
    private final ScheduleExceptionRepository scheduleExceptionRepository;

    public List<BarberScheduleResponse> getSchedule(Long barberProfileId) {
        validateBarberBelongsToTenant(barberProfileId);

        return barberScheduleRepository.findByBarberProfileId(barberProfileId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Reemplaza el horario semanal completo del barbero.
     * Estrategia simple: borra los bloques existentes para los dias
     * enviados y crea los nuevos. Permite al admin "redefinir" el horario
     * de ciertos dias sin afectar los demas.
     */
    @Transactional
    public List<BarberScheduleResponse> setSchedule(Long barberProfileId, BarberScheduleRequest request) {
        BarberProfile barber = validateBarberBelongsToTenant(barberProfileId);

        for (BarberScheduleRequest.DaySchedule day : request.getDays()) {
            barberScheduleRepository.deleteByBarberProfileIdAndDayOfWeek(barberProfileId, day.getDayOfWeek());

            BarberSchedule schedule = BarberSchedule.builder()
                    .barberProfile(barber)
                    .dayOfWeek(day.getDayOfWeek())
                    .startTime(LocalTime.parse(day.getStartTime()))
                    .endTime(LocalTime.parse(day.getEndTime()))
                    .isActive(true)
                    .build();

            barberScheduleRepository.save(schedule);
        }

        return getSchedule(barberProfileId);
    }

    @Transactional
    public void addException(Long barberProfileId, ScheduleExceptionRequest request) {
        BarberProfile barber = validateBarberBelongsToTenant(barberProfileId);

        ScheduleException exception = ScheduleException.builder()
                .barberProfile(barber)
                .exceptionDate(request.getExceptionDate())
                .isDayOff(request.getIsDayOff())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .reason(request.getReason())
                .build();

        scheduleExceptionRepository.save(exception);
    }

    /**
     * Valida que el barbero pertenezca a la barberia del usuario autenticado
     * (ADMIN_BARBERSHOP). Evita que un admin configure horarios de barberos
     * de otra barberia.
     */
    private BarberProfile validateBarberBelongsToTenant(Long barberProfileId) {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }

        BarberProfile barber = barberProfileRepository.findById(barberProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Barbero no encontrado"));

        if (!barber.getBarbershop().getId().equals(barbershopId)) {
            throw new ForbiddenException("No tiene permisos sobre este barbero");
        }

        return barber;
    }

    private BarberScheduleResponse toResponse(BarberSchedule schedule) {
        return BarberScheduleResponse.builder()
                .id(schedule.getId())
                .dayOfWeek(schedule.getDayOfWeek())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .isActive(schedule.getIsActive())
                .build();
    }
}