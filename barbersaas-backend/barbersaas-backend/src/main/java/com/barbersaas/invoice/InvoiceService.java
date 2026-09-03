package com.barbersaas.invoice;

import com.barbersaas.appointment.dto.AppointmentResponse;
import com.barbersaas.domain.entity.*;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.repository.*;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.inventory.InventoryService;
import com.barbersaas.inventory.dto.StockMovementRequest;
import com.barbersaas.invoice.dto.*;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentProductRepository appointmentProductRepository;
    private final InventoryProductRepository inventoryProductRepository;
    private final PromotionRepository promotionRepository;
    private final BarberProfileRepository barberProfileRepository;
    private final FinanceRecordRepository financeRecordRepository;
    private final InventoryService inventoryService;

    // =====================================================================
    // ADMIN
    // =====================================================================

    /** Facturas de citas completadas de mi barberia en un rango, opcionalmente filtradas por barbero. */
    public List<InvoiceSummaryResponse> getMyBarbershopInvoices(LocalDate from, LocalDate to, Long barberId) {
        Long barbershopId = requireTenant();

        return appointmentRepository
                .findByBarbershopIdAndStatusAndAppointmentDateBetweenOrderByAppointmentDateDesc(
                        barbershopId, AppointmentStatus.COMPLETED, from, to)
                .stream()
                .filter(a -> barberId == null || a.getBarber().getId().equals(barberId))
                .map(this::toSummary)
                .toList();
    }

    /** Detalle completo de una factura (servicio + productos + promocion + total). */
    public InvoiceDetailResponse getInvoiceDetail(Long appointmentId) {
        Appointment appointment = findCompletedOwnedByTenant(appointmentId);
        return toDetail(appointment);
    }

    /**
     * Registra un producto vendido durante la visita. Descuenta stock real
     * via InventoryService.registerMovement (misma logica ya validada del
     * modulo de inventario, no se duplica).
     */
    @Transactional
    public InvoiceDetailResponse addProduct(Long appointmentId, AddInvoiceProductRequest request) {
        Appointment appointment = findCompletedOwnedByTenant(appointmentId);
        Long barbershopId = requireTenant();

        InventoryProduct product = inventoryProductRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        if (!product.getBarbershop().getId().equals(barbershopId)) {
            throw new ForbiddenException("No tiene permisos sobre este producto");
        }

        StockMovementRequest movement = new StockMovementRequest();
        movement.setMovementType(InventoryMovement.Type.OUT);
        movement.setQuantity(request.getQuantity());
        movement.setReason("Venta en cita #" + appointmentId);
        inventoryService.registerMovement(product.getId(), TenantContext.getUserId(), movement);

        BigDecimal subtotal = request.getUnitPrice().multiply(request.getQuantity());

        AppointmentProduct line = AppointmentProduct.builder()
                .appointment(appointment)
                .product(product)
                .quantity(request.getQuantity())
                .unitPrice(request.getUnitPrice())
                .subtotal(subtotal)
                .build();

        appointmentProductRepository.save(line);

        // Si ya habia una promocion aplicada, el total de productos cambio: recalcular el descuento.
        if (appointment.getPromotion() != null) {
            recalculateDiscount(appointment);
            appointmentRepository.save(appointment);
        }

        syncFinanceIncome(appointment);

        return toDetail(appointment);
    }

    @Transactional
    public InvoiceDetailResponse applyPromotion(Long appointmentId, ApplyPromotionRequest request) {
        Appointment appointment = findCompletedOwnedByTenant(appointmentId);
        Long barbershopId = requireTenant();

        Promotion promotion = promotionRepository.findByIdAndBarbershopId(request.getPromotionId(), barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Promocion no encontrada"));

        LocalDate today = LocalDate.now();
        if (!Boolean.TRUE.equals(promotion.getIsActive())
                || promotion.getValidFrom().isAfter(today) || promotion.getValidTo().isBefore(today)) {
            throw new BadRequestException("Esta promocion no esta activa ni vigente");
        }

        appointment.setPromotion(promotion);
        recalculateDiscount(appointment);
        appointmentRepository.save(appointment);

        syncFinanceIncome(appointment);

        return toDetail(appointment);
    }

    @Transactional
    public InvoiceDetailResponse removePromotion(Long appointmentId) {
        Appointment appointment = findCompletedOwnedByTenant(appointmentId);

        appointment.setPromotion(null);
        appointment.setDiscountAmount(BigDecimal.ZERO);
        appointmentRepository.save(appointment);

        syncFinanceIncome(appointment);

        return toDetail(appointment);
    }

    // =====================================================================
    // BARBERO
    // =====================================================================

    /** Historial de cortes completados del barbero autenticado (solo lectura). */
    public List<AppointmentResponse> getMyHistoryAsBarber(Long userId) {
        BarberProfile profile = barberProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de barbero no encontrado"));

        return appointmentRepository
                .findByBarberIdAndStatusOrderByAppointmentDateDescStartTimeDesc(profile.getId(), AppointmentStatus.COMPLETED)
                .stream()
                .map(this::toAppointmentResponse)
                .toList();
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    private void recalculateDiscount(Appointment appointment) {
        Promotion promotion = appointment.getPromotion();
        if (promotion == null) {
            appointment.setDiscountAmount(BigDecimal.ZERO);
            return;
        }

        BigDecimal productsTotal = productsTotal(appointment.getId());
        BigDecimal baseTotal = appointment.getPriceAtBooking().add(productsTotal);

        BigDecimal discount = switch (promotion.getDiscountType()) {
            case PERCENTAGE -> baseTotal
                    .multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case FIXED_AMOUNT -> promotion.getDiscountValue().min(baseTotal);
            case TWO_FOR_ONE -> appointment.getPriceAtBooking();
        };

        appointment.setDiscountAmount(discount);
    }

    private BigDecimal productsTotal(Long appointmentId) {
        return appointmentProductRepository.findByAppointmentId(appointmentId).stream()
                .map(AppointmentProduct::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal computeTotal(Appointment a) {
        BigDecimal productsTotal = productsTotal(a.getId());
        BigDecimal discount = a.getDiscountAmount() == null ? BigDecimal.ZERO : a.getDiscountAmount();
        return a.getPriceAtBooking().add(productsTotal).subtract(discount);
    }

    /**
     * Mantiene sincronizado el ingreso de Finanzas de esta cita (creado por
     * AppointmentService al completarla) cada vez que se agrega un producto o
     * se aplica/quita una promocion, para que el admin nunca tenga que
     * anotarlo a mano ni vea un monto desactualizado en Finanzas.
     */
    private void syncFinanceIncome(Appointment appointment) {
        BigDecimal total = computeTotal(appointment);

        FinanceRecord record = financeRecordRepository.findByRelatedAppointmentId(appointment.getId())
                .orElseGet(() -> FinanceRecord.builder()
                        .barbershop(appointment.getBarbershop())
                        .type(FinanceRecord.Type.INCOME)
                        .category("Corte")
                        .recordDate(LocalDate.now())
                        .relatedAppointment(appointment)
                        .build());

        record.setAmount(total);
        record.setDescription(appointment.getService().getName() + " - " + appointment.getClient().getFullName());
        financeRecordRepository.save(record);
    }

    private Appointment findCompletedOwnedByTenant(Long appointmentId) {
        Long barbershopId = requireTenant();

        Appointment appointment = appointmentRepository.findByIdAndBarbershopId(appointmentId, barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Solo se puede facturar una cita completada");
        }

        return appointment;
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    private InvoiceSummaryResponse toSummary(Appointment a) {
        return InvoiceSummaryResponse.builder()
                .appointmentId(a.getId())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .barberId(a.getBarber().getId())
                .barberName(a.getBarber().getUser().getFullName())
                .clientName(a.getClient().getFullName())
                .serviceName(a.getService().getName())
                .total(computeTotal(a))
                .hasProducts(!appointmentProductRepository.findByAppointmentId(a.getId()).isEmpty())
                .promotionTitle(a.getPromotion() == null ? null : a.getPromotion().getTitle())
                .build();
    }

    private InvoiceDetailResponse toDetail(Appointment a) {
        List<InvoiceProductLine> lines = appointmentProductRepository.findByAppointmentId(a.getId()).stream()
                .map(p -> InvoiceProductLine.builder()
                        .id(p.getId())
                        .productId(p.getProduct().getId())
                        .productName(p.getProduct().getName())
                        .quantity(p.getQuantity())
                        .unitPrice(p.getUnitPrice())
                        .subtotal(p.getSubtotal())
                        .build())
                .toList();

        BigDecimal productsTotal = lines.stream()
                .map(InvoiceProductLine::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = a.getDiscountAmount() == null ? BigDecimal.ZERO : a.getDiscountAmount();
        BigDecimal total = computeTotal(a);

        Promotion promotion = a.getPromotion();

        return InvoiceDetailResponse.builder()
                .appointmentId(a.getId())
                .barbershopName(a.getBarbershop().getName())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .barberId(a.getBarber().getId())
                .barberName(a.getBarber().getUser().getFullName())
                .clientName(a.getClient().getFullName())
                .serviceName(a.getService().getName())
                .servicePrice(a.getPriceAtBooking())
                .products(lines)
                .productsTotal(productsTotal)
                .promotionId(promotion == null ? null : promotion.getId())
                .promotionTitle(promotion == null ? null : promotion.getTitle())
                .promotionDiscountType(promotion == null ? null : promotion.getDiscountType())
                .discountAmount(discount)
                .total(total)
                .build();
    }

    private AppointmentResponse toAppointmentResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .barbershopId(a.getBarbershop().getId())
                .clientId(a.getClient().getId())
                .clientName(a.getClient().getFullName())
                .barberId(a.getBarber().getId())
                .barberName(a.getBarber().getUser().getFullName())
                .serviceId(a.getService().getId())
                .serviceName(a.getService().getName())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .priceAtBooking(a.getPriceAtBooking())
                .notes(a.getNotes())
                .cancelledReason(a.getCancelledReason())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
