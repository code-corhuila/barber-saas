package com.barbersaas.loyalty.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyConfigResponse {
    private Long id;
    private Integer stickersRequired;
    private String rewardDescription;
    private Boolean isActive;
}