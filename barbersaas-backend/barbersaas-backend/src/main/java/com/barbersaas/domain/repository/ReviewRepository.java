package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBarbershopIdOrderByCreatedAtDesc(Long barbershopId);
    List<Review> findByBarberProfileIdOrderByCreatedAtDesc(Long barberProfileId);
    boolean existsByAppointmentId(Long appointmentId);
}