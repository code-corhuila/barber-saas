package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.FinanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FinanceRecordRepository extends JpaRepository<FinanceRecord, Long> {

    List<FinanceRecord> findByBarbershopIdAndRecordDateBetweenOrderByRecordDateDesc(
            Long barbershopId, LocalDate from, LocalDate to);

    /** El ingreso automatico ligado a la factura de una cita (uno por cita, se actualiza en vez de duplicarse). */
    Optional<FinanceRecord> findByRelatedAppointmentId(Long appointmentId);

    @Query("""
           SELECT COALESCE(SUM(f.amount), 0) FROM FinanceRecord f
           WHERE f.barbershop.id = :barbershopId
             AND f.type = :type
             AND f.recordDate BETWEEN :from AND :to
           """)
    BigDecimal sumByTypeAndDateRange(@Param("barbershopId") Long barbershopId,
                                       @Param("type") FinanceRecord.Type type,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);

    /** Para el dashboard del Super Admin: ingresos de TODAS las barberias. */
    @Query("""
           SELECT COALESCE(SUM(f.amount), 0) FROM FinanceRecord f
           WHERE f.type = 'INCOME'
           """)
    BigDecimal sumAllPlatformIncome();
}