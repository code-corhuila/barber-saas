package com.barbersaas.review;

import com.barbersaas.domain.entity.*;
import com.barbersaas.domain.repository.*;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.review.dto.CreateReviewRequest;
import com.barbersaas.review.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BarbershopRepository barbershopRepository;
    private final BarberProfileRepository barberProfileRepository;
    private final AppointmentRepository appointmentRepository;

    /**
     * Crea una resena. Si se incluye appointmentId, valida que:
     * - la cita pertenezca al cliente que escribe la resena
     * - la cita este COMPLETED (no se puede calificar un servicio no recibido)
     * - no exista ya una resena para esa cita (evita duplicados/spam)
     */
    @Transactional
    public ReviewResponse create(Long clientId, CreateReviewRequest request) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        Barbershop barbershop = barbershopRepository.findById(request.getBarbershopId())
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        BarberProfile barberProfile = null;
        if (request.getBarberProfileId() != null) {
            barberProfile = barberProfileRepository.findById(request.getBarberProfileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Barbero no encontrado"));

            if (!barberProfile.getBarbershop().getId().equals(barbershop.getId())) {
                throw new BadRequestException("El barbero no pertenece a esta barberia");
            }
        }

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));

            if (!appointment.getClient().getId().equals(clientId)) {
                throw new ForbiddenException("No puede calificar una cita que no es suya");
            }

            if (appointment.getStatus() != com.barbersaas.domain.enums.AppointmentStatus.COMPLETED) {
                throw new BadRequestException("Solo puede calificar citas completadas");
            }

            if (reviewRepository.existsByAppointmentId(appointment.getId())) {
                throw new BadRequestException("Ya existe una resena para esta cita");
            }
        }

        Review review = Review.builder()
                .client(client)
                .barbershop(barbershop)
                .barberProfile(barberProfile)
                .appointment(appointment)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        review = reviewRepository.save(review);

        // Recalcular promedio de calificacion del barbero, si aplica
        if (barberProfile != null) {
            recalculateBarberRating(barberProfile);
        }

        return toResponse(review);
    }

    public List<ReviewResponse> getByBarbershop(Long barbershopId) {
        return reviewRepository.findByBarbershopIdOrderByCreatedAtDesc(barbershopId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ReviewResponse> getByBarber(Long barberProfileId) {
        return reviewRepository.findByBarberProfileIdOrderByCreatedAtDesc(barberProfileId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Recalcula rating_avg y rating_count del barbero.
     * Enfoque simple: recorre todas sus resenas. Para volumenes grandes,
     * en una fase de optimizacion se podria usar una query de agregacion
     * (AVG/COUNT) directamente en SQL en lugar de cargar todas las entidades.
     */
    @Transactional
    protected void recalculateBarberRating(BarberProfile barberProfile) {
        List<Review> reviews = reviewRepository.findByBarberProfileIdOrderByCreatedAtDesc(barberProfile.getId());

        int count = reviews.size();
        BigDecimal avg = reviews.stream()
                .map(r -> BigDecimal.valueOf(r.getRating()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);

        barberProfile.setRatingAvg(avg);
        barberProfile.setRatingCount(count);
        barberProfileRepository.save(barberProfile);
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .clientId(review.getClient().getId())
                .clientName(review.getClient().getFullName())
                .barberProfileId(review.getBarberProfile() != null ? review.getBarberProfile().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}