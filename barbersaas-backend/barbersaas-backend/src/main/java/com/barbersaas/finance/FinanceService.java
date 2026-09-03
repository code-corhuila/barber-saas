package com.barbersaas.finance;

import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.FinanceRecord;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.FinanceRecordRepository;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.finance.dto.FinanceRecordRequest;
import com.barbersaas.finance.dto.FinanceRecordResponse;
import com.barbersaas.finance.dto.FinanceSummaryResponse;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final FinanceRecordRepository financeRecordRepository;
    private final BarbershopRepository barbershopRepository;

    @Transactional
    public FinanceRecordResponse create(FinanceRecordRequest request) {
        Long barbershopId = requireTenant();

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        FinanceRecord record = FinanceRecord.builder()
                .barbershop(barbershop)
                .type(request.getType())
                .category(request.getCategory())
                .amount(request.getAmount())
                .description(request.getDescription())
                .recordDate(request.getRecordDate())
                .build();

        return toResponse(financeRecordRepository.save(record));
    }

    public List<FinanceRecordResponse> getRecords(LocalDate from, LocalDate to) {
        Long barbershopId = requireTenant();

        return financeRecordRepository
                .findByBarbershopIdAndRecordDateBetweenOrderByRecordDateDesc(barbershopId, from, to).stream()
                .map(this::toResponse)
                .toList();
    }

    public FinanceSummaryResponse getSummary(LocalDate from, LocalDate to) {
        Long barbershopId = requireTenant();

        var income = financeRecordRepository.sumByTypeAndDateRange(barbershopId, FinanceRecord.Type.INCOME, from, to);
        var expenses = financeRecordRepository.sumByTypeAndDateRange(barbershopId, FinanceRecord.Type.EXPENSE, from, to);

        return FinanceSummaryResponse.builder()
                .totalIncome(income)
                .totalExpenses(expenses)
                .netProfit(income.subtract(expenses))
                .build();
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    private FinanceRecordResponse toResponse(FinanceRecord record) {
        return FinanceRecordResponse.builder()
                .id(record.getId())
                .type(record.getType())
                .category(record.getCategory())
                .amount(record.getAmount())
                .description(record.getDescription())
                .recordDate(record.getRecordDate())
                .build();
    }
}