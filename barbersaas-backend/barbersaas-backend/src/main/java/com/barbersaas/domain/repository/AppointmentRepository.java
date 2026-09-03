package com.barbersaas.domain.repository;

import com.barbersaas.dashboard.dto.PeakHourProjection;
import com.barbersaas.dashboard.dto.TopBarberProjection;
import com.barbersaas.dashboard.dto.TopServiceProjection;
import com.barbersaas.domain.entity.Appointment;
import com.barbersaas.domain.enums.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByBarberIdAndAppointmentDateAndStatusNot(Long barberId, LocalDate date, AppointmentStatus status);

    List<Appointment> findByClientIdOrderByAppointmentDateDescStartTimeDesc(Long clientId);

    List<Appointment> findByBarberIdAndAppointmentDateOrderByStartTime(Long barberId, LocalDate date);

    List<Appointment> findByBarbershopIdAndAppointmentDateOrderByStartTime(Long barbershopId, LocalDate date);

    Optional<Appointment> findByIdAndBarbershopId(Long id, Long barbershopId);

    List<Appointment> findByAppointmentDateAndStatus(LocalDate date, AppointmentStatus status);

    /** Facturas del admin: todas las citas completadas de su barberia en un rango. */
    List<Appointment> findByBarbershopIdAndStatusAndAppointmentDateBetweenOrderByAppointmentDateDesc(
            Long barbershopId, AppointmentStatus status, LocalDate from, LocalDate to);

    /** Historial del barbero: solo sus propias citas completadas. */
    List<Appointment> findByBarberIdAndStatusOrderByAppointmentDateDescStartTimeDesc(
            Long barberId, AppointmentStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           SELECT a FROM Appointment a
           WHERE a.barber.id = :barberId
             AND a.appointmentDate = :date
             AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
           """)
    List<Appointment> findActiveForUpdate(@Param("barberId") Long barberId, @Param("date") LocalDate date);

    // =====================================================================
    // QUERIES PARA EL DASHBOARD (Fase 7)
    // =====================================================================

    /** Cuenta citas por estado en un rango de fechas (para "completadas" / "canceladas"). */
    @Query("""
           SELECT COUNT(a) FROM Appointment a
           WHERE a.barbershop.id = :barbershopId
             AND a.appointmentDate BETWEEN :from AND :to
             AND a.status = :status
           """)
    long countByStatusAndDateRange(@Param("barbershopId") Long barbershopId,
                                     @Param("status") AppointmentStatus status,
                                     @Param("from") LocalDate from,
                                     @Param("to") LocalDate to);

    /** Total de citas en un rango (cualquier estado), para calcular tasa de cancelacion. */
    long countByBarbershopIdAndAppointmentDateBetween(Long barbershopId, LocalDate from, LocalDate to);

    /** Top 5 servicios mas reservados (excluye canceladas). */
    @Query("""
           SELECT a.service.id AS serviceId,
                  a.service.name AS serviceName,
                  COUNT(a) AS totalBookings
           FROM Appointment a
           WHERE a.barbershop.id = :barbershopId
             AND a.appointmentDate BETWEEN :from AND :to
             AND a.status <> 'CANCELLED'
           GROUP BY a.service.id, a.service.name
           ORDER BY totalBookings DESC
           """)
    List<TopServiceProjection> findTopServices(@Param("barbershopId") Long barbershopId,
                                                  @Param("from") LocalDate from,
                                                  @Param("to") LocalDate to);

    /** Barbero mas solicitado (excluye canceladas). */
    @Query("""
           SELECT a.barber.id AS barberProfileId,
                  a.barber.user.fullName AS barberName,
                  COUNT(a) AS totalAppointments
           FROM Appointment a
           WHERE a.barbershop.id = :barbershopId
             AND a.appointmentDate BETWEEN :from AND :to
             AND a.status <> 'CANCELLED'
           GROUP BY a.barber.id, a.barber.user.fullName
           ORDER BY totalAppointments DESC
           """)
    List<TopBarberProjection> findTopBarbers(@Param("barbershopId") Long barbershopId,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    /**
     * Horas pico: agrupa citas por la hora de inicio (0-23).
     * Usa EXTRACT(HOUR FROM ...) nativo de PostgreSQL porque JPQL no tiene una
     * funcion estandar equivalente para extraer la hora de un LocalTime.
     */
    @Query(value = """
           SELECT EXTRACT(HOUR FROM a.start_time)::int AS hourOfDay, COUNT(*) AS totalAppointments
           FROM appointments a
           WHERE a.barbershop_id = :barbershopId
             AND a.appointment_date BETWEEN :from AND :to
             AND a.status <> 'CANCELLED'
           GROUP BY EXTRACT(HOUR FROM a.start_time)
           ORDER BY totalAppointments DESC
           """, nativeQuery = true)
    List<PeakHourProjection> findPeakHours(@Param("barbershopId") Long barbershopId,
                                             @Param("from") LocalDate from,
                                             @Param("to") LocalDate to);

    // Agregar dentro de AppointmentRepository

/** Top barberias por numero total de citas (para el Super Admin). */
@Query("""
       SELECT a.barbershop.id AS barbershopId,
              a.barbershop.name AS name,
              COUNT(a) AS totalAppointments
       FROM Appointment a
       GROUP BY a.barbershop.id, a.barbershop.name
       ORDER BY totalAppointments DESC
       """)
List<com.barbersaas.dashboard.dto.MostActiveBarbershopProjection> findMostActiveBarbershops();

/** Total global de citas en la plataforma. */
long count(); // ya viene incluido en JpaRepository, solo lo documentamos

Long countByBarberIdAndStatusAndAppointmentDateBetween(
        Long barberProfileId, AppointmentStatus status, LocalDate from, LocalDate to);

@Query("SELECT COALESCE(SUM(a.priceAtBooking), 0) FROM Appointment a " +
       "WHERE a.barber.id = :barberProfileId AND a.status = :status " +
       "AND a.appointmentDate BETWEEN :from AND :to")
BigDecimal sumPriceByBarberIdAndStatusAndAppointmentDateBetween(
        @Param("barberProfileId") Long barberProfileId,
        @Param("status") AppointmentStatus status,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to);

Long countByBarberIdAndStatusInAndAppointmentDateGreaterThanEqual(
        Long barberProfileId, List<AppointmentStatus> statuses, LocalDate from);
}