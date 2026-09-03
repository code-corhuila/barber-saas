package com.barbersaas.appointment;

import com.barbersaas.appointment.dto.*;
import com.barbersaas.domain.entity.*;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.enums.CouponStatus;
import com.barbersaas.domain.enums.Role;
import com.barbersaas.domain.repository.*;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.notification.NotificationService;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;



@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final BarberProfileRepository barberProfileRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final BarbershopRepository barbershopRepository;
    private final NotificationService notificationService;
    private final RewardCouponRepository rewardCouponRepository;
    private final FinanceRecordRepository financeRecordRepository;

    // =====================================================================
    // CREAR CITA (CLIENT)
    // =====================================================================

    /**
     * Crea una cita para el cliente autenticado.
     *
     * Usa PESSIMISTIC_WRITE sobre las citas del barbero/fecha para evitar
     * la condicion de carrera de doble-reserva (ver explicacion teorica
     * de la Fase 5). Toda la operacion ocurre en una sola transaccion.
     */
    @Transactional
    public AppointmentResponse create(Long clientId, CreateAppointmentRequest request) {

        BarberProfile barber = barberProfileRepository.findById(request.getBarberId())
                .orElseThrow(() -> new ResourceNotFoundException("Barbero no encontrado"));

        BarberServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));

        // Regla de negocio: el servicio debe pertenecer a la misma barberia que el barbero
        if (!service.getBarbershop().getId().equals(barber.getBarbershop().getId())) {
            throw new BadRequestException("El servicio no pertenece a la barberia de este barbero");
        }

        if (!Boolean.TRUE.equals(service.getIsActive())) {
            throw new BadRequestException("El servicio seleccionado no esta disponible");
        }

        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        // No permitir reservar en el pasado si la fecha es hoy
        if (request.getAppointmentDate().isEqual(LocalDate.now()) && startTime.isBefore(LocalTime.now())) {
            throw new BadRequestException("No se puede reservar una hora que ya paso");
        }

        // PASO CRITICO: bloquear citas activas de ese barbero/fecha y verificar solapamiento
        List<Appointment> activeAppointments =
                appointmentRepository.findActiveForUpdate(barber.getId(), request.getAppointmentDate());

        boolean overlaps = activeAppointments.stream().anyMatch(existing ->
                startTime.isBefore(existing.getEndTime()) && existing.getStartTime().isBefore(endTime)
        );

        if (overlaps) {
            throw new BadRequestException("El horario seleccionado ya no esta disponible. Por favor elija otro.");
        }

        // Verifica si el cliente tiene un cupon de recompensa activo en esta
// barberia. Si lo tiene, esta cita sera gratuita y el cupon se marca
// como usado, vinculado a esta cita.
Optional<RewardCoupon> activeCoupon = rewardCouponRepository
        .findFirstByClientIdAndBarbershopIdAndStatus(clientId, barber.getBarbershop().getId(), CouponStatus.ACTIVE);

BigDecimal price = activeCoupon.isPresent() ? BigDecimal.ZERO : service.getPrice();

        Appointment appointment = Appointment.builder()
                .barbershop(barber.getBarbershop())
                .client(client)
                .barber(barber)
                .service(service)
                .appointmentDate(request.getAppointmentDate())
                .startTime(startTime)
                .endTime(endTime)
                .status(AppointmentStatus.PENDING)
                .priceAtBooking(price)
                .notes(request.getNotes())
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);

// Si se aplico un cupon, marcarlo como usado y vincularlo a esta cita
activeCoupon.ifPresent(coupon -> {
    coupon.setStatus(CouponStatus.USED);
    coupon.setAppointment(savedAppointment);
    coupon.setUsedAt(LocalDateTime.now());
    rewardCouponRepository.save(coupon);
});

