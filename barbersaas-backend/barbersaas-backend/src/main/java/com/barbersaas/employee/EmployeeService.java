package com.barbersaas.employee;

import com.barbersaas.domain.entity.BarberProfile;
import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.enums.Role;
import com.barbersaas.domain.repository.BarberProfileRepository;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.UserRepository;
import com.barbersaas.employee.dto.BarberPayrollResponse;
import com.barbersaas.employee.dto.CreateEmployeeRequest;
import com.barbersaas.employee.dto.EmployeeResponse;
import com.barbersaas.employee.dto.UpdateBarberCommissionRequest;
import com.barbersaas.employee.dto.UpdateDefaultCommissionRequest;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.invoice.InvoiceService;
import com.barbersaas.invoice.dto.InvoiceSummaryResponse;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final UserRepository userRepository;
    private final BarbershopRepository barbershopRepository;
    private final BarberProfileRepository barberProfileRepository;
    private final InvoiceService invoiceService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Lista los empleados (ADMIN_BARBERSHOP + BARBER) de la barberia
     * del usuario autenticado. SIEMPRE filtra por TenantContext,
     * el ADMIN_BARBERSHOP nunca puede ver empleados de otra barberia.
     */
    public List<EmployeeResponse> getEmployees() {
        Long barbershopId = requireTenant();

        return userRepository.findAll().stream()
                .filter(u -> u.getBarbershop() != null && u.getBarbershop().getId().equals(barbershopId))
                .filter(u -> u.getRole() == Role.ADMIN_BARBERSHOP || u.getRole() == Role.BARBER)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EmployeeResponse create(CreateEmployeeRequest request) {
        Long barbershopId = requireTenant();

        if (request.getRole() != Role.BARBER && request.getRole() != Role.ADMIN_BARBERSHOP) {
            throw new BadRequestException("Solo se pueden crear empleados con rol BARBER o ADMIN_BARBERSHOP");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El correo ya esta registrado");
        }

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        User user = User.builder()
                .barbershop(barbershop)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .isActive(true)
                .build();

        user = userRepository.save(user);

        BarberProfile profile = null;
        if (request.getRole() == Role.BARBER) {
            profile = BarberProfile.builder()
                    .user(user)
                    .barbershop(barbershop)
                    .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                    .bio(request.getBio())
                    .ratingAvg(BigDecimal.ZERO)
                    .ratingCount(0)
                    .build();
            profile = barberProfileRepository.save(profile);
        }

        return toResponse(user, profile);
    }

    @Transactional
    public void deactivate(Long userId) {
        Long barbershopId = requireTenant();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));

        // VALIDACION CRITICA DE TENANT: el admin solo puede desactivar
        // empleados de SU PROPIA barberia.
        if (user.getBarbershop() == null || !user.getBarbershop().getId().equals(barbershopId)) {
            throw new ForbiddenException("No tiene permisos sobre este empleado");
        }

        user.setIsActive(false);
        userRepository.save(user);
    }

    private EmployeeResponse toResponse(User user) {
        BarberProfile profile = barberProfileRepository.findByUserId(user.getId()).orElse(null);
        return toResponse(user, profile);
    }

    private EmployeeResponse toResponse(User user, BarberProfile profile) {
        return EmployeeResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .barberProfileId(profile != null ? profile.getId() : null)
                .commissionPercentage(profile != null ? profile.getCommissionPercentage() : null)
                .build();
    }

    // =====================================================================
    // COMISIONES Y NOMINA
    // =====================================================================

    /** % de comision por defecto de mi barberia (se usa cuando un barbero no tiene el suyo propio). */
    public BigDecimal getDefaultCommission() {
        return findMyBarbershop().getDefaultCommissionPercentage();
    }

    @Transactional
    public void updateDefaultCommission(UpdateDefaultCommissionRequest request) {
        Barbershop barbershop = findMyBarbershop();
        barbershop.setDefaultCommissionPercentage(request.getDefaultCommissionPercentage());
        barbershopRepository.save(barbershop);
    }

    /** Configura (o quita, si viene null) el % propio de un barbero especifico. */
    @Transactional
    public void updateBarberCommission(Long userId, UpdateBarberCommissionRequest request) {
        Long barbershopId = requireTenant();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));

        if (user.getBarbershop() == null || !user.getBarbershop().getId().equals(barbershopId)) {
            throw new ForbiddenException("No tiene permisos sobre este empleado");
        }
        if (user.getRole() != Role.BARBER) {
            throw new BadRequestException("Solo se puede configurar comision a un barbero");
        }

        BarberProfile profile = barberProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de barbero no encontrado"));

        profile.setCommissionPercentage(request.getCommissionPercentage());
        barberProfileRepository.save(profile);
    }

    /**
     * Nomina: por cada barbero de mi barberia, cuantos cortes completo y
     * cuanto se le debe pagar en el rango [from, to], segun su % de comision
     * (el propio si lo tiene configurado, si no el de la barberia). Reusa
     * InvoiceService.getMyBarbershopInvoices para calcular el total de cada
     * cita (servicio + productos - descuento) -- el mismo total que se ve en
     * Facturas, para que ambas pantallas nunca muestren cifras distintas.
     */
    public List<BarberPayrollResponse> getPayroll(LocalDate from, LocalDate to) {
        Long barbershopId = requireTenant();
        BigDecimal defaultPct = findMyBarbershop().getDefaultCommissionPercentage();

        List<InvoiceSummaryResponse> invoices = invoiceService.getMyBarbershopInvoices(from, to, null);
        Map<Long, List<InvoiceSummaryResponse>> byBarber = invoices.stream()
                .collect(Collectors.groupingBy(InvoiceSummaryResponse::getBarberId));

        return barberProfileRepository.findByBarbershopId(barbershopId).stream()
                .map(profile -> {
                    List<InvoiceSummaryResponse> mine = byBarber.getOrDefault(profile.getId(), List.of());

                    BigDecimal totalRevenue = mine.stream()
                            .map(InvoiceSummaryResponse::getTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    boolean usesDefault = profile.getCommissionPercentage() == null;
                    BigDecimal pct = usesDefault ? defaultPct : profile.getCommissionPercentage();

                    BigDecimal amountToPay = totalRevenue
                            .multiply(pct)
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                    return BarberPayrollResponse.builder()
                            .barberProfileId(profile.getId())
                            .userId(profile.getUser().getId())
                            .barberName(profile.getUser().getFullName())
                            .cutsCount(mine.size())
                            .totalRevenue(totalRevenue)
                            .commissionPercentage(pct)
                            .usesDefaultCommission(usesDefault)
                            .amountToPay(amountToPay)
                            .build();
                })
                .toList();
    }

    private Barbershop findMyBarbershop() {
        Long barbershopId = requireTenant();
        return barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));
    }

    /**
     * Obtiene el tenant del usuario autenticado. Si es null (SUPER_ADMIN
     * sin barberia asignada), lanza error: este endpoint no aplica para SUPER_ADMIN.
     */
    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }
}