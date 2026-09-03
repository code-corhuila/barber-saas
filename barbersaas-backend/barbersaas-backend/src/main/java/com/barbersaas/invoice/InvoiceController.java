package com.barbersaas.invoice;

import com.barbersaas.appointment.dto.AppointmentResponse;
import com.barbersaas.invoice.dto.*;
import com.barbersaas.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Facturas", description = "Facturas por cita: servicio + productos + promocion")
public class InvoiceController {

    private final InvoiceService invoiceService;

    // =====================================================================
    // ADMIN
    // =====================================================================

    @GetMapping("/api/admin/invoices")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Listar facturas de citas completadas de mi barberia en un rango, opcionalmente por barbero")
    public ResponseEntity<List<InvoiceSummaryResponse>> getInvoices(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long barberId) {
        return ResponseEntity.ok(invoiceService.getMyBarbershopInvoices(from, to, barberId));
    }

    @GetMapping("/api/admin/invoices/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Ver el detalle completo de una factura")
    public ResponseEntity<InvoiceDetailResponse> getInvoiceDetail(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(invoiceService.getInvoiceDetail(appointmentId));
    }

    @PostMapping("/api/admin/invoices/{appointmentId}/products")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Agregar un producto vendido durante la visita (descuenta stock)")
    public ResponseEntity<InvoiceDetailResponse> addProduct(@PathVariable Long appointmentId,
                                                              @Valid @RequestBody AddInvoiceProductRequest request) {
        return ResponseEntity.ok(invoiceService.addProduct(appointmentId, request));
    }

    @PostMapping("/api/admin/invoices/{appointmentId}/promotion")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Aplicar una promocion a la factura")
    public ResponseEntity<InvoiceDetailResponse> applyPromotion(@PathVariable Long appointmentId,
                                                                  @Valid @RequestBody ApplyPromotionRequest request) {
        return ResponseEntity.ok(invoiceService.applyPromotion(appointmentId, request));
    }

    @DeleteMapping("/api/admin/invoices/{appointmentId}/promotion")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Quitar la promocion aplicada a la factura")
    public ResponseEntity<InvoiceDetailResponse> removePromotion(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(invoiceService.removePromotion(appointmentId));
    }

    // =====================================================================
    // BARBERO
    // =====================================================================

    @GetMapping("/api/barber/history")
    @PreAuthorize("hasRole('BARBER')")
    @Operation(summary = "Ver mi historial de cortes completados (solo lectura)")
    public ResponseEntity<List<AppointmentResponse>> getMyHistory() {
        Long userId = TenantContext.getUserId();
        return ResponseEntity.ok(invoiceService.getMyHistoryAsBarber(userId));
    }
}
