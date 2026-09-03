package com.barbersaas.finance.dto;

import com.barbersaas.domain.entity.FinanceRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceRecordResponse {
    private Long id;
    private FinanceRecord.Type type;
    private String category;
    private BigDecimal amount;
    private String description;
    private LocalDate recordDate;
}