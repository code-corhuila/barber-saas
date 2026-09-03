package com.barbersaas.employee;

import com.barbersaas.employee.dto.BarberPayrollResponse;
import com.barbersaas.employee.dto.CreateEmployeeRequest;
import com.barbersaas.employee.dto.EmployeeResponse;
import com.barbersaas.employee.dto.UpdateBarberCommissionRequest;
import com.barbersaas.employee.dto.UpdateDefaultCommissionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
@Tag(name = "Admin Barberia - Empleados", description = "Gestion de barberos y administradores de la barberia")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @Operation(summary = "Listar empleados de mi barberia")
    public ResponseEntity<List<EmployeeResponse>> getEmployees() {
        return ResponseEntity.ok(employeeService.getEmployees());
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo empleado (barbero o administrador)")
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.create(request));
    }

    @PatchMapping("/{userId}/deactivate")
    @Operation(summary = "Desactivar un empleado de mi barberia")
    public ResponseEntity<Void> deactivate(@PathVariable Long userId) {
        employeeService.deactivate(userId);
        return ResponseEntity.noContent().build();
    }

    // =====================================================================
    // COMISIONES Y NOMINA
    // =====================================================================

    @GetMapping("/commission-default")
    @Operation(summary = "Ver el % de comision por defecto de mi barberia")
    public ResponseEntity<Map<String, BigDecimal>> getDefaultCommission() {
        return ResponseEntity.ok(Map.of("defaultCommissionPercentage", employeeService.getDefaultCommission()));
    }

    @PatchMapping("/commission-default")
    @Operation(summary = "Cambiar el % de comision por defecto de mi barberia")
    public ResponseEntity<Void> updateDefaultCommission(@Valid @RequestBody UpdateDefaultCommissionRequest request) {
        employeeService.updateDefaultCommission(request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/commission")
    @Operation(summary = "Configurar (o quitar) el % de comision propio de un barbero")
    public ResponseEntity<Void> updateBarberCommission(@PathVariable Long userId,
                                                         @Valid @RequestBody UpdateBarberCommissionRequest request) {
        employeeService.updateBarberCommission(userId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/payroll")
    @Operation(summary = "Nomina: cortes hechos y cuanto pagarle a cada barbero en un rango de fechas")
    public ResponseEntity<List<BarberPayrollResponse>> getPayroll(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(employeeService.getPayroll(from, to));
    }
}