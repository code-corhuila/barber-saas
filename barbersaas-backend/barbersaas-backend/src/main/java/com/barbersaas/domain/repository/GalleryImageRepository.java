package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.GalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findByBarbershopIdOrderByCreatedAtDesc(Long barbershopId);
    List<GalleryImage> findByBarberProfileIdOrderByCreatedAtDesc(Long barberProfileId);
    Optional<GalleryImage> findByIdAndBarbershopId(Long id, Long barbershopId);
}