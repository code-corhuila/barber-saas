package com.barbersaas.barberservice;

import com.barbersaas.barberservice.dto.ServiceRequest;
import com.barbersaas.barberservice.dto.ServiceResponse;
import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.BarberServiceEntity;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.ServiceRepository;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BarberServiceService {

    private final ServiceRepository serviceRepository;
    private final BarbershopRepository barbershopRepository;

    /**
     * Lista los servicios activos de una barberia. PUBLICO: usado por clientes
     * para ver el catalogo antes de reservar. Por eso recibe barbershopId
     * explicito y no usa TenantContext.
     */
    public List<ServiceResponse> getPublicServices(Long barbershopId) {
        return serviceRepository.findByBarbershopIdAndIsActiveTrue(barbershopId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Lista TODOS los servicios (activos e inactivos) de la barberia
     * del ADMIN_BARBERSHOP autenticado.
     */
    public List<ServiceResponse> getMyServices() {
        Long barbershopId = requireTenant();
        return serviceRepository.findByBarbershopId(barbershopId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ServiceResponse create(ServiceRequest request) {
        Long barbershopId = requireTenant();

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        BarberServiceEntity entity = BarberServiceEntity.builder()
                .barbershop(barbershop)
                .name(request.getName())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .isActive(true)
                .build();

        return toResponse(serviceRepository.save(entity));
    }

    @Transactional
    public ServiceResponse update(Long id, ServiceRequest request) {
        BarberServiceEntity entity = findOwnedOrThrow(id);

        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setDurationMinutes(request.getDurationMinutes());
        entity.setPrice(request.getPrice());

        return toResponse(serviceRepository.save(entity));
    }

    @Transactional
    public void toggleActive(Long id) {
        BarberServiceEntity entity = findOwnedOrThrow(id);
        entity.setIsActive(!entity.getIsActive());
        serviceRepository.save(entity);
    }

    /**
     * Busca un servicio por id Y valida que pertenezca al tenant
     * del usuario autenticado. Lanza ForbiddenException si no coincide,
     * lo que evita que un ADMIN_BARBERSHOP edite servicios de otra barberia
     * simplemente cambiando el id en la URL (IDOR).
     */
    private BarberServiceEntity findOwnedOrThrow(Long id) {
        Long barbershopId = requireTenant();

        BarberServiceEntity entity = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));

        if (!entity.getBarbershop().getId().equals(barbershopId)) {
            throw new ForbiddenException("No tiene permisos sobre este servicio");
        }

        return entity;
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    private ServiceResponse toResponse(BarberServiceEntity entity) {
        return ServiceResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .durationMinutes(entity.getDurationMinutes())
                .price(entity.getPrice())
                .isActive(entity.getIsActive())
                .build();
    }
}