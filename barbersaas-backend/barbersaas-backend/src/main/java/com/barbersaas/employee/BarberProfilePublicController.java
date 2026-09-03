package com.barbersaas.employee;

import com.barbersaas.domain.entity.BarberProfile;
import com.barbersaas.domain.repository.BarberProfileRepository;
import com.barbersaas.employee.dto.BarberPublicResponse;
import com.barbersaas.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/public/barbershops/{barbershopId}/barbers")
@RequiredArgsConstructor
@Tag(name = "Barberos (Publico)", description = "Listado de barberos de una barberia")
public class BarberProfilePublicController {

    private final BarberProfileRepository barberProfileRepository;

    @GetMapping
    @Operation(summary = "Listar barberos activos de una barberia")
    public ResponseEntity<List<BarberPublicResponse>> getBarbers(@PathVariable Long barbershopId) {
        List<BarberProfile> barbers = barberProfileRepository.findByBarbershopId(barbershopId);

        return ResponseEntity.ok(barbers.stream()
                .filter(b -> Boolean.TRUE.equals(b.getUser().getIsActive()))
                .map(b -> BarberPublicResponse.builder()
                        .id(b.getId())
                        .fullName(b.getUser().getFullName())
                        .profilePhotoUrl(b.getUser().getProfilePhotoUrl())
                        .experienceYears(b.getExperienceYears())
                        .ratingAvg(b.getRatingAvg())
                        .ratingCount(b.getRatingCount())
                        .build())
                .toList());
    }
}