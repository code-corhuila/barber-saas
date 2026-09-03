package com.barbersaas.invoice;

import com.barbersaas.domain.entity.*;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.enums.DiscountType;
import com.barbersaas.domain.repository.*;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.inventory.InventoryService;
import com.barbersaas.inventory.dto.StockMovementRequest;
import com.barbersaas.invoice.dto.*;
import com.barbersaas.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pruebas de la logica de facturacion: el calculo del total (servicio +
 * productos - descuento) para cada tipo de promocion, y el aislamiento
 * multi-tenant al acceder a una factura.
 */
@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private AppointmentProductRepository appointmentProductRepository;
    @Mock private InventoryProductRepository inventoryProductRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private BarberProfileRepository barberProfileRepository;
    @Mock private FinanceRecordRepository financeRecordRepository;
    @Mock private InventoryService inventoryService;

    private InvoiceService invoiceService;

    private Barbershop barbershop;
    private Appointment completedAppointment;

    @BeforeEach
    void setUp() {
        invoiceService = new InvoiceService(
                appointmentRepository, appointmentProductRepository, inventoryProductRepository,
                promotionRepository, barberProfileRepository, financeRecordRepository, inventoryService);

        barbershop = Barbershop.builder().id(1L).name("Barberia Test").build();

        BarberProfile barber = BarberProfile.builder().id(10L)
                .barbershop(barbershop)
                .user(User.builder().id(20L).fullName("Andres Gomez").build())
                .build();

        completedAppointment = Appointment.builder()
                .id(70L).barbershop(barbershop)
                .client(User.builder().id(30L).fullName("Maria Lopez").build())
                .barber(barber)
                .service(BarberServiceEntity.builder().id(40L).name("Corte + Barba").build())
                .status(AppointmentStatus.COMPLETED)
                .priceAtBooking(new BigDecimal("30000.00"))
                .discountAmount(BigDecimal.ZERO)
                .build();

        TenantContext.setTenantId(1L);
    }

    /** Solo lo necesitan los tests que efectivamente llegan a calcular/guardar el total. */
    private void stubProductsYFinanceRecordVacios() {
        when(appointmentProductRepository.findByAppointmentId(70L)).thenReturn(List.of());
        when(financeRecordRepository.findByRelatedAppointmentId(70L))
                .thenReturn(Optional.of(FinanceRecord.builder().id(1L).build()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // =====================================================================
    // Aislamiento multi-tenant
    // =====================================================================

    @Test
    void getInvoiceDetail_lanzaNotFoundSiLaCitaEsDeOtraBarberia() {
        when(appointmentRepository.findByIdAndBarbershopId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.getInvoiceDetail(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getInvoiceDetail_rechazaCitaQueNoEstaCompletada() {
        Appointment pendiente = Appointment.builder()
                .id(71L).barbershop(barbershop).status(AppointmentStatus.PENDING).build();
        when(appointmentRepository.findByIdAndBarbershopId(71L, 1L)).thenReturn(Optional.of(pendiente));

        assertThatThrownBy(() -> invoiceService.getInvoiceDetail(71L))
                .isInstanceOf(BadRequestException.class);
    }

    // =====================================================================
    // Calculo del total segun el tipo de descuento
    // =====================================================================

    @Test
    void applyPromotion_porcentaje_descuentaSobreServicioMasProductos() {
        stubProductsYFinanceRecordVacios();
        when(appointmentRepository.findByIdAndBarbershopId(70L, 1L)).thenReturn(Optional.of(completedAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Promotion promo = promotionValida(DiscountType.PERCENTAGE, new BigDecimal("10"));
        when(promotionRepository.findByIdAndBarbershopId(5L, 1L)).thenReturn(Optional.of(promo));

        ApplyPromotionRequest request = new ApplyPromotionRequest();
        request.setPromotionId(5L);

        InvoiceDetailResponse response = invoiceService.applyPromotion(70L, request);

        // 30000 * 10% = 3000 de descuento -> total 27000
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("3000.00");
        assertThat(response.getTotal()).isEqualByComparingTo("27000.00");
    }

    @Test
    void applyPromotion_montoFijo_noPuedeDejarElTotalNegativo() {
        stubProductsYFinanceRecordVacios();
        when(appointmentRepository.findByIdAndBarbershopId(70L, 1L)).thenReturn(Optional.of(completedAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        // Descuento fijo mayor al total del servicio (30000) -> se limita al total, no queda negativo
        Promotion promo = promotionValida(DiscountType.FIXED_AMOUNT, new BigDecimal("50000"));
        when(promotionRepository.findByIdAndBarbershopId(6L, 1L)).thenReturn(Optional.of(promo));

        ApplyPromotionRequest request = new ApplyPromotionRequest();
        request.setPromotionId(6L);

        InvoiceDetailResponse response = invoiceService.applyPromotion(70L, request);

        assertThat(response.getDiscountAmount()).isEqualByComparingTo("30000.00");
        assertThat(response.getTotal()).isEqualByComparingTo("0.00");
    }

    @Test
    void applyPromotion_dosPorUno_dejaElServicioGratis() {
        stubProductsYFinanceRecordVacios();
        when(appointmentRepository.findByIdAndBarbershopId(70L, 1L)).thenReturn(Optional.of(completedAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Promotion promo = promotionValida(DiscountType.TWO_FOR_ONE, new BigDecimal("1"));
        when(promotionRepository.findByIdAndBarbershopId(7L, 1L)).thenReturn(Optional.of(promo));

        ApplyPromotionRequest request = new ApplyPromotionRequest();
        request.setPromotionId(7L);

        InvoiceDetailResponse response = invoiceService.applyPromotion(70L, request);

        assertThat(response.getDiscountAmount()).isEqualByComparingTo("30000.00");
        assertThat(response.getTotal()).isEqualByComparingTo("0.00");
    }

    @Test
    void applyPromotion_rechazaPromocionVencida() {
        when(appointmentRepository.findByIdAndBarbershopId(70L, 1L)).thenReturn(Optional.of(completedAppointment));

        Promotion vencida = Promotion.builder()
                .id(8L).barbershop(barbershop).title("Vieja")
                .discountType(DiscountType.PERCENTAGE).discountValue(new BigDecimal("10"))
                .validFrom(LocalDate.now().minusDays(60)).validTo(LocalDate.now().minusDays(30))
                .isActive(true).build();
        when(promotionRepository.findByIdAndBarbershopId(8L, 1L)).thenReturn(Optional.of(vencida));

        ApplyPromotionRequest request = new ApplyPromotionRequest();
        request.setPromotionId(8L);

        assertThatThrownBy(() -> invoiceService.applyPromotion(70L, request))
                .isInstanceOf(BadRequestException.class);

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void addProduct_descuentaStockYSumaElSubtotalAlTotal() {
        when(appointmentRepository.findByIdAndBarbershopId(70L, 1L)).thenReturn(Optional.of(completedAppointment));

        InventoryProduct product = InventoryProduct.builder().id(100L).barbershop(barbershop)
                .name("Cera para cabello").currentStock(new BigDecimal("10")).build();
        when(inventoryProductRepository.findById(100L)).thenReturn(Optional.of(product));

        AddInvoiceProductRequest request = new AddInvoiceProductRequest();
        request.setProductId(100L);
        request.setQuantity(new BigDecimal("2"));
        request.setUnitPrice(new BigDecimal("15000"));

        // Despues de guardar la linea, toDetail() vuelve a consultar los productos de la cita
        when(appointmentProductRepository.findByAppointmentId(70L))
                .thenReturn(List.of())
                .thenReturn(List.of(AppointmentProduct.builder()
                        .id(1L).product(product).quantity(new BigDecimal("2"))
                        .unitPrice(new BigDecimal("15000")).subtotal(new BigDecimal("30000"))
                        .build()));

        InvoiceDetailResponse response = invoiceService.addProduct(70L, request);

        verify(inventoryService).registerMovement(eq(100L), any(), any(StockMovementRequest.class));
        assertThat(response.getProductsTotal()).isEqualByComparingTo("30000.00");
        assertThat(response.getTotal()).isEqualByComparingTo("60000.00"); // 30000 servicio + 30000 producto
    }

    private Promotion promotionValida(DiscountType type, BigDecimal value) {
        return Promotion.builder()
                .id(99L).barbershop(barbershop).title("Promo test")
                .discountType(type).discountValue(value)
                .validFrom(LocalDate.now().minusDays(1)).validTo(LocalDate.now().plusDays(1))
                .isActive(true).build();
    }
}
