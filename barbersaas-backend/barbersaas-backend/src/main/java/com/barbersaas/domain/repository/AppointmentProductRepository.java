package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.AppointmentProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentProductRepository extends JpaRepository<AppointmentProduct, Long> {
    List<AppointmentProduct> findByAppointmentId(Long appointmentId);
}
