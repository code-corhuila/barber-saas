package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.BarberSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BarberScheduleRepository extends JpaRepository<BarberSchedule, Long> {
    List<BarberSchedule> findByBarberProfileId(Long barberProfileId);
    List<BarberSchedule> findByBarberProfileIdAndDayOfWeekAndIsActiveTrue(Long barberProfileId, Integer dayOfWeek);
    void deleteByBarberProfileIdAndDayOfWeek(Long barberProfileId, Integer dayOfWeek);
}