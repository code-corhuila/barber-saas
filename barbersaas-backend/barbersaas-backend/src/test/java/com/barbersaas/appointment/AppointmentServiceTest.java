package com.barbersaas.appointment;

import com.barbersaas.appointment.dto.AppointmentResponse;
import com.barbersaas.appointment.dto.CreateAppointmentRequest;
import com.barbersaas.domain.entity.*;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.enums.Role;
import com.barbersaas.domain.repository.*;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.notification.NotificationService;
import com.barbersaas.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pruebas de las reglas de negocio mas criticas de AppointmentService:
 * aislamiento multi-tenant (SPEC de dominio: un admin/barbero nunca debe
 * poder tocar una cita de otra barberia) y las transiciones de estado
 * validas de una cita. No usa un contexto de Spring (@SpringBootTest) --
 * son mocks puros de Mockito, para que corran rapido y sin necesidad de
 * base de datos.
 */
@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private BarberProfileRepository barberProfileRepository;
    @Mock private ServiceRepository serviceRepository;
    @Mock private UserRepository userRepository;
    @Mock private BarbershopRepository barbershopRepository;
    @Mock private NotificationService notificationService;
    @Mock private RewardCouponRepository rewardCouponRepository;
    @Mock private FinanceRecordRepository financeRecordRepository;

    private AppointmentService appointmentService;

    private Barbershop barbershopA;
    private Barbershop barbershopB;
    private BarberProfile barber;
    private User client;
    private BarberServiceEntity service;

    @BeforeEach
    void setUp() {
        appointmentService = new AppointmentService(
                appointmentRepository, barberProfileRepository, serviceRepository,
                userRepository, barbershopRepository, notificationService,
                rewardCouponRepository, financeRecordRepository);

        barbershopA = Barbershop.builder().id(1L).name("Barberia A").cancellationPolicyHours(2).build();
        barbershopB = Barbershop.builder().id(2L).name("Barberia B").cancellationPolicyHours(2).build();

        barber = BarberProfile.builder().id(10L).barbershop(barbershopA)
                .user(User.builder().id(20L).fullName("Andres Gomez").role(Role.BARBER).build())
                .build();

        client = User.builder().id(30L).fullName("Maria Lopez").role(Role.CLIENT).build();

        service = BarberServiceEntity.builder().id(40L).barbershop(barbershopA)
                .name("Corte clasico").price(new BigDecimal("20000.00"))
                .durationMinutes(30).isActive(true).build();

        TenantContext.setTenantId(1L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // =====================================================================
    // Solapamiento de horarios (no permitir doble reserva)
    // =====================================================================

    @Test
    void create_rechazaCuandoElHorarioSeSolapaConOtraCitaActiva() {
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setBarberId(10L);
        request.setServiceId(40L);
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));

        Appointment existing = Appointment.builder()
                .startTime(LocalTime.of(9, 45)).endTime(LocalTime.of(10, 15))
                .build();

        when(barberProfileRepository.findById(10L)).thenReturn(Optional.of(barber));
        when(serviceRepository.findById(40L)).thenReturn(Optional.of(service));
        when(userRepository.findById(30L)).thenReturn(Optional.of(client));
        when(appointmentRepository.findActiveForUpdate(eq(10L), any())).thenReturn(List.of(existing));

        assertThatThrownBy(() -> appointmentService.create(30L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("no esta disponible");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void create_permiteReservarCuandoNoHaySolapamiento() {
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setBarberId(10L);
        request.setServiceId(40L);
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(14, 0));

        when(barberProfileRepository.findById(10L)).thenReturn(Optional.of(barber));
        when(serviceRepository.findById(40L)).thenReturn(Optional.of(service));
        when(userRepository.findById(30L)).thenReturn(Optional.of(client));
        when(rewardCouponRepository.findFirstByClientIdAndBarbershopIdAndStatus(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(appointmentRepository.findActiveForUpdate(eq(10L), any())).thenReturn(List.of());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse response = appointmentService.create(30L, request);

        assertThat(response.getStatus()).isEqualTo(AppointmentStatus.PENDING);
        assertThat(response.getPriceAtBooking()).isEqualByComparingTo("20000.00");
    }

    // =====================================================================
    // Aislamiento multi-tenant
    // =====================================================================

    @Test
    void confirm_lanzaNotFoundSiLaCitaPerteneceAOtraBarberia() {
        // TenantContext = barbershop 1, pero la query filtra por ese tenant
        // y no encuentra nada porque la cita real es de la barberia 2.
        when(appointmentRepository.findByIdAndBarbershopId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.confirm(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void cancel_comoAdminRechazaCitaDeOtraBarberia() {
        Appointment appointmentDeOtraBarberia = Appointment.builder()
                .id(50L).barbershop(barbershopB).client(client).barber(barber)
                .status(AppointmentStatus.PENDING)
                .build();

        when(appointmentRepository.findById(50L)).thenReturn(Optional.of(appointmentDeOtraBarberia));

        assertThatThrownBy(() -> appointmentService.cancel(50L, null, Role.ADMIN_BARBERSHOP,
                new com.barbersaas.appointment.dto.CancelAppointmentRequest()))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void cancel_comoClientRechazaCitaDeOtroCliente() {
        Appointment appointmentDeOtroCliente = Appointment.builder()
                .id(51L).barbershop(barbershopA)
                .client(User.builder().id(999L).build())
                .barber(barber).status(AppointmentStatus.PENDING)
                .build();

        when(appointmentRepository.findById(51L)).thenReturn(Optional.of(appointmentDeOtroCliente));

        assertThatThrownBy(() -> appointmentService.cancel(51L, 30L, Role.CLIENT,
                new com.barbersaas.appointment.dto.CancelAppointmentRequest()))
                .isInstanceOf(ForbiddenException.class);
    }

    // =====================================================================
    // Transiciones de estado
    // =====================================================================

    @Test
    void complete_rechazaSiLaCitaEstaEnPending() {
        Appointment appointment = baseAppointment(AppointmentStatus.PENDING);
        when(appointmentRepository.findByIdAndBarbershopId(60L, 1L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.complete(60L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void complete_permiteDesdeConfirmedYRegistraElIngresoEnFinanzas() {
        Appointment appointment = baseAppointment(AppointmentStatus.CONFIRMED);
        when(appointmentRepository.findByIdAndBarbershopId(60L, 1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(financeRecordRepository.findByRelatedAppointmentId(60L)).thenReturn(Optional.empty());

        AppointmentResponse response = appointmentService.complete(60L);

        assertThat(response.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);

        ArgumentCaptor<FinanceRecord> captor = ArgumentCaptor.forClass(FinanceRecord.class);
        verify(financeRecordRepository).save(captor.capture());
        FinanceRecord record = captor.getValue();
        assertThat(record.getType()).isEqualTo(FinanceRecord.Type.INCOME);
        assertThat(record.getAmount()).isEqualByComparingTo("20000.00");
        assertThat(record.getRecordDate()).isEqualTo(LocalDate.now());
    }

    @Test
    void complete_noDuplicaElIngresoSiYaExisteUnoParaEsaCita() {
        Appointment appointment = baseAppointment(AppointmentStatus.IN_PROGRESS);
        when(appointmentRepository.findByIdAndBarbershopId(60L, 1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(financeRecordRepository.findByRelatedAppointmentId(60L))
                .thenReturn(Optional.of(FinanceRecord.builder().id(1L).build()));

        appointmentService.complete(60L);

        verify(financeRecordRepository, never()).save(any());
    }

    @Test
    void startService_rechazaSiLaCitaNoEstaConfirmada() {
        Appointment appointment = baseAppointment(AppointmentStatus.PENDING);
        when(appointmentRepository.findByIdAndBarbershopId(60L, 1L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.startService(60L))
                .isInstanceOf(BadRequestException.class);
    }

    private Appointment baseAppointment(AppointmentStatus status) {
        return Appointment.builder()
                .id(60L).barbershop(barbershopA).client(client).barber(barber).service(service)
                .appointmentDate(LocalDate.now()).startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(10, 30))
                .status(status).priceAtBooking(new BigDecimal("20000.00"))
                .build();
    }
}
