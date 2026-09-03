package com.barbersaas.barbershop.dto;

import com.barbersaas.domain.enums.BarbershopStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarbershopResponse {
    private Long id;
    private String name;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private String phone;
    private String whatsappNumber;
    private String logoUrl;
    private BarbershopStatus status;
    private Long planId;
    private String planName;
    private String timezone;
    private Integer cancellationPolicyHours;
    private LocalDateTime createdAt;
}