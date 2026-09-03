package com.barbersaas.barbershop;

import com.barbersaas.barbershop.dto.BarbershopRequest;
import com.barbersaas.barbershop.dto.BarbershopResponse;
import com.barbersaas.barbershop.dto.CreateBarbershopOwnerRequest;
import com.barbersaas.barbershop.dto.EmployeeResponseLite;
import com.barbersaas.barbershop.dto.SelfRegisterBarbershopRequest;
import com.barbersaas.barbershop.dto.UpdateBarbershopStatusRequest;
import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.SubscriptionPlan;
import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.enums.BarbershopStatus;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.SubscriptionPlanRepository;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.mapper.BarbershopMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.barbersaas.domain.enums.Role;
import com.barbersaas.domain.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BarbershopService {

    private final BarbershopRepository barbershopRepository;
    private final SubscriptionPlanRepository planRepository;
    private final BarbershopMapper barbershopMapper;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<BarbershopResponse> getAll() {
        return barbershopRepository.findAll().stream()
                .map(barbershopMapper::toResponse)
                .toList();
    }

    public BarbershopResponse getById(Long id) {
        Barbershop barbershop = findOrThrow(id);
        return barbershopMapper.toResponse(barbershop);
    }

    @Transactional
    public BarbershopResponse create(BarbershopRequest request) {
        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new BadRequestException("El plan especificado no existe"));

        Barbershop barbershop = Barbershop.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .phone(request.getPhone())
                .whatsappNumber(request.getWhatsappNumber())
                .logoUrl(request.getLogoUrl())
                .status(BarbershopStatus.TRIAL)
                .plan(plan)
                .timezone(request.getTimezone() != null ? request.getTimezone() : "America/Bogota")
                .cancellationPolicyHours(
                        request.getCancellationPolicyHours() != null ? request.getCancellationPolicyHours() : 2)
                .build();

        return barbershopMapper.toResponse(barbershopRepository.save(barbershop));
    }

    @Transactional
    public BarbershopResponse update(Long id, BarbershopRequest request) {
        Barbershop barbershop = findOrThrow(id);

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new BadRequestException("El plan especificado no existe"));

        barbershop.setName(request.getName());
        barbershop.setAddress(request.getAddress());
        barbershop.setCity(request.getCity());
        barbershop.setLatitude(request.getLatitude());
        barbershop.setLongitude(request.getLongitude());
        barbershop.setPhone(request.getPhone());
        barbershop.setWhatsappNumber(request.getWhatsappNumber());
        barbershop.setLogoUrl(request.getLogoUrl());
        barbershop.setPlan(plan);

        if (request.getTimezone() != null) {
            barbershop.setTimezone(request.getTimezone());
        }
        if (request.getCancellationPolicyHours() != null) {
            barbershop.setCancellationPolicyHours(request.getCancellationPolicyHours());
        }

        return barbershopMapper.toResponse(barbershopRepository.save(barbershop));
    }

    @Transactional
    public BarbershopResponse updateStatus(Long id, UpdateBarbershopStatusRequest request) {
        Barbershop barbershop = findOrThrow(id);
        barbershop.setStatus(request.getStatus());
        return barbershopMapper.toResponse(barbershopRepository.save(barbershop));
    }

    @Transactional
public EmployeeResponseLite createOwner(Long barbershopId, CreateBarbershopOwnerRequest request) {
    Barbershop barbershop = findOrThrow(barbershopId);

    if (userRepository.existsByEmail(request.getEmail())) {
        throw new BadRequestException("El correo ya esta registrado");
    }

    User owner = User.builder()
            .barbershop(barbershop)
            .fullName(request.getFullName())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .phone(request.getPhone())
            .role(Role.ADMIN_BARBERSHOP)
            .isActive(true)
            .build();

    owner = userRepository.save(owner);

    return new EmployeeResponseLite(owner.getId(), owner.getFullName(), owner.getEmail());
}

    @Transactional
    public void delete(Long id) {
        Barbershop barbershop = findOrThrow(id);
        barbershopRepository.delete(barbershop);
        // NOTA: gracias a ON DELETE CASCADE en el script SQL, se eliminan
        // automaticamente usuarios, servicios, citas, etc. de esta barberia.
        // En produccion se recomienda SOFT DELETE en lugar de borrado fisico.
    }

    private Barbershop findOrThrow(Long id) {
        return barbershopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));
    }

    @Transactional
public AuthResponseData selfRegister(SelfRegisterBarbershopRequest request) {
    if (userRepository.existsByEmail(request.getOwnerEmail())) {
        throw new BadRequestException("El correo ya esta registrado");
    }

    SubscriptionPlan plan = planRepository.findById(request.getPlanId())
            .orElseThrow(() -> new BadRequestException("El plan especificado no existe"));

    Barbershop barbershop = Barbershop.builder()
            .name(request.getBarbershopName())
            .address(request.getAddress())
            .city(request.getCity())
            .phone(request.getBarbershopPhone())
            .status(BarbershopStatus.TRIAL)
            .plan(plan)
            .timezone("America/Bogota")
            .cancellationPolicyHours(2)
            .trialEndsAt(LocalDateTime.now().plusDays(60))
            .build();

    barbershop = barbershopRepository.save(barbershop);

    User owner = User.builder()
            .barbershop(barbershop)
            .fullName(request.getOwnerFullName())
            .email(request.getOwnerEmail())
            .passwordHash(passwordEncoder.encode(request.getOwnerPassword()))
            .phone(request.getOwnerPhone())
            .role(Role.ADMIN_BARBERSHOP)
            .isActive(true)
            .build();

    owner = userRepository.save(owner);

    return new AuthResponseData(owner, barbershop);
}

/**
 * Contenedor simple para devolver al usuario y su barberia recien
 * creados, usado por AuthService para construir el AuthResponse
 * (con JWT) sin que BarbershopService dependa de JwtTokenProvider.
 */
public record AuthResponseData(User owner, Barbershop barbershop) {}
}