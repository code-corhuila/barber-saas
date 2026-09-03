package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.ScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, Long> {
    Optional<ScheduleException> findByBarberProfileIdAndExceptionDate(Long barberProfileId, LocalDate date);
}