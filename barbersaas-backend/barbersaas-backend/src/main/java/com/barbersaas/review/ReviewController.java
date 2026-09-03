package com.barbersaas.review;

import com.barbersaas.review.dto.CreateReviewRequest;
import com.barbersaas.review.dto.ReviewResponse;
import com.barbersaas.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Resenas", description = "Calificaciones de barberias y barberos")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/api/client/reviews")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Crear una resena")
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody CreateReviewRequest request) {
        Long clientId = TenantContext.getUserId();
        return ResponseEntity.ok(reviewService.create(clientId, request));
    }

    @GetMapping("/api/public/barbershops/{barbershopId}/reviews")
    @Operation(summary = "Ver resenas de una barberia (publico)")
    public ResponseEntity<List<ReviewResponse>> getByBarbershop(@PathVariable Long barbershopId) {
        return ResponseEntity.ok(reviewService.getByBarbershop(barbershopId));
    }

    @GetMapping("/api/public/barbers/{barberProfileId}/reviews")
    @Operation(summary = "Ver resenas de un barbero (publico)")
    public ResponseEntity<List<ReviewResponse>> getByBarber(@PathVariable Long barberProfileId) {
        return ResponseEntity.ok(reviewService.getByBarber(barberProfileId));
    }
}