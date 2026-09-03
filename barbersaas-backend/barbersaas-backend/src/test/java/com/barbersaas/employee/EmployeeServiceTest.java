package com.barbersaas.employee;

import com.barbersaas.domain.entity.BarberProfile;
import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.enums.Role;
import com.barbersaas.domain.repository.BarberProfileRepository;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.UserRepository;
import com.barbersaas.employee.dto.BarberPayrollResponse;
import com.barbersaas.employee.dto.UpdateBarberCommissionRequest;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.invoice.InvoiceService;
import com.barbersaas.invoice.dto.InvoiceSummaryResponse;
import com.barbersaas.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Pruebas de la nomina/comisiones: un barbero sin % propio debe usar el
 * de la barberia, uno con % propio debe usar el suyo, y el monto a pagar
 * debe calcularse sobre el mismo total que ya se ve en Facturas.
 */
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private BarbershopRepository barbershopRepository;
    @Mock private BarberProfileRepository barberProfileRepository;
    @Mock private InvoiceService invoiceService;
    @Mock private PasswordEncoder passwordEncoder;

    private EmployeeService employeeService;

    private Barbershop barbershop;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeService(
                userRepository, barbershopRepository, barberProfileRepository, invoiceService, passwordEncoder);

        barbershop = Barbershop.builder().id(1L).name("Barberia Test")
                .defaultCommissionPercentage(new BigDecimal("50.00")).build();

        TenantContext.setTenantId(1L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void getPayroll_barberoSinPorcentajePropioUsaElDeLaBarberia() {
        BarberProfile sinOverride = BarberProfile.builder().id(10L).barbershop(barbershop)
                .user(User.builder().id(20L).fullName("Andres Gomez").build())
                .commissionPercentage(null)
                .build();

        when(barbershopRepository.findById(1L)).thenReturn(Optional.of(barbershop));
        when(barberProfileRepository.findByBarbershopId(1L)).thenReturn(List.of(sinOverride));
        when(invoiceService.getMyBarbershopInvoices(any(), any(), any())).thenReturn(List.of(
                invoiceDe(10L, "100000.00"),
                invoiceDe(10L, "50000.00")
        ));

        List<BarberPayrollResponse> payroll = employeeService.getPayroll(LocalDate.now().minusDays(30), LocalDate.now());

        assertThat(payroll).hasSize(1);
        BarberPayrollResponse row = payroll.get(0);
        assertThat(row.getCutsCount()).isEqualTo(2);
        assertThat(row.getTotalRevenue()).isEqualByComparingTo("150000.00");
        assertThat(row.isUsesDefaultCommission()).isTrue();
        assertThat(row.getCommissionPercentage()).isEqualByComparingTo("50.00");
        assertThat(row.getAmountToPay()).isEqualByComparingTo("75000.00"); // 50% de 150000
    }

    @Test
    void getPayroll_barberoConPorcentajePropioIgnoraElDeLaBarberia() {
        BarberProfile conOverride = BarberProfile.builder().id(11L).barbershop(barbershop)
                .user(User.builder().id(21L).fullName("Luis Torres").build())
                .commissionPercentage(new BigDecimal("70.00"))
                .build();

        when(barbershopRepository.findById(1L)).thenReturn(Optional.of(barbershop));
        when(barberProfileRepository.findByBarbershopId(1L)).thenReturn(List.of(conOverride));
        when(invoiceService.getMyBarbershopInvoices(any(), any(), any()))
                .thenReturn(List.of(invoiceDe(11L, "100000.00")));

        List<BarberPayrollResponse> payroll = employeeService.getPayroll(LocalDate.now().minusDays(30), LocalDate.now());

        BarberPayrollResponse row = payroll.get(0);
        assertThat(row.isUsesDefaultCommission()).isFalse();
        assertThat(row.getCommissionPercentage()).isEqualByComparingTo("70.00");
        assertThat(row.getAmountToPay()).isEqualByComparingTo("70000.00"); // 70% de 100000
    }

    @Test
    void getPayroll_barberoSinCortesEnElRangoDaCeroSinRomper() {
        BarberProfile sinCortes = BarberProfile.builder().id(12L).barbershop(barbershop)
                .user(User.builder().id(22L).fullName("Sin Cortes").build())
                .build();

        when(barbershopRepository.findById(1L)).thenReturn(Optional.of(barbershop));
        when(barberProfileRepository.findByBarbershopId(1L)).thenReturn(List.of(sinCortes));
        when(invoiceService.getMyBarbershopInvoices(any(), any(), any())).thenReturn(List.of());

        List<BarberPayrollResponse> payroll = employeeService.getPayroll(LocalDate.now().minusDays(30), LocalDate.now());

        assertThat(payroll.get(0).getCutsCount()).isZero();
        assertThat(payroll.get(0).getAmountToPay()).isEqualByComparingTo("0.00");
    }

    @Test
    void updateBarberCommission_rechazaSiElUsuarioNoEsBarbero() {
        User admin = User.builder().id(25L).barbershop(barbershop).role(Role.ADMIN_BARBERSHOP).build();
        when(userRepository.findById(25L)).thenReturn(Optional.of(admin));

        UpdateBarberCommissionRequest request = new UpdateBarberCommissionRequest();
        request.setCommissionPercentage(new BigDecimal("60"));

        assertThatThrownBy(() -> employeeService.updateBarberCommission(25L, request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateBarberCommission_rechazaEmpleadoDeOtraBarberia() {
        Barbershop otra = Barbershop.builder().id(2L).build();
        User barberoDeOtraBarberia = User.builder().id(26L).barbershop(otra).role(Role.BARBER).build();
        when(userRepository.findById(26L)).thenReturn(Optional.of(barberoDeOtraBarberia));

        UpdateBarberCommissionRequest request = new UpdateBarberCommissionRequest();
        request.setCommissionPercentage(new BigDecimal("60"));

        assertThatThrownBy(() -> employeeService.updateBarberCommission(26L, request))
                .isInstanceOf(ForbiddenException.class);
    }

    private InvoiceSummaryResponse invoiceDe(Long barberId, String total) {
        return InvoiceSummaryResponse.builder()
                .appointmentId(1L).barberId(barberId).total(new BigDecimal(total))
                .build();
    }
}
