package com.barbersaas.appointment.dto;

import com.barbersaas.domain.enums.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    private Long id;
    private Long barbershopId;
    private Long clientId;
    private String clientName;
    private Long barberId;
    private String barberName;
    private Long serviceId;
    private String serviceName;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private BigDecimal priceAtBooking;
    private String notes;
    private String cancelledReason;
    private LocalDateTime createdAt;
}