package com.barbersaas.finance;

import com.barbersaas.finance.dto.FinanceRecordRequest;
import com.barbersaas.finance.dto.FinanceRecordResponse;
import com.barbersaas.finance.dto.FinanceSummaryResponse;
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
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
@Tag(name = "Finanzas", description = "Ingresos, gastos y utilidad")
public class FinanceController {

    private final FinanceService financeService;

    @PostMapping("/records")
    @Operation(summary = "Registrar un ingreso o gasto")
    public ResponseEntity<FinanceRecordResponse> create(@Valid @RequestBody FinanceRecordRequest request) {
        return ResponseEntity.ok(financeService.create(request));
    }

    @GetMapping("/records")
    @Operation(summary = "Listar movimientos financieros en un rango de fechas")
    public ResponseEntity<List<FinanceRecordResponse>> getRecords(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(financeService.getRecords(from, to));
    }

    @GetMapping("/summary")
    @Operation(summary = "Resumen de ingresos, gastos y utilidad neta en un rango de fechas")
    public ResponseEntity<FinanceSummaryResponse> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(financeService.getSummary(from, to));
    }
}