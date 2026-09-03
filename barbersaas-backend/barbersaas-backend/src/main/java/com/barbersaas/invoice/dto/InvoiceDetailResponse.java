package com.barbersaas.invoice.dto;

import com.barbersaas.domain.enums.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDetailResponse {
    private Long appointmentId;
    private String barbershopName;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private Long barberId;
    private String barberName;
    private String clientName;
    private String serviceName;
    private BigDecimal servicePrice;
    private List<InvoiceProductLine> products;
    private BigDecimal productsTotal;
    private Long promotionId;
    private String promotionTitle;
    private DiscountType promotionDiscountType;
    private BigDecimal discountAmount;
    private BigDecimal total;
}
