package com.barbersaas.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceSummaryResponse {
    private Long appointmentId;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private Long barberId;
    private String barberName;
    private String clientName;
    private String serviceName;
    private BigDecimal total;
    private boolean hasProducts;
    private String promotionTitle;
}
