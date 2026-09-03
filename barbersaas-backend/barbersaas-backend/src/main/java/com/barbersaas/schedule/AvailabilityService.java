package com.barbersaas.schedule;

import com.barbersaas.domain.entity.BarberSchedule;
import com.barbersaas.domain.entity.BarberServiceEntity;
import com.barbersaas.domain.entity.ScheduleException;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.repository.AppointmentRepository;
import com.barbersaas.domain.repository.BarberScheduleRepository;
import com.barbersaas.domain.repository.ScheduleExceptionRepository;
import com.barbersaas.domain.repository.ServiceRepository;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.schedule.dto.AvailableSlotResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final BarberScheduleRepository barberScheduleRepository;
    private final ScheduleExceptionRepository scheduleExceptionRepository;
    private final ServiceRepository serviceRepository;
    private final AppointmentRepository appointmentRepository;

    /**
     * Calcula los slots disponibles para un barbero, servicio y fecha dados.
     *
     * Pasos:
     * 1. Determinar la ventana horaria base (horario semanal o excepcion del dia).
     * 2. Generar slots candidatos del tamano de la duracion del servicio.
     * 3. Descartar los que se solapen con citas existentes (no canceladas).
     */
    public List<AvailableSlotResponse> getAvailableSlots(Long barberProfileId, Long serviceId, LocalDate date) {

        BarberServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));

        int durationMinutes = service.getDurationMinutes();

        // Paso 1: ventana horaria base
        TimeWindow window = resolveTimeWindow(barberProfileId, date);
        if (window == null) {
            return List.of(); // dia libre o sin horario configurado
        }

        // Paso 2: generar slots candidatos
        List<AvailableSlotResponse> candidates = generateCandidateSlots(window, durationMinutes);

        // Paso 3: filtrar contra citas existentes
        List<OccupiedRange> occupied = getOccupiedRanges(barberProfileId, date);

        return candidates.stream()
                .filter(slot -> !overlapsAny(slot, occupied))
                .toList();
    }

    /**
     * Determina la ventana horaria [start, end) para el dia solicitado,
     * considerando excepciones. Retorna null si el barbero no trabaja ese dia.
     */
    private TimeWindow resolveTimeWindow(Long barberProfileId, LocalDate date) {

        Optional<ScheduleException> exceptionOpt =
                scheduleExceptionRepository.findByBarberProfileIdAndExceptionDate(barberProfileId, date);

        if (exceptionOpt.isPresent()) {
            ScheduleException exception = exceptionOpt.get();

            if (Boolean.TRUE.equals(exception.getIsDayOff())) {
                return null; // dia libre explicito
            }

            // Horario especial para ese dia especifico
            if (exception.getStartTime() != null && exception.getEndTime() != null) {
                return new TimeWindow(exception.getStartTime(), exception.getEndTime());
            }
        }

        // Sin excepcion (o excepcion sin horario propio): usar horario semanal base
        int dayOfWeek = mapToDayOfWeek(date); // 0=Domingo ... 6=Sabado

        List<BarberSchedule> schedules = barberScheduleRepository
                .findByBarberProfileIdAndDayOfWeekAndIsActiveTrue(barberProfileId, dayOfWeek);

        if (schedules.isEmpty()) {
            return null; // el barbero no trabaja ese dia de la semana
        }

        // Si hubiera multiples bloques el mismo dia (ej. turno mañana y tarde),
        // tomamos el primero por simplicidad en esta fase.
        // TODO Fase futura: soportar multiples bloques por dia.
        BarberSchedule schedule = schedules.get(0);
        return new TimeWindow(schedule.getStartTime(), schedule.getEndTime());
    }

    /**
     * Genera slots de tamano = durationMinutes, desde window.start hasta window.end,
     * sin que el ultimo slot sobrepase window.end.
     */
    private List<AvailableSlotResponse> generateCandidateSlots(TimeWindow window, int durationMinutes) {
        List<AvailableSlotResponse> slots = new ArrayList<>();

        LocalTime current = window.start();
        while (!current.plusMinutes(durationMinutes).isAfter(window.end())) {
            LocalTime slotEnd = current.plusMinutes(durationMinutes);
            slots.add(AvailableSlotResponse.builder()
                    .startTime(current)
                    .endTime(slotEnd)
                    .build());
            current = slotEnd;
        }

        return slots;
    }

    /**
     * Obtiene los rangos ocupados por citas existentes (no canceladas)
     * de ese barbero en esa fecha.
     */
    private List<OccupiedRange> getOccupiedRanges(Long barberProfileId, LocalDate date) {
        return appointmentRepository
                .findByBarberIdAndAppointmentDateAndStatusNot(barberProfileId, date, AppointmentStatus.CANCELLED)
                .stream()
                .map(appt -> new OccupiedRange(appt.getStartTime(), appt.getEndTime()))
                .toList();
    }

    /**
     * Verifica si un slot candidato se solapa con algun rango ocupado.
     * Formula de solapamiento: startA < endB AND startB < endA
     */
    private boolean overlapsAny(AvailableSlotResponse slot, List<OccupiedRange> occupied) {
        return occupied.stream().anyMatch(range ->
                slot.getStartTime().isBefore(range.end()) && range.start().isBefore(slot.getEndTime())
        );
    }

    /**
     * Convierte LocalDate.getDayOfWeek() (1=Lunes...7=Domingo, estandar ISO)
     * al esquema usado en la BD (0=Domingo...6=Sabado).
     */
    private int mapToDayOfWeek(LocalDate date) {
        int isoDayOfWeek = date.getDayOfWeek().getValue(); // 1=Lunes ... 7=Domingo
        return isoDayOfWeek % 7; // 7 (Domingo) -> 0, 1..6 (Lunes..Sabado) -> 1..6
    }

    private record TimeWindow(LocalTime start, LocalTime end) {
    }

    private record OccupiedRange(LocalTime start, LocalTime end) {
    }
}