appointment = savedAppointment;

        notificationService.notify(
                client.getId(),
                "Cita reservada",
                "Tu cita para " + service.getName() + " el " + appointment.getAppointmentDate()
                        + " a las " + appointment.getStartTime() + " ha sido registrada. Esperando confirmacion.",
                Notification.Type.APPOINTMENT_CONFIRMATION
        );

        return toResponse(appointment);
    }

    // =====================================================================
    // CONSULTAS
    // =====================================================================

    /** Citas del cliente autenticado (su historial). */
    public List<AppointmentResponse> getMyAppointmentsAsClient(Long clientId) {
        return appointmentRepository.findByClientIdOrderByAppointmentDateDescStartTimeDesc(clientId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Agenda de un barbero para un dia especifico (usado por BARBER y ADMIN_BARBERSHOP). */
    public List<AppointmentResponse> getBarberAgenda(Long barberProfileId, LocalDate date) {
        BarberProfile barber = barberProfileRepository.findById(barberProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Barbero no encontrado"));

        validateSameTenant(barber.getBarbershop().getId());

        return appointmentRepository.findByBarberIdAndAppointmentDateOrderByStartTime(barberProfileId, date).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Todas las citas de la barberia del admin autenticado para una fecha (vista general). */
    public List<AppointmentResponse> getBarbershopAgenda(LocalDate date) {
        Long barbershopId = requireTenant();

        return appointmentRepository.findByBarbershopIdAndAppointmentDateOrderByStartTime(barbershopId, date).stream()
                .map(this::toResponse)
                .toList();
    }

    // =====================================================================
    // TRANSICIONES DE ESTADO
    // =====================================================================

    /** ADMIN_BARBERSHOP o BARBER confirman una cita PENDING. */
    @Transactional
    public AppointmentResponse confirm(Long appointmentId) {
        Appointment appointment = findOwnedByTenant(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException("Solo se pueden confirmar citas en estado PENDIENTE");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        notificationService.notify(
                appointment.getClient().getId(),
                "Cita confirmada",
                "Tu cita del " + appointment.getAppointmentDate() + " a las " + appointment.getStartTime() + " fue confirmada.",
                Notification.Type.APPOINTMENT_CONFIRMATION
        );

        return toResponse(appointment);
    }

    /** BARBER marca la cita como en proceso (el cliente llego y se esta atendiendo). */
    @Transactional
    public AppointmentResponse startService(Long appointmentId) {
        Appointment appointment = findOwnedByTenant(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Solo se pueden iniciar citas CONFIRMADAS");
        }

        appointment.setStatus(AppointmentStatus.IN_PROGRESS);
        return toResponse(appointmentRepository.save(appointment));
    }

    /** BARBER o ADMIN_BARBERSHOP marcan la cita como completada. */
    @Transactional
    public AppointmentResponse complete(Long appointmentId) {
        Appointment appointment = findOwnedByTenant(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.IN_PROGRESS
                && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Solo se pueden completar citas confirmadas o en proceso");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment = appointmentRepository.save(appointment);

        registerServiceIncome(appointment);

        return toResponse(appointment);
        // NOTA: la asignacion de sticker de fidelizacion se hace en la Fase 6,
        // como un paso posterior explicito (no automatico), segun el diseño original.
    }

    /**
     * Registra automaticamente el ingreso en Finanzas cuando una cita se marca
     * como completada, para que el admin no tenga que anotarlo a mano. Queda
     * ligado a la cita (related_appointment_id) para que InvoiceService pueda
     * mantenerlo sincronizado si despues se agregan productos o una promocion
     * (ver InvoiceService.syncFinanceIncome). Se protege contra duplicados por
     * si complete() se invoca mas de una vez sobre la misma cita.
     *
     * IMPORTANTE: recordDate usa la fecha real en que se completo el servicio
     * (LocalDate.now()), NO appointment.getAppointmentDate(). El dashboard y
     * Finanzas calculan "hoy/esta semana/este mes" contra la fecha real -- si
     * se usara la fecha programada de la cita (que puede quedar en el pasado
     * por una reprogramacion o en el futuro si se completa antes de la fecha
     * agendada), el ingreso quedaria fuera de esos rangos y pareceria que
     * "no llego" a Finanzas/Dashboard aunque el registro exista.
     */
    private void registerServiceIncome(Appointment appointment) {
        if (financeRecordRepository.findByRelatedAppointmentId(appointment.getId()).isPresent()) {
            return;
        }

        FinanceRecord record = FinanceRecord.builder()
                .barbershop(appointment.getBarbershop())
                .type(FinanceRecord.Type.INCOME)
                .category("Corte")
                .amount(appointment.getPriceAtBooking())
                .description(appointment.getService().getName() + " - " + appointment.getClient().getFullName())
                .recordDate(LocalDate.now())
                .relatedAppointment(appointment)
                .build();

        financeRecordRepository.save(record);
    }

    /** Marcar que el cliente no se presento. */
    @Transactional
    public AppointmentResponse markNoShow(Long appointmentId) {
        Appointment appointment = findOwnedByTenant(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED
                && appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException("Solo se puede marcar NO_SHOW en citas pendientes o confirmadas");
        }

        appointment.setStatus(AppointmentStatus.NO_SHOW);
        return toResponse(appointmentRepository.save(appointment));
    }

    // =====================================================================
    // CANCELACION (CLIENT o ADMIN_BARBERSHOP)
    // =====================================================================

    /**
     * Cancela una cita. Si quien cancela es el CLIENT, se valida que sea
     * el dueno de la cita y se respeta la politica de cancelacion
     * (cancellation_policy_hours) de la barberia.
     */
    @Transactional
    public AppointmentResponse cancel(Long appointmentId, Long requestingUserId, Role requestingRole,
                                       CancelAppointmentRequest request) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Esta cita ya no se puede cancelar");
        }

        if (requestingRole == Role.CLIENT) {
            if (!appointment.getClient().getId().equals(requestingUserId)) {
                throw new ForbiddenException("No puede cancelar citas de otro cliente");
            }
            validateCancellationPolicy(appointment);
        } else {
            // ADMIN_BARBERSHOP: debe pertenecer al mismo tenant
            validateSameTenant(appointment.getBarbershop().getId());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledReason(request.getReason());
        appointment = appointmentRepository.save(appointment);

        notificationService.notify(
                appointment.getClient().getId(),
                "Cita cancelada",
                "Tu cita del " + appointment.getAppointmentDate() + " a las " + appointment.getStartTime() + " fue cancelada.",
                Notification.Type.SYSTEM
        );

        return toResponse(appointment);
    }

    /**
     * Valida que falten al menos `cancellation_policy_hours` para la cita,
     * segun la configuracion de la barberia.
     */
    private void validateCancellationPolicy(Appointment appointment) {
        int policyHours = appointment.getBarbershop().getCancellationPolicyHours();

        LocalDateTime appointmentDateTime = LocalDateTime.of(
                appointment.getAppointmentDate(), appointment.getStartTime());

        LocalDateTime limit = LocalDateTime.now().plusHours(policyHours);

        if (appointmentDateTime.isBefore(limit)) {
            throw new BadRequestException(
                    "Esta cita ya no se puede cancelar. Debe cancelarse con al menos "
                            + policyHours + " hora(s) de anticipacion.");
        }
    }

    // =====================================================================
    // REPROGRAMACION (CLIENT)
    // =====================================================================

    /**
     * Reprograma una cita del cliente a nueva fecha/hora.
     * Reutiliza la misma logica de validacion de solapamiento que create(),
     * dentro de la misma transaccion con lock pesimista.
     */
    @Transactional
    public AppointmentResponse reschedule(Long appointmentId, Long clientId, RescheduleAppointmentRequest request) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));

        if (!appointment.getClient().getId().equals(clientId)) {
            throw new ForbiddenException("No puede reprogramar citas de otro cliente");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.COMPLETED
                || appointment.getStatus() == AppointmentStatus.IN_PROGRESS) {
            throw new BadRequestException("Esta cita no se puede reprogramar en su estado actual");
        }

        validateCancellationPolicy(appointment); // misma politica aplica para reprogramar

        int durationMinutes = appointment.getService().getDurationMinutes();
        LocalTime newStart = request.getNewStartTime();
        LocalTime newEnd = newStart.plusMinutes(durationMinutes);

        // Bloquear y verificar solapamiento en la NUEVA fecha, EXCLUYENDO esta misma cita
        List<Appointment> activeAppointments = appointmentRepository
                .findActiveForUpdate(appointment.getBarber().getId(), request.getNewDate());

        boolean overlaps = activeAppointments.stream()
                .filter(existing -> !existing.getId().equals(appointment.getId()))
                .anyMatch(existing ->
                        newStart.isBefore(existing.getEndTime()) && existing.getStartTime().isBefore(newEnd));

        if (overlaps) {
            throw new BadRequestException("El nuevo horario seleccionado no esta disponible. Por favor elija otro.");
        }

        appointment.setAppointmentDate(request.getNewDate());
        appointment.setStartTime(newStart);
        appointment.setEndTime(newEnd);
        appointment.setStatus(AppointmentStatus.PENDING); // vuelve a requerir confirmacion

        return toResponse(appointmentRepository.save(appointment));
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    /**
     * Busca una cita por id y valida que pertenezca a la barberia
     * del usuario autenticado (ADMIN_BARBERSHOP o BARBER).
     */
    private Appointment findOwnedByTenant(Long appointmentId) {
        Long barbershopId = requireTenant();

        return appointmentRepository.findByIdAndBarbershopId(appointmentId, barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
    }

    private void validateSameTenant(Long resourceBarbershopId) {
        Long barbershopId = requireTenant();
        if (!resourceBarbershopId.equals(barbershopId)) {
            throw new ForbiddenException("No tiene permisos sobre este recurso");
        }
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .barbershopId(a.getBarbershop().getId())
                .clientId(a.getClient().getId())
                .clientName(a.getClient().getFullName())
                .barberId(a.getBarber().getId())
                .barberName(a.getBarber().getUser().getFullName())
                .serviceId(a.getService().getId())
                .serviceName(a.getService().getName())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .priceAtBooking(a.getPriceAtBooking())
                .notes(a.getNotes())
                .cancelledReason(a.getCancelledReason())
                .createdAt(a.getCreatedAt())
                .build();
    }

    public List<AppointmentResponse> getMyAgendaAsBarber(Long userId, LocalDate date) {
    BarberProfile profile = barberProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil de barbero no encontrado"));

    return getBarberAgenda(profile.getId(), date);
}
}